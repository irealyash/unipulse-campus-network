import api from './api';

/** Upload image/video to Cloudinary via the backend. */
export async function uploadMedia(file) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post('/uploads/media', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return { url: data.url, mediaType: data.mediaType };
}

const GIPHY_KEY = import.meta.env.VITE_GIPHY_API_KEY || 'uPpK0Xdj6CjrdOOquxhsbVJvQY04hsA1';

/** Search Giphy for GIFs. */
export async function searchGifs(query, offset = 0) {
  const res = await fetch(
    `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query || 'trending')}&limit=20&offset=${offset}&rating=g`
  );
  if (!res.ok) throw new Error('Could not load GIFs.');
  const json = await res.json();
  return json.data || [];
}

/** Trending GIFs when the picker first opens. */
export async function trendingGifs(offset = 0) {
  const res = await fetch(
    `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=20&offset=${offset}&rating=g`
  );
  if (!res.ok) throw new Error('Could not load GIFs.');
  const json = await res.json();
  return json.data || [];
}
