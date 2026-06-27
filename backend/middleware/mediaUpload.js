import multer from 'multer';

const storage = multer.memoryStorage();

const mediaFilter = (req, file, cb) => {
  const ok =
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/') ||
    /\.(jpe?g|png|gif|webp|mp4|webm|mov)$/i.test(file.originalname);
  if (ok) cb(null, true);
  else cb(new Error('Only image or video files are allowed.'));
};

export const uploadMedia = multer({
  storage,
  fileFilter: mediaFilter,
  limits: { fileSize: 25 * 1024 * 1024 },
}).single('file');
