/** Normalize legacy single-media posts and new media arrays for API responses. */
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

export const withPostMedia = (post) => {
  const obj = post?.toObject ? post.toObject({ virtuals: true }) : { ...post };
  return { ...obj, media: normalizePostMedia(obj) };
};
