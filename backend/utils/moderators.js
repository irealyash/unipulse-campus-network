/**
 * Auto-moderator allow-list.
 *
 * Emails listed in the MODERATOR_EMAILS env var (comma-separated) are:
 *   1. allowed to sign up even if they don't match ALLOWED_EMAIL_DOMAIN, and
 *   2. automatically granted moderator powers on signup / login.
 *
 * Example .env:  MODERATOR_EMAILS=iyash636@student.ubc.ca
 */
export const getModeratorEmails = () =>
  (process.env.MODERATOR_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export const isModeratorEmail = (email) =>
  getModeratorEmails().includes((email || '').trim().toLowerCase());
