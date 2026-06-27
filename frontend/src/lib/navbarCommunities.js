/** Communities that belong in the left navbar rail. */
export function filterNavbarCommunities(list, user) {
  if (!Array.isArray(list)) return [];
  const joined = new Set(user?.joinedCommunities || []);
  const enrolled = new Set(user?.enrolledSections || []);

  return list.filter(
    (c) => joined.has(c._id) || (c.type === 'course' && enrolled.has(c._id))
  );
}
