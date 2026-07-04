import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { uploadBuffer, mediaTypeFromResult } from '../utils/cloudinary.js';

/**
 * UPLOAD CONTROLLER
 * ----------------------------------------------------------------------------
 * Handles user-uploaded media files (images, videos, GIFs). The file is
 * received as a multipart/form-data upload, streamed to Cloudinary, and the
 * resulting CDN URL is returned to the client. The client then attaches that
 * URL when creating a post, comment, chat message, or event.
 */

/**
 * POST /api/uploads/media
 * Expects: multipart/form-data with a single file field named "file".
 * Uploads the file buffer to Cloudinary as either an image or video based on
 * its MIME type, then returns the public CDN URL and resolved media type.
 * Returns: { url: string, mediaType: "image" | "video" | "gif" }
 */
export const uploadMediaFile = asyncHandler(async (req, res) => {
  if (!req.file?.buffer) throw new ApiError(400, 'No file uploaded.');

  const isVideo = req.file.mimetype.startsWith('video/');
  const result = await uploadBuffer(req.file.buffer, isVideo ? 'video' : 'image');

  res.json({
    success: true,
    url: result.secure_url,
    mediaType: mediaTypeFromResult(result),
  });
});
