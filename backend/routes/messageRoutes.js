import { Router } from 'express';
import { protect, requireNotBanned } from '../middleware/auth.js';
import { reactToMessage, reactWithEmoji } from '../controllers/messageController.js';
import { createReply, listThread } from '../controllers/messageReplyController.js';

/**
 * Single chat-message routes: reactions and the reply thread.
 * (Sending messages + loading history happen via Socket.io and
 *  GET /communities/:id/messages respectively.)
 *
 *   POST /api/messages/:id/react           -> like/dislike/none
 *   POST /api/messages/:id/emoji           -> toggle an emoji reaction
 *   GET  /api/messages/:messageId/replies  -> nested reply thread
 *   POST /api/messages/:parentId/replies   -> reply to a message OR a reply
 */
const router = Router();

router.use(protect);

router.post('/:id/react', reactToMessage);
router.post('/:id/emoji', reactWithEmoji);

// Separate definitions keep each handler's expected param name (messageId vs parentId).
router.get('/:messageId/replies', listThread);
router.post('/:parentId/replies', requireNotBanned, createReply);

export default router;
