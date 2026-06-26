import { Router } from 'express';
import { protect, requireModerator } from '../middleware/auth.js';
import {
  updateCommunity,
  listAllCommunities,
  browseCommunityPosts,
  browseCommunityMessages,
  browsePostComments,
  lookupUser,
  deleteAnyPost,
  deleteAnyComment,
  deleteAnyMessage,
  listReports,
  resolveReport,
  listRequests,
  resolveRequest,
  setUserBan
} from '../controllers/moderatorController.js';

/**
 * Moderator tab routes — every route requires BOTH a valid JWT (protect) and
 * moderator === true (requireModerator). These bypass community access checks
 * and expose all underlying ids.
 *
 *   GET    /api/moderator/communities                          search all rooms
 *   GET    /api/moderator/communities/:communityId/posts       any room's posts
 *   GET    /api/moderator/communities/:communityId/messages    any room's chat
 *   GET    /api/moderator/posts/:postId/comments               any post's thread
 *
 *   GET    /api/moderator/users/:identifier                    user + their content
 *   PATCH  /api/moderator/users/:id/ban     { banned }         ban / unban
 *
 *   DELETE /api/moderator/posts/:id                            delete any post
 *   DELETE /api/moderator/comments/:id                         delete any comment/reply
 *   DELETE /api/moderator/messages/:id                         delete any chat message
 *
 *   GET    /api/moderator/reports?status=pending               review queue
 *   POST   /api/moderator/reports/:id/resolve { action }       delete / dismiss
 *
 *   GET    /api/moderator/requests?status=pending              user requests queue
 *   POST   /api/moderator/requests/:id/resolve { action }      reviewed / dismissed
 */
const router = Router();

// Lock down the entire moderator namespace.
router.use(protect, requireModerator);

// --- Communities & browsing (no access gate for moderators) ---
router.get('/communities', listAllCommunities);
router.patch('/communities/:communityId', updateCommunity);
router.get('/communities/:communityId/posts', browseCommunityPosts);
router.get('/communities/:communityId/messages', browseCommunityMessages);
router.get('/posts/:postId/comments', browsePostComments);

// --- User lookup & banning ---
router.get('/users/:identifier', lookupUser);
router.patch('/users/:id/ban', setUserBan);

// --- Direct deletion of any content ---
router.delete('/posts/:id', deleteAnyPost);
router.delete('/comments/:id', deleteAnyComment);
router.delete('/messages/:id', deleteAnyMessage);

// --- Reports queue ---
router.get('/reports', listReports);
router.post('/reports/:id/resolve', resolveReport);

// --- User requests queue ---
router.get('/requests', listRequests);
router.post('/requests/:id/resolve', resolveRequest);

export default router;
