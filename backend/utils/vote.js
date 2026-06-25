import ApiError from './ApiError.js';

/**
 * Applies a Reddit-style vote to any document that has `upvotes` and
 * `downvotes` arrays of user ids (works for both Post and Comment).
 *
 * Behaviour:
 *   direction "up"   -> ensure the user is in upvotes, remove from downvotes
 *   direction "down" -> ensure the user is in downvotes, remove from upvotes
 *   direction "none" -> remove the user from both (clears their vote)
 *
 * A user can only ever count once in each array, so repeated calls are safe
 * and effectively toggle/replace their previous vote.
 *
 * @param {Object} doc       - mongoose doc with upvotes[] and downvotes[]
 * @param {ObjectId} userId  - the voting user's id
 * @param {string} direction - "up" | "down" | "none"
 */
export const applyVote = (doc, userId, direction) => {
  const id = userId.toString();

  // Helper to drop the user from an array of ObjectIds.
  const without = (arr) => arr.filter((u) => u.toString() !== id);

  switch (direction) {
    case 'up':
      doc.downvotes = without(doc.downvotes);
      if (!doc.upvotes.some((u) => u.toString() === id)) {
        doc.upvotes.push(userId);
      }
      break;

    case 'down':
      doc.upvotes = without(doc.upvotes);
      if (!doc.downvotes.some((u) => u.toString() === id)) {
        doc.downvotes.push(userId);
      }
      break;

    case 'none':
      doc.upvotes = without(doc.upvotes);
      doc.downvotes = without(doc.downvotes);
      break;

    default:
      throw new ApiError(400, 'Vote direction must be "up", "down" or "none".');
  }
};
