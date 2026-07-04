import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { uploadSchedule } from '../middleware/upload.js';
import { getMe, uploadScheduleFile, changeUsername, joinCommunity, leaveCommunity, completeCommunityOnboarding } from '../controllers/userController.js';

/**
 * Authenticated user/profile routes (all require a valid JWT via `protect`).
 *
 *   GET    /api/users/me                                  -> current user profile
 *   POST   /api/users/me/joined-communities               -> join a community
 *   DELETE /api/users/me/joined-communities/:communityId   -> leave a community
 *   POST   /api/users/me/community-onboarding             -> mark onboarding complete
 *   POST   /api/users/me/schedule                         -> upload schedule file (multer)
 *   PATCH  /api/users/me/username                         -> change display name
 */
const router = Router();

// Every route below is protected.
router.use(protect);

// GET /api/users/me — return the authenticated user's full profile
router.get('/me', getMe);
// POST /api/users/me/joined-communities — add a community to the user's membership list
router.post('/me/joined-communities', joinCommunity);
// DELETE /api/users/me/joined-communities/:communityId — remove a community membership
router.delete('/me/joined-communities/:communityId', leaveCommunity);
// POST /api/users/me/community-onboarding — mark the community onboarding flow as complete
router.post('/me/community-onboarding', completeCommunityOnboarding);
// POST /api/users/me/schedule — upload a schedule file; multer middleware (uploadSchedule) parses the multipart form
router.post('/me/schedule', uploadSchedule, uploadScheduleFile);
// PATCH /api/users/me/username — update the user's display name
router.patch('/me/username', changeUsername);

export default router;
