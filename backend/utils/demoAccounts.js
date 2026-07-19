/**
 * Fixed recruiter-demo accounts. Seeded on boot so the live site always has
 * a standard user and a moderator with known credentials.
 *
 * These emails bypass ALLOWED_EMAIL_DOMAIN so they can exist outside UBC.
 */

export const DEMO_PASSWORD = 'Password123';

export const DEMO_ACCOUNTS = [
  {
    email: 'demo_user@unipulse.live',
    username: 'demo_user',
    password: DEMO_PASSWORD,
    moderator: false,
  },
  {
    email: 'demo_admin@unipulse.live',
    username: 'demo_admin',
    password: DEMO_PASSWORD,
    moderator: true,
  },
];

/** True if this email is one of the fixed demo accounts. */
export const isDemoEmail = (email) =>
  DEMO_ACCOUNTS.some((a) => a.email === (email || '').trim().toLowerCase());

/** True if this email is the demo moderator account. */
export const isDemoModeratorEmail = (email) => {
  const normalized = (email || '').trim().toLowerCase();
  return DEMO_ACCOUNTS.some((a) => a.email === normalized && a.moderator);
};
