/**
 * Default avatar URLs when a community/event has no custom imageUrl.
 */

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** White background with the section label centred — used for course communities. */
export const courseCommunityImage = (sectionId) => {
  const label = escapeXml(sectionId);
  const fontSize = label.length > 18 ? 14 : label.length > 14 ? 17 : 22;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="#ffffff"/><text x="128" y="128" dominant-baseline="middle" text-anchor="middle" fill="#1a1a1a" font-family="Inter,system-ui,sans-serif" font-size="${fontSize}" font-weight="600">${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

export const defaultCommunityImage = (id) =>
  `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(id)}`;

export const defaultEventImage = (id) =>
  `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(id)}`;

export const withCommunityImage = (community) => {
  const obj = community.toObject?.() ?? community;
  return {
    ...obj,
    imageUrl:
      obj.imageUrl ||
      (obj.type === 'course' ? courseCommunityImage(obj._id) : defaultCommunityImage(obj._id)),
  };
};

export const withEventImage = (event) => ({
  ...(event.toObject?.() ?? event),
  imageUrl: event.imageUrl || defaultEventImage(event._id),
});
