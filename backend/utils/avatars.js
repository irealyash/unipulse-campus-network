/**
 * Default avatar URLs when a community/event has no custom imageUrl.
 * Uses DiceBear so every room gets a unique, consistent profile picture.
 */
export const defaultCommunityImage = (id) =>
  `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(id)}`;

export const defaultEventImage = (id) =>
  `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(id)}`;

export const withCommunityImage = (community) => ({
  ...community.toObject?.() ?? community,
  imageUrl: community.imageUrl || defaultCommunityImage(community._id),
});

export const withEventImage = (event) => ({
  ...(event.toObject?.() ?? event),
  imageUrl: event.imageUrl || defaultEventImage(event._id),
});
