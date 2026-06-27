/** Pick the first community in the user's navbar (joined + course sections only). */
export function pickDefaultCommunityId(list, user) {
  if (!Array.isArray(list) || list.length === 0) return null;

  const joined = user?.joinedCommunities;
  if (Array.isArray(joined) && joined.length > 0) {
    const match = list.find((c) => joined.includes(c._id));
    if (match) return match._id;
  }

  const course = list.find((c) => c.type === 'course');
  if (course) return course._id;

  return null;
}

export function communityChatPath(communityId) {
  return `/c/${encodeURIComponent(communityId)}/chat`;
}
