import Post from '../models/Post.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { assertCommunityAccess } from '../utils/membership.js';
import { applyLikeDislike } from '../utils/likeDislike.js';
import { toggleEmojiReaction } from '../utils/emojiReaction.js';
import { deletePostCascade } from '../utils/contentDeletion.js';

/**
 * POST CONTROLLER
 * ----------------------------------------------------------------------------
 * The "posts" tab of every community — a Reddit-style feed with titles, body
 * text, optional media, tags and up/down voting. All actions are access-gated:
 * a user can only read or write in communities they belong to.
 */

/**
 * GET /api/communities/:communityId/posts?sort=new|top&page=1&limit=20
 * Returns a paginated feed for a community the user can access.
 */
export const listPosts = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  await assertCommunityAccess(req.user, communityId); // gate the read

  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 50);
  const skip = (page - 1) * limit;
  const sort = req.query.sort === 'top' ? 'top' : 'new';

  let posts;
  if (sort === 'top') {
    // "Top" needs to sort by net score (likes - dislikes), which is a virtual,
    // so we compute it server-side with an aggregation pipeline.
    posts = await Post.aggregate([
      { $match: { communityId } },
      {
        $addFields: {
          score: { $subtract: [{ $size: '$likes' }, { $size: '$dislikes' }] }
        }
      },
      { $sort: { score: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);
  } else {
    // "New" is a simple indexed sort on createdAt.
    posts = await Post.find({ communityId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean({ virtuals: true });
  }

  const total = await Post.countDocuments({ communityId });

  res.json({
    success: true,
    page,
    limit,
    total,
    hasMore: skip + posts.length < total,
    posts
  });
});

/**
 * GET /api/posts/:id
 * Returns a single post (after confirming community access).
 */
export const getPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new ApiError(404, 'Post not found.');

  await assertCommunityAccess(req.user, post.communityId);

  res.json({ success: true, post });
});

/**
 * POST /api/communities/:communityId/posts
 * Body: { title, content, tag?, media? { url, mediaType } }
 * Creates a post. The author's current alias is frozen onto the post.
 */
export const createPost = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const community = await assertCommunityAccess(req.user, communityId);

  const { title, content, tag, media } = req.body;

  if (!title || !title.trim()) throw new ApiError(400, 'Title is required.');
  if (!content || !content.trim()) throw new ApiError(400, 'Content is required.');

  // If a tag is supplied it must be one this community allows.
  if (tag && !community.allowedTags.includes(tag)) {
    throw new ApiError(400, `Invalid tag. Allowed tags: ${community.allowedTags.join(', ')}`);
  }

  const post = await Post.create({
    communityId,
    authorId: req.user._id,
    anonymousUsername: req.user.username, // frozen snapshot of the alias
    title: title.trim(),
    content: content.trim(),
    tag: tag || null,
    media: {
      url: media?.url || null,
      mediaType: media?.mediaType || null
    }
  });

  res.status(201).json({ success: true, post });
});

/**
 * POST /api/posts/:id/react
 * Body: { action: "like" | "dislike" | "none" }
 * Toggles the current user's like/dislike. "none" clears any existing reaction.
 */
export const reactToPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new ApiError(404, 'Post not found.');

  await assertCommunityAccess(req.user, post.communityId);

  // applyLikeDislike mutates the likes/dislikes arrays according to the action.
  applyLikeDislike(post, req.user._id, req.body.action);
  await post.save();

  res.json({ success: true, score: post.score, post });
});

/**
 * POST /api/posts/:id/emoji
 * Body: { emoji: "🔥" }
 * Toggles an emoji reaction on a post for the current user.
 */
export const reactToPostWithEmoji = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new ApiError(404, 'Post not found.');

  await assertCommunityAccess(req.user, post.communityId);

  const state = toggleEmojiReaction(post, req.user._id, req.body.emoji);
  await post.save();

  res.json({ success: true, state, reactions: post.reactions, post });
});

/**
 * DELETE /api/posts/:id
 * Authors can delete their own posts. Cascades to its comments so we don't
 * leave orphaned replies behind.
 */
export const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new ApiError(404, 'Post not found.');

  // Only the original author may delete. (Moderators use the /moderator routes.)
  if (post.authorId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You can only delete your own posts.');
  }

  // Cascade: removes the post, all its comments/replies, and resolves reports.
  await deletePostCascade(post._id);

  res.json({ success: true, message: 'Post deleted.' });
});
