/**
 * Tiny input validators shared across controllers. Keeping them here means the
 * signup flow and the "change username" flow enforce exactly the same rules.
 */

// bad-words v4 is ESM and exposes a NAMED export, so we destructure { Filter }.
import { Filter } from 'bad-words';

const filter = new Filter();

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
 *   - 3 to 10 characters
 *   - letters, numbers, underscores only
 * This keeps aliases URL-safe and avoids impersonation via spaces/symbols.
 */
export const isValidUsername = (username) => {
    if (typeof username !== 'string') return false;

    const trimmed = username.trim();

    // 1. Check Format (Length & Characters)
    const formatRegex = /^[A-Za-z0-9_]{3,10}$/;
    if (!formatRegex.test(trimmed)) return false;

    // 2. Check for Profanity
    if (filter.isProfane(trimmed)) return false;

    // 3. Optional: Add a blacklist for impersonation
    const blacklist = ['admin', 'moderator', 'support', 'staff'];
    if (blacklist.includes(trimmed.toLowerCase())) return false;

    return true;
};



/**
 * Password rules: at least 8 characters and not absurdly long (bcrypt only
 * uses the first 20 bytes, so we cap input to avoid silent truncation issues).
 * Kept intentionally simple — tighten (require digits/symbols) if you want.
 */
export const isValidPassword = (password) => {

    if (typeof password !== 'string') return false;

    return password.length >= 8 && password.length <= 32;

};

// Number of days a user must wait between username changes (spec: once a week).
export const USERNAME_CHANGE_COOLDOWN_DAYS = 7;
