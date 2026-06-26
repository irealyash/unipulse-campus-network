/** Client-side avatar helpers (mirror backend defaults). */
export const communityAvatar = (c) =>
  c?.imageUrl ||
  `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(c?._id || 'community')}`;

export const eventAvatar = (e) =>
  e?.imageUrl ||
  `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(e?._id || 'event')}`;

/** Standard anonymous user avatar (not user-customizable). */
export const userAvatar = (user) =>
  `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(
    user?.id || user?._id || user?.username || 'user'
  )}`;
