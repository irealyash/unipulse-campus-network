/**
 * Idempotently upserts the recruiter demo accounts so login always works
 * with the published credentials (even after a password change or fresh DB).
 */

import User from '../models/User.js';
import { hashPassword } from './password.js';
import { DEMO_ACCOUNTS } from './demoAccounts.js';

export const ensureDemoUsers = async () => {
  for (const account of DEMO_ACCOUNTS) {
    const passwordHash = await hashPassword(account.password);
    const existing = await User.findOne({ email: account.email }).select('+password');

    if (existing) {
      existing.password = passwordHash;
      existing.moderator = account.moderator;
      existing.isBanned = false;
      existing.communityOnboardingComplete = true;
      // Keep username stable when free; otherwise leave whatever they have.
      if (existing.username !== account.username) {
        const taken = await User.findOne({
          username: account.username,
          _id: { $ne: existing._id },
        });
        if (!taken) existing.username = account.username;
      }
      await existing.save();
      continue;
    }

    let username = account.username;
    const usernameTaken = await User.findOne({ username });
    if (usernameTaken) {
      username = `${account.username.slice(0, 7)}${account.moderator ? 'm' : 'u'}`;
    }

    await User.create({
      email: account.email,
      username,
      password: passwordHash,
      moderator: account.moderator,
      communityOnboardingComplete: true,
      scheduleUploaded: false,
    });
  }

  console.log(
    `[demo] ready — user ${DEMO_ACCOUNTS[0].email} / admin ${DEMO_ACCOUNTS[1].email} (Password123)`
  );
};
