import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { uploadSchedule } from '../middleware/upload.js';
import { getMe, uploadScheduleFile, changeUsername, joinCommunity, leaveCommunity, completeCommunityOnboarding } from '../controllers/userController.js';

/**
 * Authenticated user/profile routes (all require a valid JWT).
 *   GET   /api/users/me            -> current profile
 *   POST  /api/users/me/schedule   -> upload schedule file (unlocks course rooms)
 *   PATCH /api/users/me/username   -> change alias (once per week)
 */
const router = Router();

// Every route below is protected.
router.use(protect);

router.get('/me', getMe);
router.post('/me/joined-communities', joinCommunity);
router.delete('/me/joined-communities/:communityId', leaveCommunity);
router.post('/me/community-onboarding', completeCommunityOnboarding);
// `uploadSchedule` (multer) runs first to populate req.file from the form data.
router.post('/me/schedule', uploadSchedule, uploadScheduleFile);
router.patch('/me/username', changeUsername);

export default router;
