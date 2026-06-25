import { Router } from 'express';
import { protect, requireNotBanned } from '../middleware/auth.js';
import { getPost, reactToPost, reactToPostWithEmoji, deletePost } from '../controllers/postController.js';
import { listComments, createComment } from '../controllers/commentController.js';

/**
 * Single-post routes and the comments nested under a post.
 *   GET    /api/posts/:id                 -> one post
 *   POST   /api/posts/:id/react           -> like/dislike/none
 *   POST   /api/posts/:id/emoji           -> toggle an emoji reaction
 *   DELETE /api/posts/:id                 -> delete own post (+ its comments)
 *
 *   GET    /api/posts/:postId/comments    -> threaded comment tree
 *   POST   /api/posts/:postId/comments    -> add comment/reply
 */
const router = Router();

router.use(protect);

router.route('/:id').get(getPost).delete(deletePost);
router.post('/:id/react', reactToPost);
router.post('/:id/emoji', reactToPostWithEmoji);

router
  .route('/:postId/comments')
  .get(listComments)
  .post(requireNotBanned, createComment);

export default router;
