import Community from '../models/Community.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import {
  assertCommunityAccess,
  navbarCommunitiesFilter,
} from '../utils/membership.js';
import { withCommunityImage } from '../utils/avatars.js';
import { CATALOG_CATEGORIES } from '../utils/communityCategories.js';

/**
 * GET /api/communities
 * Communities in the user's left navbar (joined catalog + course sections).
 */
export const listCommunities = asyncHandler(async (req, res) => {
  const communities = await Community.find(navbarCommunitiesFilter(req.user)).sort({
    type: 1,
    category: 1,
    name: 1,
  });

  res.json({
    success: true,
    count: communities.length,
    communities: communities.map((c) => withCommunityImage(c)),
  });
});

/**
 * GET /api/communities/catalog?category=international|academic|residence|general
 * Browse public catalog communities for onboarding / add-community flows.
 */
export const listCatalog = asyncHandler(async (req, res) => {
  const { category, search } = req.query;

  if (!category || !CATALOG_CATEGORIES.includes(category)) {
    throw new ApiError(
      400,
      `category is required (${CATALOG_CATEGORIES.join(', ')}).`
    );
  }

  const filter = {
    type: 'general',
    private: false,
    category,
  };

  if (search?.trim()) {
    const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { _id: rx }];
  }

  const communities = await Community.find(filter).sort({ name: 1 }).limit(500);

  res.json({
    success: true,
    count: communities.length,
    communities: communities.map((c) => withCommunityImage(c)),
  });
});

/**
 * GET /api/communities/:id
 */
export const getCommunity = asyncHandler(async (req, res) => {
  const community = await assertCommunityAccess(req.user, req.params.id);
  res.json({ success: true, community: withCommunityImage(community) });
});
