import User from '../models/User.js';
import Community from '../models/Community.js';
import Message from '../models/Message.js';
import { verifyToken } from '../utils/token.js';
import { canAccessCommunity } from '../utils/membership.js';

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
          createdAt: message.createdAt
        });
      } catch (err) {
        socket.emit(EVT.ERROR, { message: 'Failed to send message.' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[socket] disconnected: ${socket.user.username} (${socket.id})`);
    });
  });
};
