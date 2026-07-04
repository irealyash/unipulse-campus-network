/**
 * emojiReaction.js
 *
 * Emoji reaction toggle logic for posts and chat messages.
 * Provides two variants:
 *   - toggleEmojiReaction: allows multiple different emojis per user (used by Posts)
 *   - toggleSingleEmojiReaction: limits each user to one emoji at a time (used by Comments/Chat)
 *
 * Both functions mutate the document's `reactions` subdocument array in place
 * and return "added" or "removed" to indicate the outcome.
 */

import ApiError from './ApiError.js';

/**
 * Toggles an emoji reaction for a user on a document (multi-emoji mode).
 * A user may react with multiple different emojis, but the same emoji
 * from the same user is toggled off if it already exists.
 *
 * @param {Object} doc              - Mongoose document with a `reactions` array
 * @param {ObjectId|string} userId  - The reacting user's ID
 * @param {string} emoji            - The emoji character(s) to toggle
 * @returns {string} "added" if the reaction was created, "removed" if it was toggled off
 * @throws {ApiError} 400 if emoji is empty or exceeds 16 characters
 */
export const toggleEmojiReaction = (doc, userId, emoji) => {
  const clean = (emoji || '').trim();
  if (!clean) {
    throw new ApiError(400, 'emoji is required.');
  }
  // Guard against absurdly long input being stored as an "emoji".
  if (clean.length > 16) {
    throw new ApiError(400, 'emoji is invalid.');
  }

  const id = userId.toString();
  const existingIndex = doc.reactions.findIndex(
    (r) => r.emoji === clean && r.userId.toString() === id
  );

  if (existingIndex >= 0) {
    // User already reacted with this emoji -> remove it (toggle off).
    doc.reactions.splice(existingIndex, 1);
    return 'removed';
  }

  // Otherwise add the reaction (toggle on).
  doc.reactions.push({ emoji: clean, userId });
  return 'added';
};

/**
 * Toggles an emoji reaction for a user on a document (single-emoji mode).
 * Each user is limited to one emoji at a time: setting a new emoji replaces
 * the previous one, and toggling the same emoji removes it entirely.
 *
 * @param {Object} doc              - Mongoose document with a `reactions` array
 * @param {ObjectId|string} userId  - The reacting user's ID
 * @param {string} emoji            - The emoji character(s) to toggle
 * @returns {string} "added" if the reaction was set/replaced, "removed" if toggled off
 * @throws {ApiError} 400 if emoji is empty or exceeds 16 characters
 */
export const toggleSingleEmojiReaction = (doc, userId, emoji) => {
  const clean = (emoji || '').trim();
  if (!clean) throw new ApiError(400, 'emoji is required.');
  if (clean.length > 16) throw new ApiError(400, 'emoji is invalid.');

  const id = userId.toString();
  const existing = doc.reactions.find((r) => r.userId.toString() === id);

  if (existing?.emoji === clean) {
    doc.reactions = doc.reactions.filter((r) => r.userId.toString() !== id);
    return 'removed';
  }

  doc.reactions = doc.reactions.filter((r) => r.userId.toString() !== id);
  doc.reactions.push({ emoji: clean, userId });
  return 'added';
};
