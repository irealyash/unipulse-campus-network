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

// GET    /api/posts/:id — fetch a single post by ID
// DELETE /api/posts/:id — delete the caller's own post (cascades to its comments)
router.route('/:id').get(getPost).delete(deletePost);
// POST /api/posts/:id/react — toggle a like/dislike/none reaction on a post
router.post('/:id/react', reactToPost);
// POST /api/posts/:id/emoji — toggle a specific emoji reaction on a post
router.post('/:id/emoji', reactToPostWithEmoji);

// GET  /api/posts/:postId/comments — retrieve the threaded comment tree for a post
// POST /api/posts/:postId/comments — add a comment or reply (requireNotBanned blocks banned users)
router
  .route('/:postId/comments')
  .get(listComments)
  .post(requireNotBanned, createComment);

export default router;
