/**
 * SOCKET.IO CLIENT
 * ----------------------------------------------------------------------------
 * Manages a Socket.io client singleton for real-time chat communication.
 * The connection is established lazily (on first call to getSocket) and reused
 * across all community chat rooms. The JWT is sent during the handshake so the
 * backend's socketAuth middleware can authenticate the user.
 *
 * Dev:  connects to same origin ('/') — Vite proxies /socket.io → backend
 * Prod: connects to VITE_API_URL (Railway backend origin)
 */

import { io } from 'socket.io-client';
import { getToken, API_ORIGIN } from './api';

/** The singleton socket instance; null until first connection. */
let socket = null;

/**
 * Get (or create) the Socket.io client connection.
 * @returns {import('socket.io-client').Socket} The active socket instance.
 */
export const getSocket = () => {
  if (socket) return socket;

  // Production: hit the Railway API host directly.
  // Development: same-origin so Vite can proxy /socket.io.
  const url = API_ORIGIN || '/';

  socket = io(url, {
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
