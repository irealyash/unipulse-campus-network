/**
 * avatars.js — Default and generated avatar/image utilities.
 *
 * Provides fallback images for communities and events that don't have a
 * user-uploaded picture. Course communities get a dynamically generated SVG
 * with the course code; other entities use DiceBear placeholder avatars.
 */

/**
 * Escapes special XML characters to prevent SVG injection.
 * @param {string} value - Raw text to embed in SVG markup.
 * @returns {string} XML-safe string.
 */
const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Font stack used in generated SVG avatars for consistent cross-platform rendering.
const FONT_STACK = "'Roboto', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/**
 * Parses a course section ID (e.g. "CPSC 210-101") into display lines.
 * Handles multiple legacy formats: spaced, compact, and hyphen-separated.
 * @param {string} sectionId - The raw course section identifier.
 * @returns {string[]} Array of 1-2 lines for rendering in the SVG avatar.
 */
const splitCourseSection = (sectionId) => {
  const raw = String(sectionId).trim();

  const spaced = raw.match(/^([A-Za-z]{2,5}(?:_V)?)\s+(\d{3}[A-Za-z]?-.+)$/);
  if (spaced) {
    return [spaced[1].replace(/_V$/i, '').toUpperCase(), spaced[2]];
  }

  const compact = raw.match(/^([A-Za-z]{2,5}(?:_V)?)(\d{3}[A-Za-z]?-.+)$/);
  if (compact) {
    return [compact[1].replace(/_V$/i, '').toUpperCase(), compact[2]];
  }

  const legacy = raw.match(/^([A-Za-z]{2,5})-(\d{3}[A-Za-z]?-.+)$/);
  if (legacy) {
    return [legacy[1].toUpperCase(), legacy[2]];
  }

  const generic = raw.match(/^([A-Za-z]{2,5}(?:_V)?)\s+(.+)$/);
  if (generic) {
    return [generic[1].replace(/_V$/i, '').toUpperCase(), generic[2].trim()];
  }

  return [raw];
};

// Padding ratio and estimated character width used to auto-size SVG text.
const COURSE_AVATAR_PAD_RATIO = 0.06;
const CHAR_WIDTH_EM = 0.52;

/**
 * Computes the layout (lines, font size, padding) for a course avatar SVG.
 * Dynamically sizes text to fit within the square bounding box.
 * @param {string} sectionId - Course section identifier to render.
 * @param {number} [boxPx=256] - Width/height of the SVG in pixels.
 * @returns {{lines: string[], fontSize: number, pad: number}} Layout params.
 */
const courseAvatarLayout = (sectionId, boxPx = 256) => {
  const lines = splitCourseSection(sectionId);
  const pad = Math.max(2, Math.round(boxPx * COURSE_AVATAR_PAD_RATIO));
  const inner = boxPx - pad * 2;
  const maxLen = Math.max(...lines.map((l) => l.length), 1);
  const lineCount = lines.length;

  const fromWidth = inner / (maxLen * CHAR_WIDTH_EM);
  const fromHeight = inner / (lineCount * 1.02 + Math.max(0, lineCount - 1) * 0.02);
  const fontSize = Math.min(fromWidth, fromHeight);

  return {
    lines,
    fontSize: Math.round(Math.max(boxPx * 0.1, fontSize) * 10) / 10,
    pad,
  };
};

/** White background with the section label centred — used for course communities. */
export const courseCommunityImage = (sectionId) => {
  const { lines, fontSize, pad } = courseAvatarLayout(sectionId, 256);
  const size = 256;
  const cx = size / 2;
  const innerTop = pad;
  const innerBottom = size - pad;
  const lineHeight = (innerBottom - innerTop) / lines.length;

  const textNodes = lines
    .map((line, i) => {
      const y = innerTop + lineHeight * (i + 0.5);
      return `<text x="${cx}" y="${y}" dominant-baseline="middle" text-anchor="middle" fill="#111111" font-family="${FONT_STACK}" font-size="${fontSize}" font-weight="700">${escapeXml(line)}</text>`;
    })
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="#ffffff"/>${textNodes}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

/**
 * Checks whether a URL is one of our generated SVG data URIs (not user-uploaded).
 * @param {string} url - The imageUrl to test.
 * @returns {boolean}
 */
const isGeneratedCourseAvatar = (url) =>
  typeof url === 'string' && url.startsWith('data:image/svg+xml');

/**
 * Returns a DiceBear "shapes" avatar URL seeded by the community ID.
 * @param {string} id - Community identifier used as the random seed.
 * @returns {string} Public URL for the generated avatar.
 */
export const defaultCommunityImage = (id) =>
  `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(id)}`;

/**
 * Returns a DiceBear "identicon" avatar URL seeded by the event ID.
 * @param {string} id - Event identifier used as the random seed.
 * @returns {string} Public URL for the generated avatar.
 */
export const defaultEventImage = (id) =>
  `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(id)}`;

/**
 * Attaches the correct imageUrl to a community object for API responses.
 * Course communities get a generated SVG; others fall back to DiceBear.
 * @param {Object} community - Mongoose document or plain community object.
 * @returns {Object} Plain object with resolved imageUrl.
 */
export const withCommunityImage = (community) => {
  const obj = community.toObject?.() ?? community;
  const courseAvatar =
    obj.type === 'course' &&
    (!obj.imageUrl || isGeneratedCourseAvatar(obj.imageUrl))
      ? courseCommunityImage(obj._id)
      : null;

  return {
    ...obj,
    imageUrl:
      courseAvatar ||
      obj.imageUrl ||
      defaultCommunityImage(obj._id),
  };
};

/**
 * Attaches the correct imageUrl to an event object for API responses.
 * Falls back to the first media item's URL or a DiceBear identicon.
 * @param {Object} event - Mongoose document or plain event object.
 * @returns {Object} Plain object with resolved imageUrl.
 */
export const withEventImage = (event) => {
  const obj = event.toObject?.() ?? event;
  const cover =
    obj.imageUrl ||
    obj.media?.[0]?.url ||
    defaultEventImage(obj._id);
  return { ...obj, imageUrl: cover };
};
