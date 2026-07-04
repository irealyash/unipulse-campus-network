/**
 * cloudinary.js — Media upload utilities backed by Cloudinary's Node SDK.
 *
 * Handles image and video uploads for posts, avatars, and community banners.
 * Buffers are streamed directly to Cloudinary (no temp files on disk).
 */
import { v2 as cloudinary } from 'cloudinary';
import ApiError from './ApiError.js';

// Initialize the Cloudinary SDK with credentials from environment variables.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a binary buffer to Cloudinary via a streaming upload.
 * @param {Buffer} buffer - The file contents to upload.
 * @param {'image'|'video'|'auto'} [resourceType='auto'] - Cloudinary resource type hint.
 * @returns {Promise<Object>} Resolves with the Cloudinary upload result (includes url, public_id, etc.).
 * @throws {ApiError} If Cloudinary credentials are not configured.
 */
export const uploadBuffer = (buffer, resourceType = 'auto') =>
  new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return reject(new ApiError(503, 'Media uploads are not configured on the server (Cloudinary).'));
    }
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });

/**
 * Maps Cloudinary's resource_type field to the app's simpler mediaType enum.
 * @param {Object} result - The upload result object returned by Cloudinary.
 * @returns {'image' | 'video'} The normalized media type string.
 */
export const mediaTypeFromResult = (result) => {
  if (result.resource_type === 'video') return 'video';
  return 'image';
};
