import ApiError from './ApiError.js';

/**
 * Emoji reactions for chat. Works on any document with a `reactions` array of
 * subdocuments shaped like { emoji: String, userId: ObjectId }.
 *
 * A user may react with several DIFFERENT emojis, but only once per emoji.
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
 * Comments allow only ONE emoji reaction per user (replaces any prior emoji).
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
