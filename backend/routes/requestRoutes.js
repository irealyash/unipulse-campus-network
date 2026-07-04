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

// All request routes require authentication
router.use(protect);

// POST / — submit a new moderator request; requires user not be banned (protect, requireNotBanned)
router.post('/', requireNotBanned, createModeratorRequest);

export default router;
