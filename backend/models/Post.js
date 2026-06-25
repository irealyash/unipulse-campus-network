import mongoose from 'mongoose';
import { emojiReactionSchema } from './reactionSchema.js';

const postSchema = new mongoose.Schema({
    communityId: {
        type: String,
        required: true
    }, // e.g., "CPSC-110-L1A" or "General"
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Frozen alias of the author at the moment of posting. Because usernames can be
    // changed weekly, we snapshot it here so the post keeps showing the name it was
    // posted under instead of silently updating everywhere.
    anonymousUsername: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    media: {
        url: {
            type: String,
            default: null
        }, // The public cloud storage link (e.g., AWS S3 or Cloudinary URL)
        mediaType: {
            type: String,
            enum: ['image', 'video', null],
            default: null
        } // Helps the frontend immediately know whether to render an <img> or <video> tag
    },
    tag: {
        type: String,
        default: null,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    // Reddit-style reactions. We store the set of user ids who liked/disliked so a
    // single user can only count once and can toggle their reaction. The net score
    // is derived as (likes.length - dislikes.length) in the controller / virtuals.
    likes: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: []
    },
    dislikes: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: []
    },
    // Free-form emoji reactions (👍🔥😂...). A user may add several different
    // emojis but only once per emoji (enforced in utils/emojiReaction.js).
    reactions: {
        type: [emojiReactionSchema],
        default: []
    },
    // Running count of comments so feeds can show "X comments" without a second query.
    commentCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Convenient computed score that the frontend can read directly off serialized posts.
postSchema.virtual('score').get(function () {
    return this.likes.length - this.dislikes.length;
});

// Make sure virtuals (like "score") are included when documents are converted to JSON.
postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

// Compound index to serve a community's feed sorted by newest posts instantly
postSchema.index({ communityId: 1, createdAt: -1 });

export default mongoose.model('Post', postSchema);