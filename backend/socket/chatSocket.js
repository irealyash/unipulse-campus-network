import User from '../models/User.js';
import Community from '../models/Community.js';
import Message from '../models/Message.js';
import MessageReply from '../models/MessageReply.js';
import { verifyToken } from '../utils/token.js';
import { canAccessCommunity } from '../utils/membership.js';
import { applyLikeDislike } from '../utils/likeDislike.js';
import { toggleEmojiReaction } from '../utils/emojiReaction.js';

/**
 * LIVE CHAT (Socket.io)
 * ----------------------------------------------------------------------------
 * Each community's "group chat" tab is a Socket.io room named by the community
 * id. Chat is anonymous: every message carries the sender's current alias, not
 * their identity. Messages are persisted (so history survives reconnects) and
 * broadcast to everyone currently in the room.
 *
 * Client usage sketch:
 *   const socket = io(URL, { auth: { token } });
 *   socket.emit('chat:join', { communityId });
 *   socket.on('chat:message', (msg) => render(msg));
 *   socket.emit('chat:message', { communityId, content });
 */

// Events emitted to clients are namespaced "chat:" for clarity.
const EVT = {
  JOINED: 'chat:joined',
  LEFT: 'chat:left',
  MESSAGE: 'chat:message',
  REPLY: 'chat:reply',         // a new reply was posted in the room
  REACTION: 'chat:reaction',   // a message/reply's reactions changed
  TYPING: 'chat:typing',
  ERROR: 'chat:error'
};

/**
 * Authentication middleware for sockets. We read the JWT from the handshake
 * auth payload, verify it, and attach the user to the socket. A socket that
 * fails this never receives any events.
 */
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No auth token provided'));

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    if (!user) return next(new Error('User not found'));

    // Stash the user on the socket for use by all handlers.
    socket.user = user;
    next();
  } catch {
    next(new Error('Authentication failed'));
  }
};

/**
 * Shared handler for live reactions (both like/dislike and emoji). It loads the
 * target message/reply, enforces room access, applies the supplied mutation,
 * persists, and broadcasts the updated reaction state to the room.
 *
 * @param socket            - the acting socket
 * @param io                - the Socket.io server (for room broadcast)
 * @param targetType        - "message" | "reply"
 * @param targetId          - the document id
 * @param mutate            - function(doc) that applies the reaction change
 */
const handleReaction = async (socket, io, { targetType, targetId, mutate }) => {
  try {
    if (!targetId || !['message', 'reply'].includes(targetType)) {
      return socket.emit(EVT.ERROR, { message: 'Valid targetType and targetId are required.' });
    }

    const Model = targetType === 'message' ? Message : MessageReply;
    const doc = await Model.findById(targetId);
    if (!doc) return socket.emit(EVT.ERROR, { message: 'Target not found.' });

    const community = await Community.findById(doc.communityId);
    const freshUser = await User.findById(socket.user._id);
    if (!community || !canAccessCommunity(freshUser, community)) {
      return socket.emit(EVT.ERROR, { message: 'You are not allowed in this chat.' });
    }

    // Apply the specific reaction change (throws ApiError on bad input).
    mutate(doc);
    await doc.save();

    io.to(doc.communityId).emit(EVT.REACTION, {
      targetType,
      targetId: doc._id,
      communityId: doc.communityId,
      likes: doc.likes.length,
      dislikes: doc.dislikes.length,
      score: doc.score,
      reactions: doc.reactions
    });
  } catch (err) {
    // ApiError (e.g. invalid action/emoji) carries a friendly message.
    socket.emit(EVT.ERROR, { message: err.message || 'Failed to react.' });
  }
};

/**
 * Wires up all chat behaviour on the given Socket.io server instance.
 * Called once from server.js after the io server is created.
 */
