import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { assertCommunityAccess } from '../utils/membership.js';
import { applyVote } from '../utils/vote.js';

/**
 * COMMENT CONTROLLER
 * ----------------------------------------------------------------------------
 * Threaded, Reddit-style comments. A comment with parentId === null is a
 * top-level reply to the post; otherwise it is a reply to another comment.
 */

/**
 * GET /api/posts/:postId/comments
 * Returns the full comment thread for a post as a nested tree, so the frontend
 * can render indentation without doing the tree-building itself.
 */
export const listComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, 'Post not found.');
  await assertCommunityAccess(req.user, post.communityId);

  // Fetch every comment for the post in one query, oldest first.
  const flat = await Comment.find({ postId }).sort({ createdAt: 1 }).lean({ virtuals: true });

  // Build a tree: index by id, then attach each comment to its parent's replies.
  const byId = new Map();
  flat.forEach((c) => {
    c.replies = [];
    byId.set(c._id.toString(), c);
  });

  const roots = [];
  flat.forEach((c) => {
    if (c.parentId) {
      const parent = byId.get(c.parentId.toString());
      // If the parent exists, nest under it; otherwise treat as a root (safety).
      if (parent) parent.replies.push(c);
      else roots.push(c);
    } else {
      roots.push(c);
    }
  });

  res.json({ success: true, count: flat.length, comments: roots });
});

/**
 * POST /api/posts/:postId/comments
 * Body: { content, parentId? }
 * Adds a comment (parentId omitted) or a reply (parentId set).
 */
export const createComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content, parentId } = req.body;

  if (!content || !content.trim()) throw new ApiError(400, 'Comment content is required.');

  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, 'Post not found.');
  await assertCommunityAccess(req.user, post.communityId);

  // If replying, make sure the parent comment exists and belongs to this post.
  if (parentId) {
    const parent = await Comment.findById(parentId);
    if (!parent || parent.postId.toString() !== postId) {
      throw new ApiError(400, 'Parent comment does not belong to this post.');
    }
  }

  const comment = await Comment.create({
    postId,
    parentId: parentId || null,
    authorId: req.user._id,
    anonymousUsername: req.user.username, // frozen alias snapshot
    content: content.trim()
  });

  // Keep the post's cached comment count in sync for feed display.
  await Post.updateOne({ _id: postId }, { $inc: { commentCount: 1 } });

  res.status(201).json({ success: true, comment });
});

/**
 * POST /api/comments/:id/vote
 * Body: { direction: "up" | "down" | "none" }
 */
export const voteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new ApiError(404, 'Comment not found.');

  const post = await Post.findById(comment.postId);
  if (post) await assertCommunityAccess(req.user, post.communityId);

  applyVote(comment, req.user._id, req.body.direction);
  await comment.save();

  res.json({ success: true, score: comment.score, comment });
});

/**
 * DELETE /api/comments/:id
 * Authors can delete their own comments. We "soft-handle" replies by also
 * removing direct child replies' linkage is complex; here we delete the comment
 * and all of its descendants so the thread stays consistent.
 */
export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new ApiError(404, 'Comment not found.');

  if (comment.authorId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You can only delete your own comments.');
  }

  // Gather this comment plus every descendant (replies, replies-of-replies...).
  const toDelete = await collectDescendantIds(comment._id, comment.postId);

  await Comment.deleteMany({ _id: { $in: toDelete } });
  await Post.updateOne({ _id: comment.postId }, { $inc: { commentCount: -toDelete.length } });

  res.json({ success: true, message: `Deleted ${toDelete.length} comment(s).` });
});

/**
 * Walks the reply tree under a comment and returns the set of ids to delete
 * (including the comment itself). Done in memory from a single fetch of the
 * post's comments to avoid N recursive DB calls.
 */
const collectDescendantIds = async (rootId, postId) => {
  const all = await Comment.find({ postId }).select('_id parentId').lean();

  // Build parent -> children adjacency.
  const childrenOf = new Map();
  all.forEach((c) => {
    const key = c.parentId ? c.parentId.toString() : null;
    if (!childrenOf.has(key)) childrenOf.set(key, []);
    childrenOf.get(key).push(c._id.toString());
  });

  // BFS from the root collecting every descendant id.
  const result = [];
  const queue = [rootId.toString()];
  while (queue.length) {
    const current = queue.shift();
    result.push(current);
    const kids = childrenOf.get(current) || [];
    queue.push(...kids);
  }
  return result;
};
