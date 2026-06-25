import Community from '../models/Community.js';
import ApiError from './ApiError.js';

/**
 * Central access-control helper used by posts, comments, chat and events.
 *
 * Rules (straight from the product spec):
 *   - "general" communities  -> any verified student can view & participate.
 *   - "course"  communities  -> only students whose `enrolledSections` array
 *                               contains this community id may participate.
 *                               Students who skipped the schedule upload simply
 *                               never have the section id, so they're excluded.
 *
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

  // Course communities are gated behind enrollment.
  if (community.type === 'course') {
    const enrolled = user.enrolledSections?.includes(community._id);
    if (!enrolled) {
      throw new ApiError(
        403,
        'This is a course-specific community. Upload your class schedule with this course to join.'
      );
    }
  }

  return community;
};

/**
 * Non-throwing variant: returns true/false. Handy for filtering lists where we
 * just want to hide communities the user cannot access.
 */
export const canAccessCommunity = (user, community) => {
  if (community.type === 'general') return true;
  return Boolean(user.enrolledSections?.includes(community._id));
};
