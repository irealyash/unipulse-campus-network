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

// POST /api/messages/:id/react — toggle a like/dislike/none reaction on a chat message
router.post('/:id/react', reactToMessage);
// POST /api/messages/:id/emoji — toggle a specific emoji reaction on a chat message
router.post('/:id/emoji', reactWithEmoji);

// GET  /api/messages/:messageId/replies — fetch the nested reply thread for a message
router.get('/:messageId/replies', listThread);
// POST /api/messages/:parentId/replies — reply to a message or reply (requireNotBanned blocks banned users)
router.post('/:parentId/replies', requireNotBanned, createReply);

export default router;
