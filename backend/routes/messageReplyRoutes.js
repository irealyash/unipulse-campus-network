import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  reactToReply,
  reactToReplyWithEmoji,
  deleteReply
} from '../controllers/messageReplyController.js';

/**
 * Single message-reply routes (creating/listing replies lives under
 * /api/messages/:id/replies).
 *
 *   POST   /api/message-replies/:id/react  -> like/dislike/none
 *   POST   /api/message-replies/:id/emoji  -> toggle an emoji reaction
 *   DELETE /api/message-replies/:id        -> delete own reply (+ nested replies)
 */
const router = Router();

// All message-reply routes require authentication
router.use(protect);

// POST /:id/react — toggle like/dislike/none reaction on a reply (protect)
router.post('/:id/react', reactToReply);
// POST /:id/emoji — toggle an emoji reaction on a reply (protect)
router.post('/:id/emoji', reactToReplyWithEmoji);
// DELETE /:id — delete the authenticated user's own reply and its nested replies (protect)
router.delete('/:id', deleteReply);

export default router;
