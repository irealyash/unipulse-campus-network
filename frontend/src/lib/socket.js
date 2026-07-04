/**
 * SOCKET.IO CLIENT
 * ----------------------------------------------------------------------------
 * Manages a Socket.io client singleton for real-time chat communication.
 * The connection is established lazily (on first call to getSocket) and reused
 * across all community chat rooms. The JWT is sent during the handshake so the
 * backend's socketAuth middleware can authenticate the user.
 *
 * Exports:
 *   - getSocket()       — returns (and lazily creates) the socket instance
 *   - disconnectSocket() — tears down the connection (e.g. on logout)
 */

import { io } from 'socket.io-client';
import { getToken } from './api';

/** The singleton socket instance; null until first connection. */
let socket = null;

/**
 * Get (or create) the Socket.io client connection.
 * On first call, connects to the server root ('/') with the JWT in auth.
 * Prefers WebSocket transport but falls back to polling.
 * @returns {import('socket.io-client').Socket} The active socket instance.
 */
export const getSocket = () => {
  if (socket) return socket;

  socket = io('/', {
    auth: { token: getToken() },
    autoConnect: true,
    transports: ['websocket', 'polling'],
  });

  return socket;
};

/**
 * Disconnect and destroy the socket instance.
 * Called on logout so a future login creates a fresh connection with a new JWT.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
