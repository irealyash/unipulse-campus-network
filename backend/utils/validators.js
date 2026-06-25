/**
 * Tiny input validators shared across controllers. Keeping them here means the
 * signup flow and the "change username" flow enforce exactly the same rules.
 */

/**
 * Confirms the email belongs to a UBC student. We only accept addresses ending
 * in the configured domain (default "@student.ubc.ca"). This is the very first
 * gate of the whole product: no UBC inbox => no account.
 */
export const isValidUbcEmail = (email) => {
  if (typeof email !== 'string') return false;
  const domain = (process.env.ALLOWED_EMAIL_DOMAIN || '@student.ubc.ca').toLowerCase();
  return email.trim().toLowerCase().endsWith(domain);
};

/**
 * Username rules for the anonymous alias:
 *   - 3 to 20 characters
 *   - letters, numbers, underscores only
 * This keeps aliases URL-safe and avoids impersonation via spaces/symbols.
 */
export const isValidUsername = (username) => {
  if (typeof username !== 'string') return false;
  return /^[A-Za-z0-9_]{3,20}$/.test(username.trim());
};

/**
 * Password rules: at least 8 characters and not absurdly long (bcrypt only
 * uses the first 72 bytes, so we cap input to avoid silent truncation issues).
 * Kept intentionally simple — tighten (require digits/symbols) if you want.
 */
export const isValidPassword = (password) => {
  if (typeof password !== 'string') return false;
  return password.length >= 8 && password.length <= 72;
};

// Number of days a user must wait between username changes (spec: once a week).
export const USERNAME_CHANGE_COOLDOWN_DAYS = 7;
