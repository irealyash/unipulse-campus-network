/**
 * @file upload.js — Schedule file upload middleware.
 *
 * Configures a Multer instance that accepts a single .xlsx spreadsheet
 * (the student's class schedule export). The file is held in memory as a
 * Buffer (`req.file.buffer`) so downstream controllers can parse it with
 * a library like xlsx / exceljs without touching the filesystem.
 *
 * Exported middleware:
 *   uploadSchedule – parses a multipart field named "schedule" (max 5 MB)
 */

import multer from 'multer';
import ApiError from '../utils/ApiError.js';

// Store the uploaded file in memory (as a Buffer on req.file.buffer)
// instead of writing to disk — keeps the server stateless.
const storage = multer.memoryStorage();

/**
 * Multer file-filter callback. Only allows .xlsx files through, rejecting
 * everything else with a 400 ApiError.
 *
 * @param {Object}   req  – Express request (not used here)
 * @param {Object}   file – Multer file descriptor with originalname & mimetype
 * @param {Function} cb   – Multer callback: cb(null, true) to accept, cb(err) to reject
 */
const fileFilter = (req, file, cb) => {
  const isXlsx =
    /\.xlsx$/i.test(file.originalname) ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  if (isXlsx) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only .xlsx schedule files are accepted.'));
  }
};

/**
 * Express middleware that parses a single multipart file from the "schedule"
 * form field. On success, `req.file` contains the uploaded file metadata
 * and `req.file.buffer` holds the raw bytes. Max file size: 5 MB.
 */
export const uploadSchedule = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single('schedule');
