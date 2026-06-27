/** Sort navbar communities: joined order first, then course sections, then by name. */
function sortGroup(c) {
  if (c.type === 'course') return 0;
  return 1;
}

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
