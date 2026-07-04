import { Router } from 'express';
import { protect, requireModerator } from '../middleware/auth.js';
import {
  updateCommunity,
  createCommunity,
  deleteCommunity,
  deleteAllCommunities,
  deleteAllCourseCommunities,
  addCommunityMember,
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
  setUserBan,
  listPostsForReview,
  approvePost,
  rejectPost,
  listEventsForReview,
  approveEvent,
  rejectEvent,
  deleteAnyEvent,
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

// --- Post approval queue ---
// GET /posts — list posts pending moderator review (protect, requireModerator)
router.get('/posts', listPostsForReview);
// POST /posts/:id/approve — approve a pending post (protect, requireModerator)
router.post('/posts/:id/approve', approvePost);
// POST /posts/:id/reject — reject a pending post (protect, requireModerator)
router.post('/posts/:id/reject', rejectPost);

// --- Event approval queue ---
// GET /events — list events pending moderator review (protect, requireModerator)
router.get('/events', listEventsForReview);
// POST /events/:id/approve — approve a pending event (protect, requireModerator)
router.post('/events/:id/approve', approveEvent);
// POST /events/:id/reject — reject a pending event (protect, requireModerator)
router.post('/events/:id/reject', rejectEvent);

// --- Communities & browsing (no access gate for moderators) ---
// GET /communities — search/list all communities (protect, requireModerator)
router.get('/communities', listAllCommunities);
// POST /communities — create a new community (protect, requireModerator)
router.post('/communities', createCommunity);
// PATCH /communities/:communityId — update community settings (protect, requireModerator)
router.patch('/communities/:communityId', updateCommunity);
// POST /communities/:communityId/members — add a member to a community (protect, requireModerator)
router.post('/communities/:communityId/members', addCommunityMember);
// DELETE /communities/all — delete all communities (protect, requireModerator)
router.delete('/communities/all', deleteAllCommunities);
// DELETE /communities/course — delete all course-type communities (protect, requireModerator)
router.delete('/communities/course', deleteAllCourseCommunities);
// DELETE /communities/:communityId — delete a specific community (protect, requireModerator)
router.delete('/communities/:communityId', deleteCommunity);
// GET /communities/:communityId/posts — browse all posts in a community (protect, requireModerator)
router.get('/communities/:communityId/posts', browseCommunityPosts);
// GET /communities/:communityId/messages — browse all chat messages in a community (protect, requireModerator)
router.get('/communities/:communityId/messages', browseCommunityMessages);
// GET /posts/:postId/comments — browse all comments on a post (protect, requireModerator)
router.get('/posts/:postId/comments', browsePostComments);

// --- User lookup & banning ---
// GET /users/:identifier — look up a user by ID, email, or username and their content (protect, requireModerator)
router.get('/users/:identifier', lookupUser);
// PATCH /users/:id/ban — ban or unban a user via { banned } body (protect, requireModerator)
router.patch('/users/:id/ban', setUserBan);

// --- Direct deletion of any content ---
// DELETE /posts/:id — delete any post regardless of ownership (protect, requireModerator)
router.delete('/posts/:id', deleteAnyPost);
// DELETE /comments/:id — delete any comment or reply regardless of ownership (protect, requireModerator)
router.delete('/comments/:id', deleteAnyComment);
// DELETE /messages/:id — delete any chat message regardless of ownership (protect, requireModerator)
router.delete('/messages/:id', deleteAnyMessage);
// DELETE /events/:id — delete any event regardless of ownership (protect, requireModerator)
router.delete('/events/:id', deleteAnyEvent);

// --- Reports queue ---
// GET /reports — list reports, filterable by ?status=pending (protect, requireModerator)
router.get('/reports', listReports);
// POST /reports/:id/resolve — resolve a report with { action } (delete or dismiss) (protect, requireModerator)
router.post('/reports/:id/resolve', resolveReport);

// --- User requests queue ---
// GET /requests — list user-submitted moderator requests, filterable by ?status=pending (protect, requireModerator)
router.get('/requests', listRequests);
// POST /requests/:id/resolve — resolve a request with { action } (reviewed or dismissed) (protect, requireModerator)
router.post('/requests/:id/resolve', resolveRequest);

export default router;
