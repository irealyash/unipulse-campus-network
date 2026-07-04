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

router.use(protect);

router.get('/my-conversation', getMyConversation);
router.get('/conversations', listConversations);
router.get('/lookup-user', lookupUserForMessage);
router.post('/start', startConversation);
router.get('/conversations/:conversationId/messages', listMessages);
router.post('/conversations/:conversationId/messages', sendMessage);

export default router;
