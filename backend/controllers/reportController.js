import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Message from '../models/Message.js';
import Reported from '../models/Reported.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { assertCommunityAccess } from '../utils/membership.js';

/**
 * REPORT CONTROLLER (user-facing)
 * ----------------------------------------------------------------------------
 * Lets any logged-in user flag a post, comment or reply. The report lands in
 * the moderator queue (see moderatorController). Reporters stay anonymous to
 * other users; only moderators see who reported what.
 */

/**
 * POST /api/reports
 * Body: { contentType: "post"|"comment"|"reply"|"message", contentId, reason? }
 * Validates the target exists, snapshots both author + reporter, and stores it.
 */
export const createReport = asyncHandler(async (req, res) => {
  const { contentType, contentId, reason } = req.body;

  if (!contentType || !contentId) {
    throw new ApiError(400, 'contentType and contentId are required.');
  }
  if (!['post', 'comment', 'reply', 'message'].includes(contentType)) {
    throw new ApiError(400, 'contentType must be "post", "comment", "reply" or "message".');
  }

  // Resolve the target content and capture the author snapshot + location.
  // Each content kind stores its author/alias under different field names, so
  // we normalize them into authorId/authorUsername here.
  let resolvedType;        // normalized type actually stored
  let postId = null;       // set for comments/replies
  let communityId = null;
  let authorId;
  let authorUsername;

  if (contentType === 'post') {
    const target = await Post.findById(contentId);
    if (!target) throw new ApiError(404, 'Post not found.');
    resolvedType = 'post';
    postId = target._id;
    communityId = target.communityId;
    authorId = target.authorId;
    authorUsername = target.anonymousUsername;
  } else if (contentType === 'message') {
    // Group-chat message lives in the Message collection.
    const target = await Message.findById(contentId);
    if (!target) throw new ApiError(404, 'Message not found.');
    resolvedType = 'message';
    communityId = target.communityId;
    authorId = target.senderId; // messages use senderId, not authorId
    authorUsername = target.anonymousUsername;
  } else {
    // comment or reply both live in the Comment collection.
    const target = await Comment.findById(contentId);
    if (!target) throw new ApiError(404, 'Comment not found.');
    // A comment with a parentId is really a reply.
    resolvedType = target.parentId ? 'reply' : 'comment';
    postId = target.postId;
    authorId = target.authorId;
    authorUsername = target.anonymousUsername;
    // Look up the parent post to record the community for the report.
    const parentPost = await Post.findById(target.postId).select('communityId');
    communityId = parentPost?.communityId || null;
  }

  // The reporter must be able to access the community the content lives in.
  if (communityId) {
    await assertCommunityAccess(req.user, communityId);
  }

  // Don't let users report their own content.
  if (authorId.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot report your own content.');
  }

  // Build the report. The unique (reporterId, contentId) index blocks duplicates.
  try {
    const report = await Reported.create({
      contentType: resolvedType,
      contentId,
      postId,
      communityId,
      contentAuthorId: authorId,
      contentAuthorUsername: authorUsername,
      reporterId: req.user._id,
      reporterUsername: req.user.username,
      reason: reason?.trim() || ''
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted. Our moderators will review it.',
      report
    });
  } catch (err) {
    // Duplicate key => the user already reported this exact content.
    if (err.code === 11000) {
      throw new ApiError(409, 'You have already reported this content.');
    }
    throw err;
  }
});
