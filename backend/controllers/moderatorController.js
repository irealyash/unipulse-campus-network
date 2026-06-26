import mongoose from 'mongoose';
import User from '../models/User.js';
import Community from '../models/Community.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Message from '../models/Message.js';
import Reported from '../models/Reported.js';
import ModeratorRequest from '../models/ModeratorRequest.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { deletePostCascade, deleteCommentCascade, deleteMessage } from '../utils/contentDeletion.js';
import { withCommunityImage } from '../utils/avatars.js';
import MessageReply from '../models/MessageReply.js';

/**
 * MODERATOR CONTROLLER
 * ----------------------------------------------------------------------------
 * Powers the moderator-only tab. Everything here is reachable ONLY via
 * /api/moderator/* routes, which are guarded by protect + requireModerator.
 *
 * Key difference from the normal endpoints: there are NO community access
 * checks here. A moderator can browse every community (general AND course),
 * look up any user's full activity, and see every underlying id (user ids,
 * post ids, comment ids, message sender ids). This realizes the requirement
 * that moderators can "see anyone's user id and all content ids — but only
 * through the moderator tab".
 */

/* ------------------------------------------------------------------ */
/* Communities                                                         */
/* ------------------------------------------------------------------ */

/**
 * GET /api/moderator/communities?search=
 * Lists ALL communities on the platform (general + course), optionally filtered
 * by a search term matching the id or display name.
 */
export const listAllCommunities = asyncHandler(async (req, res) => {
  const { search } = req.query;

  const filter = {};
  if (search && search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ _id: rx }, { name: rx }];
  }

  const communities = await Community.find(filter).sort({ type: 1, _id: 1 });
  res.json({
    success: true,
    count: communities.length,
    communities: communities.map((c) => withCommunityImage(c)),
  });
});

/**
 * PATCH /api/moderator/communities/:communityId
 * Body: { name?, imageUrl? }
 */
export const updateCommunity = asyncHandler(async (req, res) => {
  const community = await Community.findById(req.params.communityId);
  if (!community) throw new ApiError(404, 'Community not found.');

  const { name, imageUrl } = req.body;
  if (name?.trim()) community.name = name.trim();
  if (imageUrl !== undefined) community.imageUrl = imageUrl?.trim() || null;

  await community.save();
  res.json({ success: true, community: withCommunityImage(community) });
});

/**
 * GET /api/moderator/communities/:communityId/posts?page&limit
 * Full post feed for ANY community, with all ids intact. No access gate.
 */
export const browseCommunityPosts = asyncHandler(async (req, res) => {
  const { communityId } = req.params;

  const community = await Community.findById(communityId);
  if (!community) throw new ApiError(404, 'Community not found.');

  const { page, limit, skip } = paginate(req);

  const [posts, total] = await Promise.all([
    Post.find({ communityId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    Post.countDocuments({ communityId })
  ]);

  res.json({ success: true, community, page, limit, total, hasMore: skip + posts.length < total, posts });
});

/**
 * GET /api/moderator/communities/:communityId/messages?before&limit
 * Full group-chat history for ANY community, including each message's senderId.
 */
export const browseCommunityMessages = asyncHandler(async (req, res) => {
  const { communityId } = req.params;

  const community = await Community.findById(communityId);
  if (!community) throw new ApiError(404, 'Community not found.');

  const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 200);
  const filter = { communityId };
  if (req.query.before) {
    const before = new Date(req.query.before);
    if (!isNaN(before.getTime())) filter.createdAt = { $lt: before };
  }

  const messages = await Message.find(filter).sort({ createdAt: -1 }).limit(limit);
  res.json({ success: true, community, count: messages.length, messages: messages.reverse() });
});

/**
 * GET /api/moderator/posts/:postId/comments
 * Full threaded comment tree for ANY post, with all ids. No access gate.
 */
export const browsePostComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, 'Post not found.');

  const flat = await Comment.find({ postId }).sort({ createdAt: 1 }).lean({ virtuals: true });

  // Build a nested tree (same algorithm as the user-facing endpoint).
  const byId = new Map();
  flat.forEach((c) => {
    c.replies = [];
    byId.set(c._id.toString(), c);
  });
  const roots = [];
  flat.forEach((c) => {
    if (c.parentId && byId.get(c.parentId.toString())) {
      byId.get(c.parentId.toString()).replies.push(c);
    } else {
      roots.push(c);
    }
  });

  res.json({ success: true, post, count: flat.length, comments: roots });
});

/* ------------------------------------------------------------------ */
/* User lookup                                                         */
/* ------------------------------------------------------------------ */

/**
 * GET /api/moderator/users/:identifier
 * Look up a user by their _id OR username, returning their full profile plus
 * their posts and comments (newest first). This is how a moderator inspects
 * everything a given user has said across the platform.
 */
