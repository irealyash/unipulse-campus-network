import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

/**
 * Promotes (or demotes) a user to moderator. There is deliberately NO public
 * API for this — granting platform-wide power must be a manual, server-side act.
 *
 * Usage:
 *   node scripts/makeModerator.js <email>            # grant moderator
 *   node scripts/makeModerator.js <email> --revoke   # remove moderator
 *
 * Or via npm:
 *   npm run make-moderator -- someone@student.ubc.ca
 *   npm run make-moderator -- someone@student.ubc.ca --revoke
 */
const run = async () => {
  const email = (process.argv[2] || '').trim().toLowerCase();
  const revoke = process.argv.includes('--revoke');

  if (!email) {
    console.error('Usage: node scripts/makeModerator.js <email> [--revoke]');
    process.exit(1);
  }

  await connectDB();

  const user = await User.findOne({ email });
  if (!user) {
    console.error(`[make-moderator] No user found with email: ${email}`);
    await mongoose.connection.close();
    process.exit(1);
  }

  user.moderator = !revoke;
  await user.save();

  console.log(
    `[make-moderator] ${email} is now ${user.moderator ? 'a MODERATOR' : 'a regular user'}.`
  );

  await mongoose.connection.close();
  process.exit(0);
};

run().catch(async (err) => {
  console.error('[make-moderator] failed:', err);
  process.exit(1);
});
