/**
 * Upload routes — handles file/media uploads for the application.
 * Uses Multer-based middleware (uploadMedia) to process multipart form data
 * before passing to the controller for storage.
 *
 *   POST /api/uploads/media  -> upload a media file (image, etc.)
 */
import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { uploadMedia } from '../middleware/mediaUpload.js';
import { uploadMediaFile } from '../controllers/uploadController.js';

const router = Router();

// All upload routes require authentication
router.use(protect);
// POST /media — upload a media file; uploadMedia middleware handles multipart parsing (protect, uploadMedia)
router.post('/media', uploadMedia, uploadMediaFile);

export default router;
