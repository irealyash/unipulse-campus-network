/**
 * TIME AGO UTILITY
 * ----------------------------------------------------------------------------
 * Converts an ISO date string or Date object into a human-readable relative
 * time string like "5 min ago", "23 hours ago", or "6 months ago".
 * Used throughout the app for post timestamps, chat messages, event dates, etc.
 */

/**
 * Format a date as a relative time string.
 * @param {string|Date} isoOrDate - An ISO 8601 string or Date object.
 * @returns {string} Human-readable relative time (e.g. "5 min ago"), or '' if invalid.
 */
export function timeAgo(isoOrDate) {
  const then = new Date(isoOrDate).getTime();
  if (Number.isNaN(then)) return '';

  const sec = Math.max(1, Math.floor((Date.now() - then) / 1000));
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;

  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;

  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}
