import Message from '../models/Message.js';
import asyncHandler from '../utils/asyncHandler.js';
import { assertCommunityAccess } from '../utils/membership.js';

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
    // Return chronological (oldest -> newest) so the client can append directly.
    messages: messages.reverse()
  });
});
