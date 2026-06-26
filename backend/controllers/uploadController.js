import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { uploadBuffer, mediaTypeFromResult } from '../utils/cloudinary.js';

/**
 * POST /api/uploads/media
 * Multipart field "file" -> Cloudinary URL for posts, chat, or events.
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
