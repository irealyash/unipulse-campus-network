import { Router } from 'express';
import { protect, requireNotBanned } from '../middleware/auth.js';
import {
  listCommunities,
  getCommunity,
  listCatalog,
} from '../controllers/communityController.js';
import { listPosts, createPost } from '../controllers/postController.js';
import { listEvents, createEvent } from '../controllers/eventController.js';
import { getMessages, getChatTimeline } from '../controllers/messageController.js';

/**
 * Community routes, plus the community-scoped collections nested beneath them
 * (posts / events / chat history). All require authentication.
 *
 * Creating communities is MODERATOR-ONLY (requireModerator). Course
 * communities are still auto-created from a student's calendar upload (see
 * userController.uploadScheduleFile) — that path is system-driven, not a user
 * calling createCommunity, so it is unaffected by this restriction.
 *
 *   GET  /api/communities                      -> rooms this user can see
 *   GET  /api/communities/:id                  -> one community (access-gated)
 *
 *   GET  /api/communities/:communityId/posts   -> post feed
 *   POST /api/communities/:communityId/posts   -> create post
 *   GET  /api/communities/:communityId/events  -> events list
 *   POST /api/communities/:communityId/events  -> create event (pending approval)
 *   GET  /api/communities/:communityId/messages-> chat history
 */
const router = Router();

router.use(protect);

// GET /api/communities — list communities the authenticated user can see
router.route('/').get(listCommunities);
// GET /api/communities/catalog — browse the full public community catalog
router.get('/catalog', listCatalog);

// GET  /api/communities/:communityId/posts — paginated post feed for a community
// POST /api/communities/:communityId/posts — create a post (requireNotBanned middleware blocks banned users)
router
  .route('/:communityId/posts')
  .get(listPosts)
  .post(requireNotBanned, createPost);

// GET  /api/communities/:communityId/events — list approved events for a community
// POST /api/communities/:communityId/events — submit a new event (pending moderator approval; requireNotBanned)
router
  .route('/:communityId/events')
  .get(listEvents)
  .post(requireNotBanned, createEvent);

// GET /api/communities/:communityId/timeline — chat timeline with cursor-based pagination
router.get('/:communityId/timeline', getChatTimeline);
// GET /api/communities/:communityId/messages — full chat history for a community
router.get('/:communityId/messages', getMessages);

// GET /api/communities/:id — fetch a single community by ID (access-gated)
router.get('/:id', getCommunity);

export default router;
