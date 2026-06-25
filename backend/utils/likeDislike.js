import ApiError from './ApiError.js';

/**
 * Applies a like/dislike to any document that has `likes` and `dislikes` arrays
 * of user ids (Post, Comment, Message and MessageReply all share this shape).
 *
 * Behaviour:
 *   action "like"    -> ensure the user is in likes, remove from dislikes
 *   action "dislike" -> ensure the user is in dislikes, remove from likes
 *   action "none"    -> remove the user from both (clears their reaction)
 *
 * A user can only ever count once in each array, so repeated calls are safe and
 * effectively toggle/replace their previous reaction.
 *
 * @param {Object} doc       - mongoose doc with likes[] and dislikes[]
 * @param {ObjectId} userId  - the reacting user's id
 * @param {string} action    - "like" | "dislike" | "none"
 */
export const applyLikeDislike = (doc, userId, action) => {
  const id = userId.toString();

  // Helper to drop the user from an array of ObjectIds.
  const without = (arr) => arr.filter((u) => u.toString() !== id);

  switch (action) {
    case 'like':
      doc.dislikes = without(doc.dislikes);
      if (!doc.likes.some((u) => u.toString() === id)) {
        doc.likes.push(userId);
      }
      break;

    case 'dislike':
      doc.likes = without(doc.likes);
      if (!doc.dislikes.some((u) => u.toString() === id)) {
        doc.dislikes.push(userId);
      }
      break;

    case 'none':
      doc.likes = without(doc.likes);
      doc.dislikes = without(doc.dislikes);
      break;

    default:
      throw new ApiError(400, 'action must be "like", "dislike" or "none".');
  }
};
