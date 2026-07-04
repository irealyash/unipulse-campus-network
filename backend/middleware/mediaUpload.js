/**
 * @file mediaUpload.js — Image & video upload middleware.
 *
 * Configures a Multer instance for user-generated media (images and videos)
 * attached to posts or chat messages. Like upload.js, files are stored in
 * memory as Buffers so they can be streamed directly to cloud storage
 * (e.g. Cloudinary, S3) without writing to disk.
 *
 * Exported middleware:
 *   uploadMedia – parses a single multipart field named "file" (max 25 MB)
 */

import multer from 'multer';

// Hold the file in memory as a Buffer on req.file.buffer.
const storage = multer.memoryStorage();

/**
 * Multer file-filter callback. Accepts common image and video MIME types
 * as well as files whose extensions match known media formats.
 *
 * @param {Object}   req  – Express request (not used here)
 * @param {Object}   file – Multer file descriptor with originalname & mimetype
 * @param {Function} cb   – Multer callback: cb(null, true) to accept, cb(err) to reject
 */
const mediaFilter = (req, file, cb) => {
  const ok =
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/') ||
    /\.(jpe?g|png|gif|webp|mp4|webm|mov)$/i.test(file.originalname);
  if (ok) cb(null, true);
  else cb(new Error('Only image or video files are allowed.'));
};

/**
 * Express middleware that parses a single multipart file from the "file"
 * form field. On success, `req.file` contains the uploaded file metadata
 * and `req.file.buffer` holds the raw bytes. Max file size: 25 MB.
 */
export const uploadMedia = multer({
  storage,
  fileFilter: mediaFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
}).single('file');
