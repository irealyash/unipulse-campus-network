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
 * COMMUNITY CONTROLLER
 * ----------------------------------------------------------------------------
 * Read-only endpoints for communities. Users see two slices:
 *   1. **Navbar communities** — the sidebar list of communities they belong to
 *      (their enrolled course sections + any public catalog communities they
 *      explicitly joined).
 *   2. **Catalog browsing** — the full directory of public communities,
 *      filterable by category and searchable by name, used during onboarding
 *      and the "add community" flow.
 *
 * Community creation and mutation live in moderatorController (moderators only).
 */

/**
 * GET /api/communities
 * Returns the communities that appear in the authenticated user's left navbar.
 * Includes both joined catalog communities and enrolled course sections.
 * Sorted by type, category, then name for stable sidebar ordering.
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
 * GET /api/communities/catalog?category=international|academic|residence|general&search=
 * Returns public catalog communities in the given category, optionally filtered
 * by a case-insensitive search term matching the name or id.
 * Expects: query param `category` (required, one of CATALOG_CATEGORIES),
 *          optional `search` string.
 * Returns: { communities[] } sorted alphabetically, capped at 500 results.
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
 * Returns a single community by its id, after verifying the authenticated user
 * has access (enrolled in the course section or the community is public/joined).
 * Params: :id — the community's string _id (e.g. "CPSC-210-101" or "intl-korean").
 * Returns: { community } with its image URL resolved.
 */
export const getCommunity = asyncHandler(async (req, res) => {
  const community = await assertCommunityAccess(req.user, req.params.id);
  res.json({ success: true, community: withCommunityImage(community) });
});
