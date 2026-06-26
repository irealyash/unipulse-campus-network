/** Client-side avatar helpers (mirror backend defaults). */

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const FONT_STACK = "'Roboto', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/**
 * Split a course section id into dept code + number/section lines.
 * e.g. "CPSC 320-921" → ["CPSC", "320-921"]
 *      "CPSC 110-2D2" → ["CPSC", "110-2D2"]
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

const COURSE_AVATAR_PAD_RATIO = 0.06;
const CHAR_WIDTH_EM = 0.52;

/** Font size + padding — max text that fits with a slight, even inset on every profile. */
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

const isGeneratedCourseAvatar = (url) =>
  typeof url === 'string' && url.startsWith('data:image/svg+xml');

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

/** Pixel font size for HTML course avatars at a given box size (px). */
export const courseAvatarFontPx = (sectionId, boxPx = 48) =>
  courseAvatarLayout(sectionId, boxPx).fontSize;

export const eventAvatar = (e) =>
  e?.imageUrl ||
  `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(e?._id || 'event')}`;

/** Standard anonymous user avatar (not user-customizable). */
export const userAvatar = (user) =>
  `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(
    user?.id || user?._id || user?.username || 'user'
  )}`;
