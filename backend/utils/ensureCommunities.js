import Community from '../models/Community.js';

/** Default general communities every student can access. */
export const GENERAL_COMMUNITIES = [
  { _id: 'general', name: 'General', description: 'Campus-wide chatter for all UBC students.' },
  { _id: 'housing', name: 'Housing', description: 'Find roommates, sublets and rentals.' },
  { _id: 'marketplace', name: 'Marketplace', description: 'Buy and sell textbooks and gear.' },
  { _id: 'events', name: 'Campus Events', description: 'What is happening around campus.' },
  { _id: 'chess', name: 'Chess Club', description: 'Casual chess matches and meetups.' },
];

/**
 * Idempotently ensures the default general communities exist.
 * Called on server boot so a fresh DB never returns 404 for /c/general/...
 */
export const ensureDefaultCommunities = async () => {
  for (const c of GENERAL_COMMUNITIES) {
    await Community.updateOne(
      { _id: c._id },
      {
        $setOnInsert: {
          _id: c._id,
          name: c.name,
          description: c.description,
          type: 'general',
          allowedTags: ['general', 'discussion', 'question'],
        },
      },
      { upsert: true }
    );
  }
};
