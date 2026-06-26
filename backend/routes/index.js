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

/**
 * Top-level API router. server.js mounts this at "/api", so every path below
 * is reachable as /api/<group>/...
 */
const router = Router();

// Simple health check for uptime monitors / quick sanity testing.
router.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', time: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/communities', communityRoutes);
router.use('/posts', postRoutes);
router.use('/comments', commentRoutes);
router.use('/events', eventRoutes);
router.use('/messages', messageRoutes);
router.use('/message-replies', messageReplyRoutes);
router.use('/reports', reportRoutes);
router.use('/requests', requestRoutes);
router.use('/moderator', moderatorRoutes);
router.use('/uploads', uploadRoutes);

export default router;
