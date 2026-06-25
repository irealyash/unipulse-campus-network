import { io } from 'socket.io-client';
import { getToken } from './api';

/**
 * Socket.io client singleton. We connect lazily (only once a logged-in user
 * opens a chat) and reuse the same connection across communities. The JWT is
 * sent in the handshake auth payload, matching the backend's socketAuth.
 */
let socket = null;

export const getSocket = () => {
  if (socket) return socket;

  socket = io('/', {
    auth: { token: getToken() },
    autoConnect: true,
    transports: ['websocket', 'polling'],
  });

  return socket;
};

// Tear down the connection (e.g. on logout) so a future login re-auths cleanly.
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