export const lookupUser = asyncHandler(async (req, res) => {
  const user = await findUserByIdentifier(req.params.identifier);
  if (!user) throw new ApiError(404, 'User not found.');

  const { page, limit, skip } = paginate(req);

  const [posts, postCount, comments, commentCount, messages, messageCount, replies, replyCount] =
    await Promise.all([
      Post.find({ authorId: user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean({ virtuals: true }),
      Post.countDocuments({ authorId: user._id }),
      Comment.find({ authorId: user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean({ virtuals: true }),
      Comment.countDocuments({ authorId: user._id }),
      Message.find({ senderId: user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Message.countDocuments({ senderId: user._id }),
      MessageReply.find({ senderId: user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      MessageReply.countDocuments({ senderId: user._id }),
    ]);

  const chatItems = [...messages, ...replies]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);

  res.json({
    success: true,
    user: moderatorUserView(user),
    page,
    limit,
    posts: { total: postCount, items: posts },
    comments: { total: commentCount, items: comments },
    messages: { total: messageCount + replyCount, items: chatItems },
  });
});

/* ------------------------------------------------------------------ */
/* Direct deletion (delete anything by id)                             */
/* ------------------------------------------------------------------ */

/**
 * DELETE /api/moderator/posts/:id
 * Deletes any post (and its comments + resolves related reports).
 */
export const deleteAnyPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new ApiError(404, 'Post not found.');

  const { deletedComments } = await deletePostCascade(post._id, req.user._id);
  res.json({
    success: true,
    message: `Post deleted (also removed ${deletedComments} comment(s)).`
  });
});

/**
 * DELETE /api/moderator/comments/:id
 * Deletes any comment or reply (and its descendant replies + related reports).
 */
export const deleteAnyComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new ApiError(404, 'Comment not found.');

  const deleted = await deleteCommentCascade(comment._id, comment.postId, req.user._id);
  res.json({ success: true, message: `Deleted ${deleted} comment(s)/repl(ies).` });
});

/**
 * DELETE /api/moderator/messages/:id
 * Deletes any group-chat message (and resolves related reports).
 */
export const deleteAnyMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) throw new ApiError(404, 'Message not found.');

  await deleteMessage(message._id, req.user._id);
  res.json({ success: true, message: 'Message deleted.' });
});

/* ------------------------------------------------------------------ */
/* Reports queue                                                       */
/* ------------------------------------------------------------------ */

/**
 * GET /api/moderator/reports?status=pending&page&limit
 * Lists reports for review. Defaults to pending only.
 */
export const listReports = asyncHandler(async (req, res) => {
  const status = req.query.status || 'pending';
  const allowed = ['pending', 'resolved', 'dismissed', 'all'];
  if (!allowed.includes(status)) {
    throw new ApiError(400, `status must be one of: ${allowed.join(', ')}`);
  }

  const { page, limit, skip } = paginate(req);
  const filter = status === 'all' ? {} : { status };

  const [reports, total] = await Promise.all([
    Reported.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Reported.countDocuments(filter)
  ]);

  res.json({ success: true, page, limit, total, hasMore: skip + reports.length < total, reports });
});

/**
 * POST /api/moderator/reports/:id/resolve
 * Body: { action: "delete" | "dismiss" }
 *   - "delete"  -> remove the reported content (cascades) and resolve the report
 *   - "dismiss" -> keep the content, just dismiss the report ("skip")
 */
export const resolveReport = asyncHandler(async (req, res) => {
  const action = req.body.action;
  if (!['delete', 'dismiss', 'skip'].includes(action)) {
    throw new ApiError(400, 'action must be "delete" or "dismiss".');
  }

  const report = await Reported.findById(req.params.id);
  if (!report) throw new ApiError(404, 'Report not found.');

  // --- Dismiss / skip: leave content alone, mark the report dismissed. ---
  if (action === 'dismiss' || action === 'skip') {
    report.status = 'dismissed';
    report.resolvedBy = req.user._id;
    report.resolvedAt = new Date();
    await report.save();
    return res.json({ success: true, message: 'Report dismissed.', report });
  }

  // --- Delete: remove the offending content (cascade resolves the reports). ---
  if (report.contentType === 'post') {
    const exists = await Post.exists({ _id: report.contentId });
    if (exists) await deletePostCascade(report.contentId, req.user._id);
  } else if (report.contentType === 'message') {
    await deleteMessage(report.contentId, req.user._id);
  } else {
    // comment or reply
    const exists = await Comment.exists({ _id: report.contentId });
    if (exists) await deleteCommentCascade(report.contentId, report.postId, req.user._id);
  }

  // Make sure THIS report is marked resolved even if the content was already gone.
  await Reported.updateOne(
    { _id: report._id },
    { status: 'resolved', resolvedBy: req.user._id, resolvedAt: new Date() }
  );

  res.json({ success: true, message: 'Content deleted and report resolved.' });
});

/* ------------------------------------------------------------------ */
/* User requests to moderators                                         */
/* ------------------------------------------------------------------ */

