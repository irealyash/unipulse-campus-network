import { Router } from 'express';
import { protect, requireNotBanned } from '../middleware/auth.js';
import { createReport } from '../controllers/reportController.js';

/**
 * User-facing report route.
 *   POST /api/reports  { contentType, contentId, reason? }  -> file a report
 *
 * Viewing/acting on reports happens under /api/moderator/reports (mods only).
 */
const router = Router();

router.use(protect);

router.post('/', requireNotBanned, createReport);

export default router;
