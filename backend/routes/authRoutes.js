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

// POST /api/auth/signup — register a new user and email a verification code
router.post('/signup', signup);
// POST /api/auth/verify — confirm email with code, create account, return JWT
router.post('/verify', verify);
// POST /api/auth/login — authenticate by email or username, return JWT
router.post('/login', login);
// POST /api/auth/forgot-password — send a password-reset code to the user's email
router.post('/forgot-password', forgotPassword);
// POST /api/auth/reset-password — validate reset code and set a new password
router.post('/reset-password', resetPassword);
// POST /api/auth/resend — resend the most recent pending verification/reset code
router.post('/resend', resend);

export default router;
