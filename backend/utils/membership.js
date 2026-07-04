/**
 * membership.js
 *
 * Community access-control and visibility utilities.
 * Centralizes the authorization logic that determines whether a user
 * can view or interact with a given community. Also provides MongoDB
 * filter builders for querying communities visible to a user (e.g.
 * for the sidebar/navbar community lists).
 *
 * Used by route handlers for posts, comments, chat, and events to
 * gate access before performing any mutations or reads.
 */

import Community from '../models/Community.js';
import ApiError from './ApiError.js';

/**
 * Checks whether a user has permission to access a community.
 *
 * Access rules:
 *   - Moderators can access any community
 *   - Public communities (private: false) are open to all verified students
 *   - Private course communities require the user's enrolledSections to include the community ID
 *   - Private general communities require the user to be in the community's members list
 *
 * @param {Object} user       - The authenticated user document
 * @param {Object} community  - The community document to check access for
 * @returns {boolean} True if the user is allowed to access the community
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

/**
 * Builds a MongoDB filter for communities visible to a user in the browse/discovery list.
 * Includes public communities, enrolled course sections, and private communities
 * where the user is an explicit member.
 *
 * @param {Object} user - The authenticated user document
 * @returns {Object} MongoDB query filter with $or conditions
 */
export const visibleCommunitiesFilter = (user) => ({
  $or: [
    { private: false },
    { _id: { $in: user.enrolledSections || [] } },
    { private: true, members: user._id },
  ],
});

/**
 * Builds a MongoDB filter for the navbar/sidebar community rail.
 * Only includes communities the user has explicitly joined plus
 * their enrolled course sections (a tighter subset than visibleCommunitiesFilter).
 *
 * @param {Object} user - The authenticated user document
 * @returns {Object} MongoDB query filter with $or conditions
 */
export const navbarCommunitiesFilter = (user) => ({
  $or: [
    { _id: { $in: user.joinedCommunities || [] } },
    { type: 'course', _id: { $in: user.enrolledSections || [] } },
  ],
});
