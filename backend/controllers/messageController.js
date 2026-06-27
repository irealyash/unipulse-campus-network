import Message from '../models/Message.js';
import MessageReply from '../models/MessageReply.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { assertCommunityAccess } from '../utils/membership.js';
import { applyLikeDislike } from '../utils/likeDislike.js';
import { toggleSingleEmojiReaction } from '../utils/emojiReaction.js';
import { serializeVotable } from '../utils/serializeVotes.js';

/**
 * MESSAGE CONTROLLER
 * ----------------------------------------------------------------------------
 * The "group chat" tab is realtime (Socket.io, see socket/chatSocket.js), but
 * we still expose a REST endpoint to load message history when the user first
 * opens a chat or scrolls up for older messages.
 */

/**
 * GET /api/communities/:communityId/messages?before=<ISODate>&limit=30
 * Returns a page of messages, newest-first, optionally older than `before`
 * (for infinite scroll). The frontend typically reverses these for display.
 */
export const getMessages = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  await assertCommunityAccess(req.user, communityId); // gate chat history reads

  const limit = Math.min(Math.max(parseInt(req.query.limit || '30', 10), 1), 100);

  // Cursor-based pagination: fetch messages created before the given timestamp.
  const filter = { communityId };
  if (req.query.before) {
    const before = new Date(req.query.before);
    if (!isNaN(before.getTime())) {
      filter.createdAt = { $lt: before };
    }
  }

  const messages = await Message.find(filter)
    .sort({ createdAt: -1 }) // newest first, matching the model's index
    .limit(limit);

  res.json({
    success: true,
    count: messages.length,
    messages: messages.reverse()
  });
});

/**
 * GET /api/communities/:communityId/timeline?limit=100
 * Merged chronological feed of messages + replies for the chat UI.
 */
export const getChatTimeline = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  await assertCommunityAccess(req.user, communityId);

  const limit = Math.min(Math.max(parseInt(req.query.limit || '100', 10), 1), 200);

  const [messages, replies] = await Promise.all([
    Message.find({ communityId }).sort({ createdAt: 1 }).limit(limit).lean({ virtuals: true }),
    MessageReply.find({ communityId }).sort({ createdAt: 1 }).limit(limit * 2).lean({ virtuals: true }),
  ]);

  const byId = new Map();
  messages.forEach((m) => byId.set(m._id.toString(), m));
  replies.forEach((r) => byId.set(r._id.toString(), r));

  const parentMeta = (parentId) => {
    const p = byId.get(parentId?.toString());
    if (!p) return { parentAuthor: null, parentPreview: '' };
    return {
      parentAuthor: p.anonymousUsername,
      parentPreview: p.content?.slice(0, 120) || (p.media?.url ? '[media]' : ''),
    };
  };

  const items = [
    ...messages.map((m) => ({
      ...serializeVotable(m, req.user._id),
      itemType: 'message',
    })),
    ...replies.map((r) => ({
      ...serializeVotable(r, req.user._id),
      itemType: 'reply',
      ...parentMeta(r.parentMessageId),
    })),
  ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  res.json({ success: true, count: items.length, items });
});

/**
 * POST /api/messages/:id/react
 * Body: { action: "like" | "dislike" | "none" }
 * Like/dislike a chat message (toggles, "none" clears it).
 */
export const reactToMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) throw new ApiError(404, 'Message not found.');

  await assertCommunityAccess(req.user, message.communityId);

  applyLikeDislike(message, req.user._id, req.body.action);
  await message.save();

  res.json({ success: true, score: message.score, message });
});

/**
 * POST /api/messages/:id/emoji
 * Body: { emoji: "🔥" }
 * Toggles an emoji reaction on a chat message for the current user.
 */
export const reactWithEmoji = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) throw new ApiError(404, 'Message not found.');

  await assertCommunityAccess(req.user, message.communityId);

  const state = toggleSingleEmojiReaction(message, req.user._id, req.body.emoji);
  await message.save();

  res.json({ success: true, state, reactions: message.reactions, message });
});
