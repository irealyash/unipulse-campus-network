import multer from 'multer';
import ApiError from '../utils/ApiError.js';

/**
 * Multer configuration for the schedule-file upload.
 *
 * We use in-memory storage (the file lands in req.file.buffer) because we only
 * need to parse it once to extract course sections — there is no reason to keep
 * the raw schedule on disk. The buffer is handed straight to scheduleParser.
 */
const storage = multer.memoryStorage();

// Accept only the file types a schedule could realistically be exported as.
const fileFilter = (req, file, cb) => {
  const allowed = [
    'text/calendar', // .ics
    'application/octet-stream', // some browsers send .ics as this
    'text/plain', // .txt
    'application/json', // pre-parsed sections
    'text/csv'
  ];
  const looksLikeIcs = /\.ics$/i.test(file.originalname);

  if (allowed.includes(file.mimetype) || looksLikeIcs) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Unsupported file type. Upload an .ics, .txt, .csv or .json schedule.'));
  }
};

export const uploadSchedule = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2 MB is plenty for a calendar file
}).single('schedule'); // form field name must be "schedule"
