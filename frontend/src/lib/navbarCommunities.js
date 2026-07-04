/**
 * NAVBAR COMMUNITY FILTER
 * ----------------------------------------------------------------------------
 * Filters the full community list down to only those that should appear in
 * the left sidebar navigation rail. A community appears if the user has
 * explicitly joined it (catalog community) or is enrolled in it (course).
 */

/**
 * Filter communities to those belonging in the navbar.
 * Includes communities the user has joined plus course communities matching
 * the user's enrolled sections.
 * @param {Array<Object>} list - Full community list from the store.
 * @param {Object}        user - Current user with joinedCommunities and enrolledSections arrays.
 * @returns {Array<Object>} Filtered array of navbar-eligible communities.
 */
export function filterNavbarCommunities(list, user) {
  if (!Array.isArray(list)) return [];
  const joined = new Set(user?.joinedCommunities || []);
  const enrolled = new Set(user?.enrolledSections || []);

  return list.filter(
    (c) => joined.has(c._id) || (c.type === 'course' && enrolled.has(c._id))
  );
}
