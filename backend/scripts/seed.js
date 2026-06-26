import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { ensureDefaultCommunities } from '../utils/ensureCommunities.js';

/**
 * Seed script: creates the default "general" communities every student can see
 * regardless of whether they uploaded a schedule. Run with:  npm run seed
 *
 * It is idempotent — re-running only inserts communities that don't exist yet.
 */
const seed = async () => {
  await connectDB();
  await ensureDefaultCommunities();

  for (const c of ['general', 'housing', 'marketplace', 'events', 'chess']) {
    console.log(`[seed] ensured community: ${c}`);
  }

  await mongoose.connection.close();
  console.log('[seed] done.');
  process.exit(0);
};

seed().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
