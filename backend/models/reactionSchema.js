import mongoose from 'mongoose';

/**
 * EMOJI REACTION SCHEMA (shared sub-document)
 * ----------------------------------------------------------------------------
 * A single emoji reaction by one user, embedded in posts, comments, messages
 * and message replies. { _id: false } keeps these lightweight — a reaction is
 * identified by its (emoji, userId) pair, not by its own id.
 *
 * Shared from one place so every content type stores reactions identically and
 * `utils/emojiReaction.js` can operate on any of them.
 *
 * This is NOT a standalone model — it's a reusable sub-schema exported for
 * embedding inside other schemas via `type: [emojiReactionSchema]`.
 */
export const emojiReactionSchema = new mongoose.Schema(
  {
    // The emoji character string (e.g., "👍", "🔥", "😂").
    emoji: { type: String, required: true },
    // The user who reacted (references the User collection). Together with
    // `emoji`, forms the unique key — a user can only react once per emoji.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { _id: false } // No separate ObjectId — keeps embedded docs lightweight.
);
