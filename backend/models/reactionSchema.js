import mongoose from 'mongoose';

/**
 * A single emoji reaction by one user, embedded in posts, comments, messages
 * and message replies. { _id: false } keeps these lightweight — a reaction is
 * identified by its (emoji, userId) pair, not by its own id.
 *
 * Shared from one place so every content type stores reactions identically and
 * `utils/emojiReaction.js` can operate on any of them.
 */
export const emojiReactionSchema = new mongoose.Schema(
  {
    emoji: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { _id: false }
);
