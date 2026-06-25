import { Router } from 'express';
import {
  signup,
  verify,
  login,
  forgotPassword,
  resetPassword,
  resend
} from '../controllers/authController.js';

/**
 * Public auth routes — none require a token (they exist to obtain one).
 *
 *   POST /api/auth/signup           { email, username, password } -> emails code
 *   POST /api/auth/verify           { email, code }               -> creates account + JWT
 *   POST /api/auth/login            { identifier, password }      -> JWT (email OR username)
 *   POST /api/auth/forgot-password  { email }                     -> emails reset code
 *   POST /api/auth/reset-password   { email, code, newPassword }  -> sets new password
 *   POST /api/auth/resend           { email }                     -> resends pending code
 */
const router = Router();

router.post('/signup', signup);
router.post('/verify', verify);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/resend', resend);

export default router;
