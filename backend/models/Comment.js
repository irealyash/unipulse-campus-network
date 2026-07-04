import mongoose from 'mongoose';
import { emojiReactionSchema } from './reactionSchema.js';

/**
 * COMMENT MODEL
 * ----------------------------------------------------------------------------
 * Represents a comment on a post. Supports threaded replies via the `parentId`
 * self-reference: if parentId is null it's a top-level comment; otherwise it's
 * a nested reply to another comment.
 *
 * Comments share the same reaction system (likes, dislikes, emoji reactions)
 * as posts and messages for a consistent UX across the app.
 */
const commentSchema = new mongoose.Schema({
  // The post this comment belongs to (references the Post collection).
  postId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Post', 
    required: true 
  },
  // Self-reference for threading: null = root comment, ObjectId = reply to that comment.
  parentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Comment', 
    default: null 
  }, // If null, it is a root comment on the post
  // The user who wrote this comment (references the User collection).
  authorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // Frozen snapshot of the author's anonymous username at comment creation time.
  anonymousUsername: { 
    type: String, 
    required: true 
  }, // Frozen string value representing their alias at the exact time of posting
  // The text body of the comment (can be empty if media-only).
  content: { 
    type: String, 
    default: '' 
  },
  // Optional single media attachment (image, video, or gif).
  media: {
    url: { type: String, default: null },
    mediaType: { type: String, enum: ['image', 'video', 'gif', null], default: null },
  },
  // Same Reddit-style reactions used on posts (see Post.js for the rationale).
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
  // Free-form emoji reactions, identical shape to posts/messages.
  reactions: {
    type: [emojiReactionSchema],
    default: []
  },
  // Timestamp when this comment was created.
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Computed net score, exposed on JSON output for the frontend.
commentSchema.virtual('score').get(function () {
  return this.likes.length - this.dislikes.length;
});
// Include virtuals (like "score") in JSON serialization so the frontend receives them.
commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

// Index optimization for retrieving a post's full comment map efficiently
commentSchema.index({ postId: 1, parentId: 1 });

// Export the Comment model bound to the "comments" collection.
export default mongoose.model('Comment', commentSchema);