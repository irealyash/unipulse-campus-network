import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { getEvent, deleteEvent, rsvpEvent, listAllPublicEvents } from '../controllers/eventController.js';

/**
 * Single-event routes — operations on individual events.
 * Listing and creating events live under /communities/:id/events.
 *
 *   GET    /api/events/public     -> list all public events across communities
 *   GET    /api/events/:id        -> fetch a single event by ID
 *   DELETE /api/events/:id        -> delete an event (owner only)
 *   POST   /api/events/:id/rsvp   -> RSVP to an event
 */
const router = Router();

// All event routes require authentication
router.use(protect);

// GET /public — list all public events across all communities (protect)
router.get('/public', listAllPublicEvents);
// GET /:id — fetch a single event; DELETE /:id — delete an event (protect)
router.route('/:id').get(getEvent).delete(deleteEvent);
// POST /:id/rsvp — RSVP the authenticated user to an event (protect)
router.post('/:id/rsvp', rsvpEvent);

export default router;
