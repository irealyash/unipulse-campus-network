/**
 * AVATAR UTILITIES
 * ----------------------------------------------------------------------------
 * Client-side avatar generation and resolution for communities, events, and
 * users. Course communities get auto-generated SVG avatars showing the
 * department code and section number. Non-course communities and events fall
 * back to DiceBear placeholder avatars if no image is uploaded.
 *
 * Key exports:
 *   - communityAvatar(c) — resolve avatar URL for any community
 *   - eventAvatar(e)     — resolve avatar URL for an event
 *   - userAvatar(user)   — resolve anonymous user avatar
 *   - splitCourseSection  — parse section IDs into display lines
 *   - courseAvatarLayout  — compute font sizing for course avatars
 *   - courseCommunityImage — generate an SVG data URI for a course avatar
 */

/** Escape special XML characters for safe embedding in SVG text nodes. */
const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Font stack used in generated SVG course avatars. */
const FONT_STACK = "'Roboto', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/**
 * Split a course section ID into display lines for the avatar.
 * Handles multiple formats: "CPSC 320-921", "CPSC320-921", "CPSC-320-921".
 * @param {string} sectionId - The raw section identifier.
 * @returns {string[]} Array of 1-2 lines (e.g. ["CPSC", "320-921"]).
 */
export const splitCourseSection = (sectionId) => {
  const raw = String(sectionId).trim();

  // Workday format: "DEPT NUM-SECTION"
  const spaced = raw.match(/^([A-Za-z]{2,5}(?:_V)?)\s+(\d{3}[A-Za-z]?-.+)$/);
  if (spaced) {
    return [spaced[1].replace(/_V$/i, '').toUpperCase(), spaced[2]];
  }

  // Compact: "DEPTNUM-SECTION"
  const compact = raw.match(/^([A-Za-z]{2,5}(?:_V)?)(\d{3}[A-Za-z]?-.+)$/);
  if (compact) {
    return [compact[1].replace(/_V$/i, '').toUpperCase(), compact[2]];
  }

  // Legacy: "DEPT-NUM-SECTION"
  const legacy = raw.match(/^([A-Za-z]{2,5})-(\d{3}[A-Za-z]?-.+)$/);
  if (legacy) {
    return [legacy[1].toUpperCase(), legacy[2]];
  }

  // Generic fallback: letters, then the rest
  const generic = raw.match(/^([A-Za-z]{2,5}(?:_V)?)\s+(.+)$/);
  if (generic) {
    return [generic[1].replace(/_V$/i, '').toUpperCase(), generic[2].trim()];
  }

  return [raw];
};

/** Padding ratio for course avatars — keeps text inset from edges. */
const COURSE_AVATAR_PAD_RATIO = 0.06;

/** Approximate width of a character in em units for font size calculation. */
const CHAR_WIDTH_EM = 0.52;

/**
 * Compute the layout (font size, padding, line split) for a course avatar
 * at a given box size. Ensures the text fits within the avatar bounds.
 * @param {string} sectionId - The course section ID to render.
 * @param {number} boxPx     - The avatar box size in pixels (default 48).
 * @returns {{ lines: string[], pad: number, fontSize: number, gap: number }}
 */
export const courseAvatarLayout = (sectionId, boxPx = 48) => {
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
    pad,
    fontSize: Math.round(Math.max(boxPx * 0.1, fontSize) * 10) / 10,
    gap: 0,
  };
};

/**
 * Generate an SVG data URI for a course community avatar (256×256).
 * Renders the department code and section number as centered text on a white background.
 * @param {string} sectionId - The course section ID.
 * @returns {string} A data:image/svg+xml URI.
 */
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

/** Check if a URL is a generated SVG course avatar (data URI). */
const isGeneratedCourseAvatar = (url) =>
  typeof url === 'string' && url.startsWith('data:image/svg+xml');

/**
 * Resolve the avatar URL for a community.
 * Course communities without a custom image get an auto-generated SVG.
 * Non-course communities fall back to a DiceBear shapes avatar.
 * @param {Object} c - Community object with _id, type, and optional imageUrl.
 * @returns {string} Avatar image URL or data URI.
 */
export const communityAvatar = (c) => {
  if (
    c?.type === 'course' &&
    (!c?.imageUrl || isGeneratedCourseAvatar(c.imageUrl))
  ) {
    return courseCommunityImage(c._id);
  }
  return (
    c?.imageUrl ||
    `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(c?._id || 'community')}`
  );
};

/**
 * Get the pixel font size for an HTML-rendered course avatar at a given box size.
 * @param {string} sectionId - The course section ID.
 * @param {number} boxPx     - The box size in pixels (default 48).
 * @returns {number} Font size in pixels.
 */
export const courseAvatarFontPx = (sectionId, boxPx = 48) =>
  courseAvatarLayout(sectionId, boxPx).fontSize;

/**
 * Resolve the avatar URL for an event.
 * Falls back to a DiceBear identicon if no custom image is set.
 * @param {Object} e - Event object with _id and optional imageUrl.
 * @returns {string} Avatar image URL.
 */
export const eventAvatar = (e) =>
  e?.imageUrl ||
  `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(e?._id || 'event')}`;

/**
 * Resolve the avatar URL for an anonymous user.
 * Uses DiceBear thumbs style seeded by user ID or username.
 * @param {Object} user - User object with id, _id, or username.
 * @returns {string} Avatar image URL.
 */
export const userAvatar = (user) =>
  `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(
    user?.id || user?._id || user?.username || 'user'
  )}`;
