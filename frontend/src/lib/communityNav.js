/**
 * COMMUNITY NAVIGATION HELPERS
 * ----------------------------------------------------------------------------
 * Utility functions for determining default community selections and building
 * community chat URLs. Used by the sidebar and routing logic to decide which
 * community to show when the user first lands on the community hub.
 */

/**
 * Pick the default community to navigate to from the user's list.
 * Prefers the first joined community, then falls back to the first course community.
 * @param {Array<Object>} list - The user's community list.
 * @param {Object}        user - The current user (with joinedCommunities array).
 * @returns {string|null} The default community's _id, or null if none found.
 */
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

/**
 * Build the URL path for a community's chat tab.
 * @param {string} communityId - The community ID.
 * @returns {string} URL path like "/c/CPSC%20320-921/chat".
 */
export function communityChatPath(communityId) {
  return `/c/${encodeURIComponent(communityId)}/chat`;
}
