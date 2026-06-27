import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { seedCommunityCatalog } from '../utils/seedCommunityCatalog.js';

/**
 * Seed script: creates all catalog communities (countries, majors, residences, general).
 * Run with: npm run seed
 */
const seed = async () => {
  await connectDB();
  const { total, created } = await seedCommunityCatalog();
  console.log(`[seed] catalog: ${created} new communities (${total} total entries)`);

  await mongoose.connection.close();
  console.log('[seed] done.');
  process.exit(0);
};

seed().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
