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

const courseFontSize = (lines) => {
  const maxLen = Math.max(...lines.map((l) => l.length));
  const size = 256;
  const pad = 18;
  const lineFactor = lines.length > 1 ? 1.05 : 1;
  return Math.min(56, Math.max(34, Math.round(((size - pad * 2) / (maxLen * 0.56)) * lineFactor)));
};

export const courseCommunityImage = (sectionId) => {
  const lines = splitCourseSection(sectionId);
  const size = 256;
  const fontSize = courseFontSize(lines);
  const cx = size / 2;
  const cy = size / 2;
  const lineHeight = fontSize * 1.1;

  const textNodes =
    lines.length === 1
      ? `<text x="${cx}" y="${cy}" dominant-baseline="middle" text-anchor="middle" fill="#111111" font-family="${FONT_STACK}" font-size="${fontSize}" font-weight="700">${escapeXml(lines[0])}</text>`
      : lines
          .map((line, i) => {
            const y = cy - lineHeight / 2 + i * lineHeight;
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
export const courseAvatarFontPx = (sectionId, boxPx = 48) => {
  const lines = splitCourseSection(sectionId);
  const maxLen = Math.max(...lines.map((l) => l.length));
  const scale = boxPx / 256;
  return Math.min(boxPx * 0.3, Math.max(boxPx * 0.14, Math.round(courseFontSize(lines) * scale)));
};

export const eventAvatar = (e) =>
  e?.imageUrl ||
  `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(e?._id || 'event')}`;

/** Standard anonymous user avatar (not user-customizable). */
export const userAvatar = (user) =>
  `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(
    user?.id || user?._id || user?.username || 'user'
  )}`;
