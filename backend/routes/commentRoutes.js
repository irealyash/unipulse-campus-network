import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { reactToComment, reactToCommentWithEmoji, deleteComment } from '../controllers/commentController.js';

/**
 * Single-comment routes (these also cover replies, which are comments).
 *   POST   /api/comments/:id/react  -> like/dislike/none
 *   POST   /api/comments/:id/emoji  -> toggle an emoji reaction
 *   DELETE /api/comments/:id        -> delete own comment (+ its replies)
 */
const router = Router();

router.use(protect);

router.post('/:id/react', reactToComment);
router.post('/:id/emoji', reactToCommentWithEmoji);
router.delete('/:id', deleteComment);

export default router;
