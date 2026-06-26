/** Compute myVote from likes/dislikes id arrays. */
export function voteFromArrays(likes = [], dislikes = [], userId) {
  if (!userId) return null;
  const uid = String(userId);
  if (likes.some((id) => String(id) === uid)) return 'like';
  if (dislikes.some((id) => String(id) === uid)) return 'dislike';
  return null;
}

/** Apply like/dislike/none optimistically to a votable entity. */
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

/** Toggle emoji reaction optimistically (chat allows multiple emojis per user). */
export function applyOptimisticEmoji(entity, emoji, userId) {
  const uid = String(userId);
  const reactions = [...(entity.reactions || [])];
  const idx = reactions.findIndex((r) => r.emoji === emoji && String(r.userId) === uid);
  if (idx >= 0) reactions.splice(idx, 1);
  else reactions.push({ emoji, userId: uid });

  return { ...entity, reactions };
}
