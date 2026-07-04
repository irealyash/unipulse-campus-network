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

// POST /api/comments/:id/react — toggle a like/dislike/none reaction on a comment
router.post('/:id/react', reactToComment);
// POST /api/comments/:id/emoji — toggle a specific emoji reaction on a comment
router.post('/:id/emoji', reactToCommentWithEmoji);
// DELETE /api/comments/:id — delete the caller's own comment (cascades to nested replies)
router.delete('/:id', deleteComment);

export default router;
