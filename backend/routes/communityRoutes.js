import { Router } from 'express';
import { protect, requireNotBanned, requireModerator } from '../middleware/auth.js';
import {
  listCommunities,
  getCommunity,
  createCommunity
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
 *   POST /api/communities                      -> create a general community (mod only)
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

// Community collection + creation (creation is moderator-only).
router.route('/').get(listCommunities).post(requireModerator, createCommunity);

// Nested post feed (declared before "/:id" is fine since paths are distinct).
router
  .route('/:communityId/posts')
  .get(listPosts)
  .post(requireNotBanned, createPost);

// Nested events — any member can submit; moderator approves before listing.
router
  .route('/:communityId/events')
  .get(listEvents)
  .post(requireNotBanned, createEvent);

// Nested chat history (sending happens over Socket.io).
router.get('/:communityId/timeline', getChatTimeline);
router.get('/:communityId/messages', getMessages);

// Single community lookup.
router.get('/:id', getCommunity);

export default router;
