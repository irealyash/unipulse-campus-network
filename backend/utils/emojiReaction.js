import ApiError from './ApiError.js';

/**
 * Emoji reactions for chat. Works on any document with a `reactions` array of
 * subdocuments shaped like { emoji: String, userId: ObjectId }.
 *
 * A user may react to the same content with several DIFFERENT emojis, but only
 * once per emoji. Toggling re-applies: reacting with an emoji they already used
 * removes it.
 *
 * @param {Object} doc      - mongoose doc with a reactions[] array
 * @param {ObjectId} userId - the reacting user's id
 * @param {string} emoji    - the emoji to toggle (e.g. "🔥", "👍")
 * @returns {string} "added" or "removed" (the resulting state)
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
