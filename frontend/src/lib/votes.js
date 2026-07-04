/**
 * VOTING / REACTION UTILITIES
 * ----------------------------------------------------------------------------
 * Pure helper functions for computing vote state and applying optimistic
 * updates to votable entities (posts, comments, chat messages). These are
 * used by the posts slice, chat slice, and UI components to instantly reflect
 * user actions before the API confirms them.
 */

/**
 * Determine the current user's vote from likes/dislikes ID arrays.
 * @param {Array<string>} likes    - Array of user IDs who liked.
 * @param {Array<string>} dislikes - Array of user IDs who disliked.
 * @param {string}        userId   - The current user's ID.
 * @returns {'like'|'dislike'|null} The user's current vote, or null if none.
 */
export function voteFromArrays(likes = [], dislikes = [], userId) {
  if (!userId) return null;
  const uid = String(userId);
  if (likes.some((id) => String(id) === uid)) return 'like';
  if (dislikes.some((id) => String(id) === uid)) return 'dislike';
  return null;
}

/**
 * Apply an optimistic like/dislike/none action to any votable entity.
 * Removes the user from both arrays first, then adds to the appropriate one.
 * Returns a new entity with updated likes, dislikes, counts, score, and myVote.
 * @param {Object} entity         - The votable entity (post, comment, message).
 * @param {'like'|'dislike'|'none'} action - The vote action to apply.
 * @param {string} userId         - The current user's ID.
 * @returns {Object} A new entity object with updated vote fields.
 */
export function applyOptimisticVote(entity, action, userId) {
  const uid = String(userId);
  const likes = (entity.likes || []).map(String).filter((id) => id !== uid);
  const dislikes = (entity.dislikes || []).map(String).filter((id) => id !== uid);

  let myVote = null;
  if (action === 'like') {
    likes.push(uid);
    myVote = 'like';
  } else if (action === 'dislike') {
    dislikes.push(uid);
    myVote = 'dislike';
  }

  const likeCount = likes.length;
  const dislikeCount = dislikes.length;

  return {
    ...entity,
    likes,
    dislikes,
    likeCount,
    dislikeCount,
    score: likeCount - dislikeCount,
    myVote,
  };
}

/**
 * Toggle an emoji reaction optimistically on a chat message.
 * Each user can have at most one instance of each emoji. If the same emoji
 * already exists for this user, it's removed (toggle off); otherwise added.
 * @param {Object} entity  - The chat message entity with a reactions array.
 * @param {string} emoji   - The emoji character to toggle.
 * @param {string} userId  - The current user's ID.
 * @returns {Object} A new entity with the updated reactions array.
 */
export function applyOptimisticEmoji(entity, emoji, userId) {
  const uid = String(userId);
  const reactions = (entity.reactions || []).filter((r) => String(r.userId) !== uid);
  const existing = (entity.reactions || []).find(
    (r) => String(r.userId) === uid && r.emoji === emoji
  );
  if (!existing) reactions.push({ emoji, userId: uid });

  return { ...entity, reactions };
}
