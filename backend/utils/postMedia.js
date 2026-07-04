/**
 * postMedia.js — Helpers for normalizing media data attached to posts.
 *
 * The post schema evolved from a single {url, mediaType} object to an array.
 * These helpers ensure API responses and writes always use a consistent array
 * format regardless of what's stored in the database.
 */

/**
 * Normalizes stored post media into a consistent array of {url, mediaType}.
 * Handles both the legacy single-object format and the newer array format.
 * @param {Object} post - A post document (or plain object) with a `media` field.
 * @returns {Array<{url: string, mediaType: string}>} Cleaned media array.
 */
export const normalizePostMedia = (post) => {
  const raw = post?.media;
  if (Array.isArray(raw)) {
    return raw.filter((m) => m?.url).map((m) => ({
      url: m.url,
      mediaType: m.mediaType || 'image',
    }));
  }
  if (raw?.url) {
    return [{ url: raw.url, mediaType: raw.mediaType || 'image' }];
  }
  return [];
};

/**
 * Sanitizes incoming media input from the client before saving to the database.
 * Trims URLs and ensures each entry has both a url and mediaType.
 * @param {Array|Object|undefined} raw - Raw media payload from the request body.
 * @returns {Array<{url: string, mediaType: string}>} Validated media array.
 */
export const normalizeMediaInput = (raw) => {
  if (Array.isArray(raw)) {
    return raw
      .filter((m) => m?.url && m?.mediaType)
      .map((m) => ({ url: String(m.url).trim(), mediaType: m.mediaType }));
  }
  if (raw?.url) {
    return [{ url: String(raw.url).trim(), mediaType: raw.mediaType || 'image' }];
  }
  return [];
};

/**
 * Converts a Mongoose post document to a plain object with normalized media.
 * Useful when building API responses that need a clean, predictable shape.
 * @param {Object} post - A Mongoose document or plain post object.
 * @returns {Object} Plain object with `media` replaced by the normalized array.
 */
export const withPostMedia = (post) => {
  const obj = post?.toObject ? post.toObject({ virtuals: true }) : { ...post };
  return { ...obj, media: normalizePostMedia(obj) };
};
