import User from '../models/User.js';
import Community from '../models/Community.js';
import Post from '../models/Post.js';
import Event from '../models/Event.js';
import { POST_TAGS } from '../controllers/postController.js';
import { seedCommunityCatalog } from './seedCommunityCatalog.js';

/** Default general communities every student can access. */
export const GENERAL_COMMUNITIES = [
  { _id: 'general', name: 'General', description: 'Campus-wide chatter for all UBC students.' },
  { _id: 'housing', name: 'Housing', description: 'Find roommates, sublets and rentals.' },
  { _id: 'marketplace', name: 'Marketplace', description: 'Buy and sell textbooks and gear.' },
  { _id: 'events', name: 'Campus Events', description: 'What is happening around campus.' },
  { _id: 'chess', name: 'Chess Club', description: 'Casual chess matches and meetups.' },
];

/** Built-in communities that cannot be deleted by moderators. */
export const PROTECTED_COMMUNITY_IDS = new Set(GENERAL_COMMUNITIES.map((c) => c._id));

/**
 * Idempotently ensures the default general communities exist.
 * Only runs when SEED_DEFAULT_COMMUNITIES=true so moderator deletes are not
 * undone on every server restart. Use `npm run seed` for a fresh DB.
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
