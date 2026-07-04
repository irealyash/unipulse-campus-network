/**
 * Database seed script for UniPulse.
 *
 * Populates the database with all predefined communities from the community
 * catalog (international / country, academic majors, faculties, residences,
 * and general campus-wide communities).
 *
 * How to run:
 *   npm run seed          — requires a valid MONGO_URI in .env
 *
 * The script is idempotent: running it multiple times will only create
 * communities that don't already exist (upsert behaviour is handled by
 * seedCommunityCatalog).
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { seedCommunityCatalog } from '../utils/seedCommunityCatalog.js';

const seed = async () => {
  // 1. Open a connection to MongoDB using the shared config.
  await connectDB();

  // 2. Upsert every catalog entry into the communities collection.
  const { total, created } = await seedCommunityCatalog();
  console.log(`[seed] catalog: ${created} new communities (${total} total entries)`);

  // 3. Cleanly close the connection and exit.
  await mongoose.connection.close();
  console.log('[seed] done.');
  process.exit(0);
};

// Kick off the seed; surface any unexpected errors to the console.
seed().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
