/** Pick a sensible default community route after login or schedule upload. */
export function pickDefaultCommunityId(list, user) {
  if (Array.isArray(list) && list.length > 0) {
    const general = list.find((c) => c._id === 'general');
    return (general || list[0])._id;
  }
  const enrolled = user?.enrolledSections;
  if (Array.isArray(enrolled) && enrolled.length > 0) {
    return enrolled[0];
  }
  return null;
}

export function communityChatPath(communityId) {
  return `/c/${encodeURIComponent(communityId)}/chat`;
}
