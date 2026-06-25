import { Router } from 'express';
import { protect, requireNotBanned } from '../middleware/auth.js';
import {
  listCommunities,
  getCommunity,
  createCommunity
} from '../controllers/communityController.js';
import { listPosts, createPost } from '../controllers/postController.js';
import { listEvents, createEvent } from '../controllers/eventController.js';
import { getMessages } from '../controllers/messageController.js';

/**
 * Community routes, plus the community-scoped collections nested beneath them
 * (posts / events / chat history). All require authentication.
 *
 *   GET  /api/communities                      -> rooms this user can see
 *   POST /api/communities                      -> create a general community
 *   GET  /api/communities/:id                  -> one community (access-gated)
 *
 *   GET  /api/communities/:communityId/posts   -> post feed
 *   POST /api/communities/:communityId/posts   -> create post
 *   GET  /api/communities/:communityId/events  -> events list
 *   POST /api/communities/:communityId/events  -> create event
 *   GET  /api/communities/:communityId/messages-> chat history
 */
const router = Router();

router.use(protect);

// Community collection + creation.
router.route('/').get(listCommunities).post(requireNotBanned, createCommunity);

// Nested post feed (declared before "/:id" is fine since paths are distinct).
router
  .route('/:communityId/posts')
  .get(listPosts)
  .post(requireNotBanned, createPost);

// Nested events.
router
  .route('/:communityId/events')
  .get(listEvents)
  .post(requireNotBanned, createEvent);

// Nested chat history (sending happens over Socket.io).
router.get('/:communityId/messages', getMessages);

// Single community lookup.
router.get('/:id', getCommunity);

export default router;
