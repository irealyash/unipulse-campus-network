import Community from '../models/Community.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { assertCommunityAccess, visibleCommunitiesFilter } from '../utils/membership.js';
import { withCommunityImage } from '../utils/avatars.js';

/**
 * COMMUNITY CONTROLLER
 * ----------------------------------------------------------------------------
 * Communities come in two flavours (see Community model):
 *   - general : visible to everyone (chess, housing, marketplace...)
 *   - course  : visible only to enrolled students (CPSC-110-101...)
 */

/**
 * GET /api/communities
 * Returns everything THIS user can see: all general communities plus the course
 * communities matching their enrolledSections. Course rooms they aren't in are
 * hidden entirely (they shouldn't even know the room exists in their feed).
 */
export const listCommunities = asyncHandler(async (req, res) => {
  const communities = await Community.find(visibleCommunitiesFilter(req.user)).sort({
    type: 1,
    name: 1,
  });

  res.json({
    success: true,
    count: communities.length,
    communities: communities.map((c) => withCommunityImage(c)),
  });
});

/**
 * GET /api/communities/:id
 * Returns a single community after verifying the user is allowed to view it.
 */
export const getCommunity = asyncHandler(async (req, res) => {
  // assertCommunityAccess both fetches the doc and enforces the access rules.
  const community = await assertCommunityAccess(req.user, req.params.id);
  res.json({ success: true, community: withCommunityImage(community) });
});

/**
 * POST /api/communities
 * Body: { id?, name, description?, allowedTags? }
 * Lets a student spin up a new GENERAL interest community. Course communities
 * are never created here — those are auto-provisioned from schedule uploads.
 */
export const createCommunity = asyncHandler(async (req, res) => {
  const { name, description, allowedTags, imageUrl } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, 'Community name is required.');
  }

  // Derive a URL-safe id from the provided id or the name (e.g. "Chess Club" -> "chess-club").
  const rawId = (req.body.id || name).toString().trim().toLowerCase();
  const id = rawId.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  if (!id) {
    throw new ApiError(400, 'Could not derive a valid community id from the name.');
  }

  const exists = await Community.findById(id);
  if (exists) {
    throw new ApiError(409, `A community with id "${id}" already exists.`);
  }

  const community = await Community.create({
    _id: id,
    name: name.trim(),
    description: description?.trim() || '',
    imageUrl: imageUrl?.trim() || null,
    type: 'general',
    allowedTags:
      Array.isArray(allowedTags) && allowedTags.length ? allowedTags : ['general']
  });

  res.status(201).json({ success: true, community: withCommunityImage(community) });
});
