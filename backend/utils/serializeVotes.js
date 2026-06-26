/** Plain object from a mongoose doc or lean result. */
const toPlain = (doc) => {
  if (!doc) return doc;
  if (typeof doc.toObject === 'function') return doc.toObject({ virtuals: true });
  return { ...doc };
};

/**
 * Adds likeCount, dislikeCount, score and myVote to any doc with likes/dislikes arrays.
 * Mongoose virtuals are unreliable on lean/aggregate results — always use this in API responses.
 */
export const serializeVotable = (doc, userId) => {
  const d = toPlain(doc);
  const likes = d.likes || [];
  const dislikes = d.dislikes || [];
  const uid = userId?.toString();

  let myVote = null;
  if (uid && likes.some((id) => String(id) === uid)) myVote = 'like';
  else if (uid && dislikes.some((id) => String(id) === uid)) myVote = 'dislike';

  const likeCount = likes.length;
  const dislikeCount = dislikes.length;

  return {
    ...d,
    likeCount,
    dislikeCount,
    score: likeCount - dislikeCount,
    myVote,
  };
};

/** Recursively serialize a nested comment tree. */
export const serializeCommentTree = (comments, userId) =>
  (comments || []).map((c) => ({
    ...serializeVotable(c, userId),
    replies: serializeCommentTree(c.replies, userId),
  }));
