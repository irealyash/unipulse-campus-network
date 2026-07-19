/**
 * MEDIA UTILITIES
 * ----------------------------------------------------------------------------
 * Handles file uploads (images/videos to Cloudinary via the backend) and
 * GIF search/trending via the Giphy API. Used by chat, posts, comments,
 * events, and moderator messages wherever media attachments are supported.
 */

import api from './api';

/**
 * Upload an image or video file to Cloudinary through the backend proxy.
 * Sends a multipart form POST to /uploads/media.
 * @param {File} file - The file to upload.
 * @returns {Promise<{ url: string, mediaType: string }>} The Cloudinary URL and type ('image'|'video').
 */
export async function uploadMedia(file) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post('/uploads/media', form);
  return { url: data.url, mediaType: data.mediaType };
}

/** Giphy API key — set VITE_GIPHY_API_KEY in Vercel for production. */
const GIPHY_KEY = import.meta.env.VITE_GIPHY_API_KEY || '';

/**
 * Search Giphy for GIFs matching a query string.
 * @param {string} query  - Search term (falls back to 'trending' if empty).
 * @param {number} offset - Pagination offset for loading more results.
 * @returns {Promise<Array<Object>>} Array of Giphy GIF objects.
 */
export async function searchGifs(query, offset = 0) {
  if (!GIPHY_KEY) throw new Error('Giphy API key is not configured.');
  const res = await fetch(
    `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query || 'trending')}&limit=20&offset=${offset}&rating=g`
  );
  if (!res.ok) throw new Error('Could not load GIFs.');
  const json = await res.json();
  return json.data || [];
}

/**
 * Fetch trending GIFs from Giphy (shown when the GIF picker first opens).
 * @param {number} offset - Pagination offset for loading more results.
 * @returns {Promise<Array<Object>>} Array of Giphy GIF objects.
 */
export async function trendingGifs(offset = 0) {
  if (!GIPHY_KEY) throw new Error('Giphy API key is not configured.');
  const res = await fetch(
    `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=20&offset=${offset}&rating=g`
  );
  if (!res.ok) throw new Error('Could not load GIFs.');
  const json = await res.json();
  return json.data || [];
}
