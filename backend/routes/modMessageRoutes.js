/**
 * Moderator messaging routes — private messaging between users and moderators.
 * Regular users can view their own conversation, while moderators can list
 * all conversations, look up users, and start new threads.
 *
 *   GET  /api/mod-messages/my-conversation                           -> user's own conversation
 *   GET  /api/mod-messages/conversations                             -> list all conversations (mods)
 *   GET  /api/mod-messages/lookup-user                               -> find user for messaging (mods)
 *   POST /api/mod-messages/start                                     -> start a new conversation (mods)
 *   GET  /api/mod-messages/conversations/:conversationId/messages    -> list messages in a conversation
 *   POST /api/mod-messages/conversations/:conversationId/messages    -> send a message in a conversation
 */
import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  getMyConversation,
  listConversations,
  listMessages,
  sendMessage,
  startConversation,
  lookupUserForMessage,
} from '../controllers/modMessageController.js';

const router = Router();

// All mod-message routes require authentication
router.use(protect);

// GET /my-conversation — fetch the authenticated user's own mod conversation (protect)
router.get('/my-conversation', getMyConversation);
// GET /conversations — list all mod conversations; intended for moderators (protect)
router.get('/conversations', listConversations);
// GET /lookup-user — search for a user to message; intended for moderators (protect)
router.get('/lookup-user', lookupUserForMessage);
// POST /start — start a new mod conversation with a user; intended for moderators (protect)
router.post('/start', startConversation);
// GET /conversations/:conversationId/messages — list messages in a specific conversation (protect)
router.get('/conversations/:conversationId/messages', listMessages);
// POST /conversations/:conversationId/messages — send a message in a conversation (protect)
router.post('/conversations/:conversationId/messages', sendMessage);

export default router;
