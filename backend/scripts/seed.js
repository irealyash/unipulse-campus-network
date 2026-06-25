import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Community from '../models/Community.js';

/**
 * Seed script: creates the default "general" communities every student can see
 * regardless of whether they uploaded a schedule. Run with:  npm run seed
 *
 * It is idempotent — re-running only inserts communities that don't exist yet.
 */
const GENERAL_COMMUNITIES = [
  { _id: 'general', name: 'General', description: 'Campus-wide chatter for all UBC students.' },
  { _id: 'housing', name: 'Housing', description: 'Find roommates, sublets and rentals.' },
  { _id: 'marketplace', name: 'Marketplace', description: 'Buy and sell textbooks and gear.' },
  { _id: 'events', name: 'Campus Events', description: 'What is happening around campus.' },
  { _id: 'chess', name: 'Chess Club', description: 'Casual chess matches and meetups.' }
];

const seed = async () => {
  await connectDB();

  for (const c of GENERAL_COMMUNITIES) {
    await Community.updateOne(
      { _id: c._id },
      {
        $setOnInsert: {
          _id: c._id,
          name: c.name,
          description: c.description,
          type: 'general',
          allowedTags: ['general', 'discussion', 'question']
        }
      },
      { upsert: true }
    );
    console.log(`[seed] ensured community: ${c._id}`);
  }

  await mongoose.connection.close();
  console.log('[seed] done.');
  process.exit(0);
};

seed().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
