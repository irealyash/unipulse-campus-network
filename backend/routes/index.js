import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import communityRoutes from './communityRoutes.js';
import postRoutes from './postRoutes.js';
import commentRoutes from './commentRoutes.js';
import eventRoutes from './eventRoutes.js';
import messageRoutes from './messageRoutes.js';
import messageReplyRoutes from './messageReplyRoutes.js';
import reportRoutes from './reportRoutes.js';
import requestRoutes from './requestRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import moderatorRoutes from './moderatorRoutes.js';
import modMessageRoutes from './modMessageRoutes.js';

/**
 * Top-level API router. server.js mounts this at "/api", so every path below
 * is reachable as /api/<group>/...
 */
const router = Router();

// Simple health check for uptime monitors / quick sanity testing.
router.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', time: new Date().toISOString() });
});

// /api/auth — signup, login, verification, password reset (public)
router.use('/auth', authRoutes);
// /api/users — profile, schedule upload, community membership (protected)
router.use('/users', userRoutes);
// /api/communities — community CRUD + nested posts, events, and chat history
router.use('/communities', communityRoutes);
// /api/posts — single-post lookup, reactions, and nested comments
router.use('/posts', postRoutes);
// /api/comments — single-comment reactions and deletion
router.use('/comments', commentRoutes);
// /api/events — event CRUD and approval workflows
router.use('/events', eventRoutes);
// /api/messages — chat-message reactions and reply threads
router.use('/messages', messageRoutes);
// /api/message-replies — standalone reply operations
router.use('/message-replies', messageReplyRoutes);
// /api/reports — user-submitted content reports
router.use('/reports', reportRoutes);
// /api/requests — community join / role-change requests
router.use('/requests', requestRoutes);
// /api/moderator — moderator-only admin actions
router.use('/moderator', moderatorRoutes);
// /api/mod-messages — moderator-to-user messaging system
router.use('/mod-messages', modMessageRoutes);
// /api/uploads — file/image upload endpoints
router.use('/uploads', uploadRoutes);

export default router;
