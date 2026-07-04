import mongoose from 'mongoose';
import { emojiReactionSchema } from './reactionSchema.js';

/**
 * MESSAGE REPLY
 * ----------------------------------------------------------------------------
 * A reply within a group chat — conceptually like a comment reply, but for the
 * live chat. Per the spec, a reply stores a reference to its PARENT message,
 * and that parent can itself be another reply (threaded replies).
 *
 * Because every Message and MessageReply has a globally-unique ObjectId,
 * `parentMessageId` alone is enough to walk a thread: to fetch the children of
 * any node we simply query MessageReply where parentMessageId === thatNodeId,
 * regardless of whether the parent is a root message or another reply.
 *
 * `parentType` is stored purely as a hint for the frontend (and for clarity).
 */
const messageReplySchema = new mongoose.Schema({
  // The room this reply belongs to (mirrors the parent's community).
  communityId: {
    type: String,
    required: true
  },

  // The id of the thing being replied to — a Message OR another MessageReply.
  parentMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  // Hint describing what parentMessageId points at: a root chat message, or
  // another reply (a nested reply-to-a-reply).
  parentType: {
    type: String,
    enum: ['message', 'reply'],
    default: 'message'
  },

  // The user who wrote this reply (references the User collection).
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Frozen snapshot of the sender's anonymous username at reply time.
  anonymousUsername: {
    type: String,
    required: true
  },
  // Text content of the reply (can be empty if media-only).
  content: {
    type: String,
    default: ''
  },
  // Optional single media attachment (image, video, or gif).
  media: {
    url: { type: String, default: null },
    mediaType: { type: String, enum: ['image', 'video', 'gif', null], default: null },
  },

  // Reactions, identical to Message so replies are like/dislike/emoji-able too.
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
  reactions: {
    type: [emojiReactionSchema],
    default: []
  },

  // Timestamp when this reply was created.
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Computed net score virtual for the frontend (likes minus dislikes).
messageReplySchema.virtual('score').get(function () {
  return this.likes.length - this.dislikes.length;
});
// Include virtuals in serialized output so the frontend can read "score".
messageReplySchema.set('toJSON', { virtuals: true });
messageReplySchema.set('toObject', { virtuals: true });

// Fetching the children of a node (by parent) is the core query; index it.
messageReplySchema.index({ parentMessageId: 1, createdAt: 1 });
// Also useful for moderation/listing all replies in a room.
messageReplySchema.index({ communityId: 1, createdAt: -1 });

// Export the MessageReply model bound to the "messagereplies" collection.
export default mongoose.model('MessageReply', messageReplySchema);
