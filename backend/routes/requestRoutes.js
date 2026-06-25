import { Router } from 'express';
import { protect, requireNotBanned } from '../middleware/auth.js';
import { createModeratorRequest } from '../controllers/moderatorRequestController.js';

/**
 * User-facing moderator-request route.
 *   POST /api/requests  { message, communityId? }  -> message the moderators
 *
 * Moderators read/triage these under /api/moderator/requests.
 */
const router = Router();

router.use(protect);

router.post('/', requireNotBanned, createModeratorRequest);

export default router;
