/**
 * Admin CLI script – grant or revoke moderator privileges for a user.
 *
 * Moderators have elevated permissions across UniPulse (e.g. managing
 * communities, removing content). This script intentionally has NO public
 * API counterpart — granting platform-wide power must be a deliberate,
 * server-side action performed by a developer or sysadmin.
 *
 * Usage:
 *   node scripts/makeModerator.js <email>            # grant moderator
 *   node scripts/makeModerator.js <email> --revoke   # remove moderator
 *
 * Or via npm:
 *   npm run make-moderator -- someone@student.ubc.ca
 *   npm run make-moderator -- someone@student.ubc.ca --revoke
 *
 * Requires a valid MONGO_URI in .env so the script can reach the database.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

const run = async () => {
  // Parse CLI arguments: first positional arg is the email, optional flag --revoke.
  const email = (process.argv[2] || '').trim().toLowerCase();
  const revoke = process.argv.includes('--revoke');

  if (!email) {
    console.error('Usage: node scripts/makeModerator.js <email> [--revoke]');
    process.exit(1);
  }

  await connectDB();

  // Look up the user by email; abort if not found.
  const user = await User.findOne({ email });
  if (!user) {
    console.error(`[make-moderator] No user found with email: ${email}`);
    await mongoose.connection.close();
    process.exit(1);
  }

  // Toggle the moderator flag and persist the change.
  user.moderator = !revoke;
  await user.save();

  console.log(
    `[make-moderator] ${email} is now ${user.moderator ? 'a MODERATOR' : 'a regular user'}.`
  );

  await mongoose.connection.close();
  process.exit(0);
};

// Entry point — catch and log unexpected errors.
run().catch(async (err) => {
  console.error('[make-moderator] failed:', err);
  process.exit(1);
});
