import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { voteComment, deleteComment } from '../controllers/commentController.js';

/**
 * Single-comment routes.
 *   POST   /api/comments/:id/vote  -> up/down/none
 *   DELETE /api/comments/:id       -> delete own comment (+ its replies)
 */
const router = Router();

router.use(protect);

router.post('/:id/vote', voteComment);
router.delete('/:id', deleteComment);

export default router;
