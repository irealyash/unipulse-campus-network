import mongoose from 'mongoose';

/**
 * MOD MESSAGE MODEL
 * ----------------------------------------------------------------------------
 * A single message within a moderator-to-user direct conversation. These are
 * the individual chat bubbles inside a ModConversation thread.
 *
 * Each message records who sent it (and their role), who received it, and
 * optional media. The frontend uses `senderRole` to style messages differently
 * for moderator vs. student.
 */

// Embedded sub-schema for optional media attachment on a mod message.
// { _id: false } keeps it lightweight — no separate ObjectId per attachment.
const modMessageMediaSchema = new mongoose.Schema(
  {
    // The URL where the media file is hosted.
    url: { type: String, required: true, trim: true },
    // The type of media: image, video, or gif (determines frontend rendering).
    mediaType: {
      type: String,
      enum: ['image', 'video', 'gif'],
      required: true,
    },
  },
  { _id: false }
);

const modMessageSchema = new mongoose.Schema({
  // The conversation thread this message belongs to (references ModConversation).
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ModConversation',
    required: true,
  },
  // The user who sent this message (references the User collection).
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Indicates whether the sender is a "moderator" or a "user" — used by the
  // frontend to align/style chat bubbles and show role badges.
  senderRole: {
    type: String,
    enum: ['moderator', 'user'],
    required: true,
  },
  // Frozen snapshot of the sender's username at message send time.
  senderUsername: {
    type: String,
    required: true,
    trim: true,
  },
  // The intended recipient of this message (references the User collection).
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // The text body of the message (can be empty if media-only).
  content: {
    type: String,
    default: '',
    trim: true,
  },
  // Optional single media attachment (image, video, or gif).
  media: {
    type: modMessageMediaSchema,
    default: null,
  },
  // Timestamp when this message was sent.
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for loading a conversation's messages in chronological order.
modMessageSchema.index({ conversationId: 1, createdAt: 1 });

// Export the ModMessage model bound to the "modmessages" collection.
export default mongoose.model('ModMessage', modMessageSchema);
