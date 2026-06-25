import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { getEvent, deleteEvent } from '../controllers/eventController.js';

/**
 * Single-event routes (listing/creating live under /communities/:id/events).
 *   GET    /api/events/:id  -> one event
 *   DELETE /api/events/:id  -> delete own event
 */
const router = Router();

router.use(protect);

router.route('/:id').get(getEvent).delete(deleteEvent);

export default router;
