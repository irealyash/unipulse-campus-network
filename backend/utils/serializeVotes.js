/**
 * serializeVotes.js
 *
 * Serialization helpers for votable content (posts, comments, messages).
 * Converts Mongoose documents into plain API-safe objects with computed
 * vote counts, net score, and the current user's vote status.
 * Used by API response handlers to ensure consistent vote metadata
 * across all content types in the application.
 */

/**
 * Converts a Mongoose document or lean query result into a plain JS object.
 * If the input has a `.toObject()` method (full Mongoose doc), it is called
 * with virtuals enabled. Otherwise, a shallow copy is returned.
 *
 * @param {Object|null} doc - Mongoose document or plain object
 * @returns {Object|null} Plain JS object, or the original falsy value
 */
const toPlain = (doc) => {
  if (!doc) return doc;
  if (typeof doc.toObject === 'function') return doc.toObject({ virtuals: true });
  return { ...doc };
};

/**
 * Enriches a votable document with computed vote metadata for API responses.
 * Mongoose virtuals are unreliable on lean/aggregate results — always use this instead.
 *
 * @param {Object} doc    - A Mongoose document or plain object with `likes` and `dislikes` arrays
 * @param {string|ObjectId|null} userId - The currently authenticated user's ID (used to compute `myVote`)
 * @returns {Object} Plain object with added fields:
 *   - likeCount {number}   - Total number of likes
 *   - dislikeCount {number} - Total number of dislikes
 *   - score {number}       - Net score (likeCount - dislikeCount)
 *   - myVote {string|null} - "like", "dislike", or null for the current user
 *   - isMine {boolean}     - Whether the current user authored this content
 *   - senderId             - Only included if the current user is the author (privacy)
 */
export const serializeVotable = (doc, userId) => {
  const d = toPlain(doc);
  const likes = d.likes || [];
  const dislikes = d.dislikes || [];
  const uid = userId?.toString();
  const senderId = d.senderId ? String(d.senderId) : null;
  const isMine = Boolean(uid && senderId && senderId === uid);

  let myVote = null;
  if (uid && likes.some((id) => String(id) === uid)) myVote = 'like';
  else if (uid && dislikes.some((id) => String(id) === uid)) myVote = 'dislike';

  const likeCount = likes.length;
  const dislikeCount = dislikes.length;

  return {
    ...d,
    senderId: isMine ? senderId : undefined,
    isMine,
    likeCount,
    dislikeCount,
    score: likeCount - dislikeCount,
    myVote,
  };
};

/**
 * Recursively serializes a nested comment tree, applying vote metadata
 * to each comment and all of its nested replies.
 *
 * @param {Array} comments - Array of comment objects, each potentially containing a `replies` array
 * @param {string|ObjectId|null} userId - The current user's ID for computing per-user vote status
 * @returns {Array} Serialized comment tree with vote metadata at every level
 */
export const serializeCommentTree = (comments, userId) =>
  (comments || []).map((c) => ({
    ...serializeVotable(c, userId),
    replies: serializeCommentTree(c.replies, userId),
  }));
