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

router.use(protect);

router.post('/:id/react', reactToReply);
router.post('/:id/emoji', reactToReplyWithEmoji);
router.delete('/:id', deleteReply);

export default router;
