import multer from 'multer';
import ApiError from '../utils/ApiError.js';

const storage = multer.memoryStorage();

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

export const uploadSchedule = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('schedule');
