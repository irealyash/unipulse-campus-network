import Community from '../models/Community.js';
import ApiError from './ApiError.js';

/**
 * Central access-control helper used by posts, comments, chat and events.
 *
 *   - private: false  -> any verified student can view & participate
 *   - private: true + type course   -> enrolledSections must include community id
 *   - private: true + type general    -> user must be in community.members
 *   - moderators may access any community (e.g. when opening from the mod tab)
 */

export const canAccessCommunity = (user, community) => {
  if (user?.moderator) return true;
  if (!community.private) return true;
  if (community.type === 'course') {
    return Boolean(user.enrolledSections?.includes(community._id));
  }
  return Boolean(
    community.members?.some((id) => id.toString() === user._id.toString())
  );
};

/**
 * @param {Object} user        - the authenticated user document
 * @param {string} communityId - the community _id (e.g. "CPSC-110-101")
 * @returns {Promise<Object>}  - the community document if access is granted
 * @throws {ApiError}          - 404 if missing, 403 if not allowed
 */
export const assertCommunityAccess = async (user, communityId) => {
  const community = await Community.findById(communityId);
  if (!community) {
    throw new ApiError(404, `Community "${communityId}" not found`);
  }

  if (!canAccessCommunity(user, community)) {
    const hint =
      community.type === 'course'
        ? 'Upload your class schedule (.xlsx) with this course to join.'
        : 'This is a private community. Ask a moderator to add you.';
    throw new ApiError(403, hint);
  }

  return community;
};

/** Mongo filter: communities visible in a user's community list. */
export const visibleCommunitiesFilter = (user) => ({
  $or: [
    { private: false },
    { _id: { $in: user.enrolledSections || [] } },
    { private: true, members: user._id },
  ],
});

/** Navbar rail: joined catalog communities + enrolled course sections. */
export const navbarCommunitiesFilter = (user) => ({
  $or: [
    { _id: { $in: user.joinedCommunities || [] } },
    { type: 'course', _id: { $in: user.enrolledSections || [] } },
  ],
});
