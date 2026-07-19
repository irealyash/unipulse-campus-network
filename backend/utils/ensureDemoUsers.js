/**
 * Idempotently upserts the recruiter demo accounts so login always works
 * with the published credentials (even after a password change or fresh DB).
 *
 * Always claims the reserved usernames `demo_user` / `demo_admin`. Any other
 * account holding those names is renamed so demo identity stays stable.
 */

import User from '../models/User.js';
import { hashPassword } from './password.js';
import { DEMO_ACCOUNTS } from './demoAccounts.js';

/** Free a reserved demo username held by a non-demo account. */
const reclaimUsername = async (username, keepEmail) => {
  const clash = await User.findOne({
    username,
    email: { $ne: keepEmail },
  });
  if (!clash) return;

  const suffix = clash._id.toString().slice(-6);
  clash.username = `u_${suffix}`;
  await clash.save();
};

export const ensureDemoUsers = async () => {
  for (const account of DEMO_ACCOUNTS) {
    const passwordHash = await hashPassword(account.password);
    await reclaimUsername(account.username, account.email);

    const existing = await User.findOne({ email: account.email }).select('+password');

    if (existing) {
      existing.password = passwordHash;
      existing.username = account.username;
      existing.moderator = account.moderator;
      existing.isBanned = false;
      existing.communityOnboardingComplete = true;
      await existing.save();
      continue;
    }

    await User.create({
      email: account.email,
      username: account.username,
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