export const initChat = (io) => {
  io.use(socketAuth);

  io.on('connection', (socket) => {
    console.log(`[socket] connected: ${socket.user.username} (${socket.id})`);

    /**
     * chat:join { communityId }
     * Verifies the user may access this community, then joins the room and
     * acknowledges. Course rooms are blocked for non-enrolled users.
     */
    socket.on('chat:join', async ({ communityId } = {}) => {
      try {
        if (!communityId) return socket.emit(EVT.ERROR, { message: 'communityId is required.' });

        const community = await Community.findById(communityId);
        if (!community) return socket.emit(EVT.ERROR, { message: 'Community not found.' });

        // Re-load the user so enrollment is fresh (they may have just uploaded a schedule).
        const freshUser = await User.findById(socket.user._id);
        if (!canAccessCommunity(freshUser, community)) {
          return socket.emit(EVT.ERROR, { message: 'You are not allowed in this chat.' });
        }

        socket.join(communityId);
        socket.emit(EVT.JOINED, { communityId });
      } catch (err) {
        socket.emit(EVT.ERROR, { message: 'Failed to join chat.' });
      }
    });

    /**
     * chat:leave { communityId } — leave a room (e.g. switching tabs).
     */
    socket.on('chat:leave', ({ communityId } = {}) => {
      if (communityId) {
        socket.leave(communityId);
        socket.emit(EVT.LEFT, { communityId });
      }
    });

    /**
     * chat:typing { communityId } — broadcast a transient "is typing" hint to
     * others in the room. Not persisted.
     */
    socket.on('chat:typing', ({ communityId } = {}) => {
      if (!communityId) return;
      socket.to(communityId).emit(EVT.TYPING, {
        communityId,
        username: socket.user.username
      });
    });

    /**
     * chat:message { communityId, content }
     * Validates access + content, persists the message with the sender's current
     * alias, then broadcasts it to everyone in the room (including the sender).
     */
    socket.on('chat:message', async ({ communityId, content } = {}) => {
      try {
        if (!communityId || !content || !content.trim()) {
          return socket.emit(EVT.ERROR, { message: 'communityId and content are required.' });
        }

        // Always re-validate access on every message (don't trust the join state alone).
        const community = await Community.findById(communityId);
        if (!community) return socket.emit(EVT.ERROR, { message: 'Community not found.' });

        const freshUser = await User.findById(socket.user._id);
        if (freshUser.isBanned) {
          return socket.emit(EVT.ERROR, { message: 'You are banned from chatting.' });
        }
        if (!canAccessCommunity(freshUser, community)) {
          return socket.emit(EVT.ERROR, { message: 'You are not allowed in this chat.' });
        }

        // Persist with a frozen alias snapshot for anonymity + history accuracy.
        const message = await Message.create({
          communityId,
          senderId: freshUser._id,
          anonymousUsername: freshUser.username,
          content: content.trim()
        });

        // Broadcast to the whole room. io.to(room) includes the sender.
        io.to(communityId).emit(EVT.MESSAGE, {
          id: message._id,
          communityId,
          anonymousUsername: message.anonymousUsername,
          content: message.content,
          likes: 0,
          dislikes: 0,
          reactions: [],
          createdAt: message.createdAt
        });
      } catch (err) {
        socket.emit(EVT.ERROR, { message: 'Failed to send message.' });
      }
    });

    /**
     * chat:reply { parentId, content }
     * Posts a live reply to a message OR another reply. parentId may point at a
     * Message or a MessageReply; we auto-detect and inherit its community.
     */
    socket.on('chat:reply', async ({ parentId, content } = {}) => {
      try {
        if (!parentId || !content || !content.trim()) {
          return socket.emit(EVT.ERROR, { message: 'parentId and content are required.' });
        }

        // Auto-detect the parent: a root message first, otherwise a reply.
        let parentType = 'message';
        let parent = await Message.findById(parentId);
        if (!parent) {
          parent = await MessageReply.findById(parentId);
          parentType = 'reply';
        }
        if (!parent) return socket.emit(EVT.ERROR, { message: 'Parent not found.' });

        const community = await Community.findById(parent.communityId);
        const freshUser = await User.findById(socket.user._id);
        if (freshUser.isBanned) {
          return socket.emit(EVT.ERROR, { message: 'You are banned from chatting.' });
        }
        if (!community || !canAccessCommunity(freshUser, community)) {
          return socket.emit(EVT.ERROR, { message: 'You are not allowed in this chat.' });
        }

        const reply = await MessageReply.create({
          communityId: parent.communityId,
          parentMessageId: parentId,
          parentType,
          senderId: freshUser._id,
          anonymousUsername: freshUser.username,
          content: content.trim()
        });

        io.to(parent.communityId).emit(EVT.REPLY, {
          id: reply._id,
          communityId: reply.communityId,
          parentMessageId: parentId,
          parentType,
          anonymousUsername: reply.anonymousUsername,
          content: reply.content,
          createdAt: reply.createdAt
        });
      } catch (err) {
        socket.emit(EVT.ERROR, { message: 'Failed to post reply.' });
      }
    });

    /**
     * chat:react { targetType, targetId, action }
     * Live like/dislike on a message or reply. targetType is "message" | "reply",
     * action is "like" | "dislike" | "none". Broadcasts the new counts.
     */
    socket.on('chat:react', async ({ targetType, targetId, action } = {}) => {
      await handleReaction(socket, io, { targetType, targetId, mutate: (doc) =>
        applyLikeDislike(doc, socket.user._id, action) });
    });

    /**
     * chat:emoji { targetType, targetId, emoji }
     * Live emoji reaction toggle on a message or reply.
     */
    socket.on('chat:emoji', async ({ targetType, targetId, emoji } = {}) => {
      await handleReaction(socket, io, { targetType, targetId, mutate: (doc) =>
        toggleEmojiReaction(doc, socket.user._id, emoji) });
    });

    socket.on('disconnect', () => {
      console.log(`[socket] disconnected: ${socket.user.username} (${socket.id})`);
    });
  });
};
