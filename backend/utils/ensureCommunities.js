/**
 * ensureCommunities.js
 *
 * Server startup bootstrap for community data.
 * Ensures default general communities exist, seeds the catalog when enabled,
 * and applies data migrations for legacy documents that pre-date newer schema
 * fields (e.g. status, private, category, communityOnboardingComplete).
 *
 * Called once during server initialization to keep the database consistent
 * without requiring manual migration scripts.
 */

import User from '../models/User.js';
import Community from '../models/Community.js';
import Post from '../models/Post.js';
import Event from '../models/Event.js';
import { POST_TAGS } from '../controllers/postController.js';
import { seedCommunityCatalog } from './seedCommunityCatalog.js';

/** Default general communities that every student can access without joining. */
export const GENERAL_COMMUNITIES = [
  { _id: 'general', name: 'General', description: 'Campus-wide chatter for all UBC students.' },
  { _id: 'housing', name: 'Housing', description: 'Find roommates, sublets and rentals.' },
  { _id: 'marketplace', name: 'Marketplace', description: 'Buy and sell textbooks and gear.' },
  { _id: 'events', name: 'Campus Events', description: 'What is happening around campus.' },
  { _id: 'chess', name: 'Chess Club', description: 'Casual chess matches and meetups.' },
];

/** IDs of built-in communities that moderators are not allowed to delete. */
export const PROTECTED_COMMUNITY_IDS = new Set(GENERAL_COMMUNITIES.map((c) => c._id));

/**
 * Idempotently ensures the default general communities and catalog entries exist,
 * then applies backward-compatible data migrations for legacy documents.
 *
 * Catalog seeding only runs when SEED_DEFAULT_COMMUNITIES=true so that
 * moderator deletes are not undone on every server restart.
 * Use `npm run seed` for a fresh database.
 *
 * Migrations applied:
 *   - Posts/Events without a `status` field are set to "approved"
 *   - Course communities without `private` are set to private: true
 *   - General communities without `private` are set to private: false
 *   - Communities missing a `category` get one based on their type
 *   - Users missing `communityOnboardingComplete` are back-filled
 *
 * @returns {Promise<void>}
 */
export const ensureDefaultCommunities = async () => {
  if (process.env.SEED_DEFAULT_COMMUNITIES === 'true') {
    const { total, created } = await seedCommunityCatalog();
    console.log(`[communities] catalog seed: ${created} new of ${total} entries`);
  }

  // Legacy posts/events created before moderation — treat as already approved.
  await Post.updateMany({ status: { $exists: false } }, { $set: { status: 'approved' } });
  await Event.updateMany({ status: { $exists: false } }, { $set: { status: 'approved' } });
  await Community.updateMany(
    { private: { $exists: false }, type: 'course' },
    { $set: { private: true } }
  );
  await Community.updateMany(
    { private: { $exists: false }, type: 'general' },
    { $set: { private: false } }
  );
  await Community.updateMany(
    { type: 'course', category: { $exists: false } },
    { $set: { category: 'course' } }
  );
  await Community.updateMany(
    { type: 'general', category: { $exists: false } },
    { $set: { category: 'general' } }
  );
  await User.updateMany(
    { communityOnboardingComplete: { $exists: false } },
    { $set: { joinedCommunities: [], communityOnboardingComplete: true } }
  );
};
