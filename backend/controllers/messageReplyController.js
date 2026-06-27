import Message from '../models/Message.js';
import MessageReply from '../models/MessageReply.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { assertCommunityAccess } from '../utils/membership.js';
import { applyLikeDislike } from '../utils/likeDislike.js';
import { toggleSingleEmojiReaction } from '../utils/emojiReaction.js';
import { deleteMessageReplyCascade } from '../utils/contentDeletion.js';

/**
 * MESSAGE REPLY CONTROLLER
 * ----------------------------------------------------------------------------
 * Threaded replies inside the group chat. A reply points at a parent that may
 * be a root Message OR another reply (reply-to-a-reply). Replies are anonymous
 * and support the same like/dislike + emoji reactions as messages.
 */

/**
 * Resolves the parent of a reply by id (it could be a Message or a MessageReply)
 * and returns { parent, parentType, communityId }. Throws 404 if not found.
 */
const resolveParent = async (parentId) => {
  // Try a root message first.
  const message = await Message.findById(parentId);
  if (message) {
    return { parent: message, parentType: 'message', communityId: message.communityId };
  }
  // Otherwise it must be another reply.
  const reply = await MessageReply.findById(parentId);
  if (reply) {
    return { parent: reply, parentType: 'reply', communityId: reply.communityId };
  }
  throw new ApiError(404, 'Parent message or reply not found.');
};

/**
 * POST /api/messages/:parentId/replies
 * Body: { content }
 * Creates a reply to a message OR to another reply (parentId may be either).
 * The community is inherited from the parent and access is enforced.
 */
export const createReply = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) throw new ApiError(400, 'Reply content is required.');

  const { parentType, communityId } = await resolveParent(req.params.parentId);

  // Must be allowed in the room the parent lives in.
  await assertCommunityAccess(req.user, communityId);

  const reply = await MessageReply.create({
    communityId,
    parentMessageId: req.params.parentId,
    parentType, // "message" or "reply" — purely a frontend hint
    senderId: req.user._id,
    anonymousUsername: req.user.username, // frozen alias snapshot
    content: content.trim()
  });

  res.status(201).json({ success: true, reply });
});

/**
 * GET /api/messages/:messageId/replies
 * Returns the full nested reply thread for a root message, built level-by-level
 * from parentMessageId links (no root field needed — ids are globally unique).
 */
export const listThread = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  const message = await Message.findById(messageId);
  if (!message) throw new ApiError(404, 'Message not found.');
  await assertCommunityAccess(req.user, message.communityId);

  // Gather the whole thread by walking down levels: start from the message id,
  // fetch its children, then their children, and so on.
  const all = [];
  let frontier = [messageId];
  while (frontier.length) {
    const level = await MessageReply.find({ parentMessageId: { $in: frontier } })
      .sort({ createdAt: 1 })
      .lean({ virtuals: true });
    if (level.length === 0) break;
    all.push(...level);
    frontier = level.map((r) => r._id);
  }

  // Build a tree keyed by parentMessageId.
  const byId = new Map();
  all.forEach((r) => {
    r.replies = [];
    byId.set(r._id.toString(), r);
  });
  const roots = []; // direct replies to the root message
  all.forEach((r) => {
    const parentKey = r.parentMessageId.toString();
    if (parentKey === messageId.toString()) {
      roots.push(r);
    } else if (byId.has(parentKey)) {
      byId.get(parentKey).replies.push(r);
    } else {
      roots.push(r); // safety net for any orphan
    }
  });

  res.json({ success: true, count: all.length, replies: roots });
});

/**
 * POST /api/message-replies/:id/react
 * Body: { action: "like" | "dislike" | "none" }
 */
export const reactToReply = asyncHandler(async (req, res) => {
  const reply = await MessageReply.findById(req.params.id);
  if (!reply) throw new ApiError(404, 'Reply not found.');

  await assertCommunityAccess(req.user, reply.communityId);

  applyLikeDislike(reply, req.user._id, req.body.action);
  await reply.save();

  res.json({ success: true, score: reply.score, reply });
});

/**
 * POST /api/message-replies/:id/emoji
 * Body: { emoji }
 */
export const reactToReplyWithEmoji = asyncHandler(async (req, res) => {
  const reply = await MessageReply.findById(req.params.id);
  if (!reply) throw new ApiError(404, 'Reply not found.');

  await assertCommunityAccess(req.user, reply.communityId);

  const state = toggleSingleEmojiReaction(reply, req.user._id, req.body.emoji);
  await reply.save();

  res.json({ success: true, state, reactions: reply.reactions, reply });
});

/**
 * DELETE /api/message-replies/:id
 * Authors can delete their own reply (and its nested replies cascade out).
 */
export const deleteReply = asyncHandler(async (req, res) => {
  const reply = await MessageReply.findById(req.params.id);
  if (!reply) throw new ApiError(404, 'Reply not found.');

  if (reply.senderId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You can only delete your own replies.');
  }

  const { count, removedIds } = await deleteMessageReplyCascade(reply._id);
  res.json({ success: true, message: `Deleted ${count} repl(y/ies).`, removedIds });
});
