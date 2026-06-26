/** Client-side avatar helpers (mirror backend defaults). */

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const courseCommunityImage = (sectionId) => {
  const label = escapeXml(sectionId);
  const fontSize = label.length > 18 ? 14 : label.length > 14 ? 17 : 22;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="#ffffff"/><text x="128" y="128" dominant-baseline="middle" text-anchor="middle" fill="#1a1a1a" font-family="Inter,system-ui,sans-serif" font-size="${fontSize}" font-weight="600">${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

export const communityAvatar = (c) =>
  c?.imageUrl ||
  (c?.type === 'course'
    ? courseCommunityImage(c._id)
    : `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(c?._id || 'community')}`);

export const eventAvatar = (e) =>
  e?.imageUrl ||
  `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(e?._id || 'event')}`;

/** Standard anonymous user avatar (not user-customizable). */
export const userAvatar = (user) =>
  `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(
    user?.id || user?._id || user?.username || 'user'
  )}`;
