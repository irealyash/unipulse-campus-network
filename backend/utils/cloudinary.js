import { v2 as cloudinary } from 'cloudinary';
import ApiError from './ApiError.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a buffer to Cloudinary. resourceType: image | video | auto
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

export const mediaTypeFromResult = (result) => {
  if (result.resource_type === 'video') return 'video';
  return 'image';
};
