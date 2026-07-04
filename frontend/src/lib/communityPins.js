/**
 * COMMUNITY SORTING / PINNING
 * ----------------------------------------------------------------------------
 * Sorts the navbar community list for display. Pinned communities (the user's
 * explicitly joined catalog communities) appear first in their pinned order,
 * followed by course communities, then other communities alphabetically.
 * Used by the sidebar to present a consistent, user-customizable ordering.
 */

/**
 * Assign a sort group to a community: courses first (0), then others (1).
 * @param {Object} c - Community object.
 * @returns {number} Sort group index.
 */
function sortGroup(c) {
  if (c.type === 'course') return 0;
  return 1;
}

/**
 * Sort a list of communities for navbar display.
 * Sort priority: pinned communities (in pin order) → course communities → alphabetical.
 * @param {Array<Object>}  list      - Array of community objects.
 * @param {Array<string>}  pinnedIds - Ordered array of pinned community IDs.
 * @returns {Array<Object>} A new sorted array (does not mutate the input).
 */
export function sortCommunities(list, pinnedIds = []) {
  const pinIndex = new Map(pinnedIds.map((id, i) => [id, i]));

  return [...list].sort((a, b) => {
    const aCourse = a.type === 'course';
    const bCourse = b.type === 'course';
    const aPin = pinIndex.get(a._id);
    const bPin = pinIndex.get(b._id);
    const aPinned = aPin !== undefined;
    const bPinned = bPin !== undefined;

    if (aPinned && bPinned) return aPin - bPin;
    if (aPinned) return -1;
    if (bPinned) return 1;
    if (aCourse && !bCourse) return -1;
    if (!aCourse && bCourse) return 1;

    const groupDiff = sortGroup(a) - sortGroup(b);
    if (groupDiff !== 0) return groupDiff;

    return (a.name || a._id).localeCompare(b.name || b._id, undefined, { sensitivity: 'base' });
  });
}