/**
 * GET /api/moderator/requests?status=pending&page&limit
 * Lists user-submitted requests/messages for moderators to review.
 */
export const listRequests = asyncHandler(async (req, res) => {
  const status = req.query.status || 'pending';
  const allowed = ['pending', 'reviewed', 'dismissed', 'all'];
  if (!allowed.includes(status)) {
    throw new ApiError(400, `status must be one of: ${allowed.join(', ')}`);
  }

  const { page, limit, skip } = paginate(req);
  const filter = status === 'all' ? {} : { status };

  const [requests, total] = await Promise.all([
    ModeratorRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ModeratorRequest.countDocuments(filter)
  ]);

  res.json({ success: true, page, limit, total, hasMore: skip + requests.length < total, requests });
});

/**
 * POST /api/moderator/requests/:id/resolve
 * Body: { action: "reviewed" | "dismissed" }
 * Marks a user request as handled.
 */
export const resolveRequest = asyncHandler(async (req, res) => {
  const action = req.body.action;
  if (!['reviewed', 'dismissed'].includes(action)) {
    throw new ApiError(400, 'action must be "reviewed" or "dismissed".');
  }

  const request = await ModeratorRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, 'Request not found.');

  request.status = action;
  request.handledBy = req.user._id;
  request.handledAt = new Date();
  await request.save();

  res.json({ success: true, message: `Request marked ${action}.`, request });
});

/* ------------------------------------------------------------------ */
/* Banning                                                             */
/* ------------------------------------------------------------------ */

/**
 * PATCH /api/moderator/users/:id/ban
 * Body: { banned: true | false }
 * Bans or unbans a user by id. A moderator cannot ban themselves or another
 * moderator (prevents accidental lockouts and mod-vs-mod conflicts).
 */
export const setUserBan = asyncHandler(async (req, res) => {
  const banned = req.body.banned;
  if (typeof banned !== 'boolean') {
    throw new ApiError(400, 'banned (boolean) is required.');
  }

  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Invalid user id.');
  }

  const target = await User.findById(req.params.id);
  if (!target) throw new ApiError(404, 'User not found.');

  if (target._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot ban yourself.');
  }
  if (target.moderator) {
    throw new ApiError(403, 'You cannot ban another moderator.');
  }

  target.isBanned = banned;
  await target.save();

  res.json({ success: true, message: banned ? 'User banned.' : 'User unbanned.', user: moderatorUserView(target) });
});

/* ------------------------------------------------------------------ */
/* Post approval queue                                                 */
/* ------------------------------------------------------------------ */

/**
 * GET /api/moderator/posts?status=pending&page&limit
 * Lists posts awaiting (or previously) moderator review.
 */
export const listPostsForReview = asyncHandler(async (req, res) => {
  const status = req.query.status || 'pending';
  const allowed = ['pending', 'approved', 'rejected', 'all'];
  if (!allowed.includes(status)) {
    throw new ApiError(400, `status must be one of: ${allowed.join(', ')}`);
  }

  const { page, limit, skip } = paginate(req);
  const filter = status === 'all' ? {} : { status };

  const [posts, total] = await Promise.all([
    Post.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean({ virtuals: true }),
    Post.countDocuments(filter)
  ]);

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
 * POST /api/moderator/posts/:id/approve
 * Approves a pending post so it appears in community feeds.
 */
export const approvePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new ApiError(404, 'Post not found.');

  post.status = 'approved';
  post.reviewedBy = req.user._id;
  post.reviewedAt = new Date();
  await post.save();

  res.json({ success: true, message: 'Post approved.', post });
});

/**
 * POST /api/moderator/posts/:id/reject
 * Rejects a post so it never appears in feeds.
 */
export const rejectPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new ApiError(404, 'Post not found.');

  post.status = 'rejected';
  post.reviewedBy = req.user._id;
  post.reviewedAt = new Date();
  await post.save();

  res.json({ success: true, message: 'Post rejected.', post });
});

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// Escapes a user-supplied string so it is safe to use inside a RegExp.
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Shared pagination parsing for moderator list endpoints.
const paginate = (req) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

// Finds a user by ObjectId (if the identifier looks like one) or by username.
const findUserByIdentifier = async (identifier) => {
  if (!identifier) return null;
  if (mongoose.isValidObjectId(identifier)) {
    const byId = await User.findById(identifier);
    if (byId) return byId;
  }
  return User.findOne({ username: identifier });
};

// Full user view for moderators (includes id + moderation flags; excludes the
// password hash, which is select:false on the schema anyway).
const moderatorUserView = (user) => ({
  id: user._id,
  email: user.email,
  username: user.username,
  enrolledSections: user.enrolledSections,
  scheduleUploaded: user.scheduleUploaded,
  isBanned: user.isBanned,
  moderator: user.moderator,
  lastUsernameChange: user.lastUsernameChange,
  createdAt: user.createdAt
});
