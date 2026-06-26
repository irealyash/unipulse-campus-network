import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { uploadMedia } from '../middleware/mediaUpload.js';
import { uploadMediaFile } from '../controllers/uploadController.js';

const router = Router();

router.use(protect);
router.post('/media', uploadMedia, uploadMediaFile);

export default router;
