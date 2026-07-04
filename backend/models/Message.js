import mongoose from 'mongoose';
import { emojiReactionSchema } from './reactionSchema.js';

/**
 * MESSAGE MODEL
 * ----------------------------------------------------------------------------
 * A single real-time chat message sent within a community's live chat room.
 * Messages are delivered instantly via Socket.io and persisted here for
 * history/scroll-back when users (re)join the room.
 *
 * Supports text, a single media attachment, Reddit-style likes/dislikes,
 * and free-form emoji reactions — same reaction system as posts and comments.
 */
const messageSchema = new mongoose.Schema({
  // The community whose chat room this message belongs to (matches Community._id).
  communityId: { 
    type: String, 
    required: true 
  }, // Links directly to a specific Socket.io channel room
  // The user who sent this message (references the User collection).
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // Frozen snapshot of the sender's anonymous username at send time.
  anonymousUsername: { 
    type: String, 
    required: true 
  },
  // The text content of the message (can be empty if media-only).
  content: { 
    type: String, 
    default: ''
  },
  // Optional single media attachment (image, video, or gif).
  media: {
    url: { type: String, default: null },
    mediaType: { type: String, enum: ['image', 'video', 'gif', null], default: null },
  },
  // Like/dislike reactions (same model as posts/comments): sets of user ids.
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
  // Free-form emoji reactions — one emoji per user (replaces any prior emoji).
  reactions: {
    type: [emojiReactionSchema],
    default: []
  },
  // Timestamp when the message was sent.
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Net like score, handy for the UI.
messageSchema.virtual('score').get(function () {
  return this.likes.length - this.dislikes.length;
});
// Ensure the "score" virtual is included when serializing to JSON/Object.
messageSchema.set('toJSON', { virtuals: true });
messageSchema.set('toObject', { virtuals: true });

// Index layout optimizes reverse-chronological pagination for initial chat load requests
messageSchema.index({ communityId: 1, createdAt: -1 });

// Export the Message model bound to the "messages" collection.
export default mongoose.model('Message', messageSchema);
