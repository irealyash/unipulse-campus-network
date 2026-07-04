import mongoose from 'mongoose';
import { emojiReactionSchema } from './reactionSchema.js';

/**
 * POST MODEL
 * ----------------------------------------------------------------------------
 * A user-submitted post within a community. Posts go through moderator review
 * (pending -> approved/rejected) before appearing in public feeds.
 *
 * Supports text content, media attachments, community tags, Reddit-style
 * like/dislike voting, and free-form emoji reactions.
 */
const postSchema = new mongoose.Schema({
    // The community this post belongs to (references Community._id string slug).
    communityId: {
        type: String,
        required: true
    }, // e.g., "CPSC-110-L1A" or "General"
    // References the User who authored this post.
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
    // The headline/subject of the post (displayed prominently in feeds).
    title: {
        type: String,
        required: true,
        trim: true
    },
    // Array of attached media items (images, videos, gifs). Each entry stores
    // a URL and its media type for the frontend to render appropriately.
    media: {
        type: [{
            url: { type: String, required: true },
            mediaType: {
                type: String,
                enum: ['image', 'video', 'gif'],
                required: true
            }
        }],
        default: []
    },
    // Optional community-specific tag for categorizing the post (e.g., "exam", "meme").
    tag: {
        type: String,
        default: null,
        trim: true
    },
    // The main body text of the post.
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
    // All new posts start pending; moderators approve before they appear in feeds.
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    // The moderator (User) who approved or rejected this post.
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // Timestamp when the moderator reviewed this post.
    reviewedAt: {
        type: Date,
        default: null
    },
    // Timestamp when the post was originally created/submitted.
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
postSchema.index({ communityId: 1, status: 1, createdAt: -1 });
postSchema.index({ status: 1, createdAt: -1 });

// Export the Post model bound to the "posts" collection.
export default mongoose.model('Post', postSchema);