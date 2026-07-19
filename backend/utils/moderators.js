/**
 * moderators.js
 *
 * Moderator allow-list utilities driven by the MODERATOR_EMAILS environment variable.
 * Emails listed there (comma-separated) receive two privileges:
 *   1. Bypass the ALLOWED_EMAIL_DOMAIN restriction during signup
 *   2. Automatically receive moderator powers on signup or login
 *
 * The fixed demo_admin@unipulse.live account is always treated as a moderator.
 *
 * Example .env:  MODERATOR_EMAILS=iyash636@student.ubc.ca,admin@ubc.ca
 */

import { isDemoModeratorEmail } from './demoAccounts.js';

/**
 * Parses the MODERATOR_EMAILS env var into an array of lowercase email addresses.
 *
 * @returns {string[]} Array of trimmed, lowercased moderator email addresses
 */
export const getModeratorEmails = () =>
  (process.env.MODERATOR_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

/**
 * Checks whether a given email is in the moderator allow-list (or is the demo admin).
 *
 * @param {string} email - The email address to check
 * @returns {boolean} True if the email is a designated moderator
 */
export const isModeratorEmail = (email) =>
  getModeratorEmails().includes((email || '').trim().toLowerCase()) ||
  isDemoModeratorEmail(email);
