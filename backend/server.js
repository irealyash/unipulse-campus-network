import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server as SocketServer } from 'socket.io';

import connectDB from './config/db.js';
import { ensureDefaultCommunities } from './utils/ensureCommunities.js';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { initChat } from './socket/chatSocket.js';

/**
 * SERVER ENTRY POINT
 * ----------------------------------------------------------------------------
 * Boots the whole UniPulse backend:
 *   1. Connect to MongoDB
 *   2. Build the Express app (REST API)
 *   3. Wrap it in an HTTP server so Socket.io can share the same port
 *   4. Attach Socket.io for live chat
 *   5. Start listening
 */

// --- 1. Database -----------------------------------------------------------
await connectDB();
await ensureDefaultCommunities();
console.log('[server] default communities ready');

// --- 2. Express app --------------------------------------------------------
const app = express();

// Allow the frontend (Vite dev server / deployed origin) to call the API.
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({ origin: clientUrl, credentials: true }));

// Parse JSON bodies (multipart is handled separately by multer on its route).
app.use(express.json());

// Mount the entire REST API under /api.
app.use('/api', apiRoutes);

// Friendly root response so hitting the bare URL isn't a 404.
app.get('/', (req, res) => res.send('UniPulse API is running. See /api/health.'));

// 404 + centralized error handling must come AFTER all routes.
app.use(notFound);
app.use(errorHandler);

// --- 3 & 4. HTTP server + Socket.io ---------------------------------------
const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: { origin: clientUrl, credentials: true }
});
initChat(io); // wire up all live-chat event handlers

// --- 5. Listen -------------------------------------------------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[server] UniPulse running on http://localhost:${PORT}`);
});

// Safety net: log unexpected promise rejections instead of crashing silently.
process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled rejection:', reason);
});
