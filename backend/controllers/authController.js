import User from '../models/User.js';
import Otp from '../models/Otp.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { signToken } from '../utils/token.js';
import {
  generateOtpCode,
  hashOtpCode,
  verifyOtpCode,
  otpExpiry
} from '../utils/otp.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { sendOtpEmail } from '../utils/sendEmail.js';
import {
  isValidUbcEmail,
  isValidUsername,
  isValidPassword
} from '../utils/validators.js';
import { isModeratorEmail } from '../utils/moderators.js';

/**
 * AUTH CONTROLLER
 * ----------------------------------------------------------------------------
 * Identity rules for UniPulse:
 *   1. You must own a UBC student inbox (@student.ubc.ca) — proven via an
 *      emailed OTP at signup. Configured moderator emails may bypass the domain rule.
 *   2. You set a PASSWORD at signup. After that, logging back in is just
 *      identifier (email OR username) + password. No OTP needed to log in.
 *   3. Forgot/reset password re-uses the emailed-OTP mechanism.
 *
 * The User row is only created AFTER the signup email is verified, so we stash
 * the desired username and the (already hashed) password on the Otp doc in the
 * meantime.
 */

// Max wrong guesses before a code is burned and the user must request a new one.
const MAX_OTP_ATTEMPTS = 5;

/**
 * POST /api/auth/signup
 * Body: { email, username, password }
 * Validates everything, hashes the password, and emails a verification code.
 * No account exists yet — it is created on /verify.
 */
export const signup = asyncHandler(async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const username = (req.body.username || '').trim();
  const password = req.body.password || '';

  // 1) Must be a UBC student address — unless it's a configured moderator email.
  if (!isValidUbcEmail(email) && !isModeratorEmail(email)) {
    throw new ApiError(
      400,
      `Email must end in ${process.env.ALLOWED_EMAIL_DOMAIN || '@student.ubc.ca'}`
    );
  }

  // 2) Username + password format rules.
  if (!isValidUsername(username)) {
    throw new ApiError(400, 'Username must be 3-10 characters: letters, numbers or underscores.');
  }
  if (!isValidPassword(password)) {
    throw new ApiError(400, 'Password must be at least 8 characters.');
  }

  // 3) Reject if either the email or username already belongs to a real user.
  const existingByEmail = await User.findOne({ email });
  if (existingByEmail) {
    throw new ApiError(409, 'An account with this email already exists. Please log in instead.');
  }
  const existingByUsername = await User.findOne({ username });
  if (existingByUsername) {
    throw new ApiError(409, 'That username is already taken.');
  }

  // 4) Hash the password now so the raw value is never stored anywhere.
  const passwordHash = await hashPassword(password);

  // 5) Generate + persist a hashed OTP (overwriting any previous pending one),
  //    carrying the pending username + password hash until verification.
  const code = generateOtpCode();
  await Otp.findOneAndUpdate(
    { email },
    {
      email,
      codeHash: hashOtpCode(code),
      purpose: 'signup',
      pendingUsername: username,
      pendingPasswordHash: passwordHash,
      attempts: 0,
      expiresAt: otpExpiry()
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // 6) Email the plaintext code.
  await sendOtpEmail(email, code);

  res.status(200).json({
    success: true,
    message: 'Verification code sent. Check your UBC inbox to finish signing up.'
  });
});

/**
 * POST /api/auth/verify
 * Body: { email, code }
 * Completes signup: validates the code, then creates the account using the
 * username + password hash stashed on the OTP, and returns a JWT.
 */
export const verify = asyncHandler(async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const code = (req.body.code || '').trim();

  if (!email || !code) {
    throw new ApiError(400, 'Email and code are required.');
  }

  const otp = await Otp.findOne({ email, purpose: 'signup' });
  if (!otp) {
    throw new ApiError(400, 'Code expired or not found. Please sign up again.');
  }

  // Burn the code after too many wrong guesses.
  if (otp.attempts >= MAX_OTP_ATTEMPTS) {
    await otp.deleteOne();
    throw new ApiError(429, 'Too many incorrect attempts. Please sign up again.');
  }

  if (!verifyOtpCode(code, otp.codeHash)) {
    otp.attempts += 1;
    await otp.save();
    throw new ApiError(400, 'Incorrect code. Please try again.');
  }

  // Final uniqueness re-check in case the name/email was claimed during the window.
  const clash = await User.findOne({ $or: [{ email }, { username: otp.pendingUsername }] });
  if (clash) {
    await otp.deleteOne();
    throw new ApiError(409, 'Email or username was taken during verification. Please sign up again.');
  }

  const user = await User.create({
    email,
    username: otp.pendingUsername,
    password: otp.pendingPasswordHash, // already a bcrypt hash
    // Auto-promote configured moderator emails the moment they're created.
    moderator: isModeratorEmail(email)
  });

  // One-time codes are single-use.
  await otp.deleteOne();

  const token = signToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Account created.',
    token,
    user: serializeUser(user)
  });
});

/**
 * POST /api/auth/login
 * Body: { identifier, password }
 * `identifier` may be the UBC email OR the username. Verifies the password and
 * returns a JWT. Generic error messages avoid leaking which field was wrong.
 */
export const login = asyncHandler(async (req, res) => {
  const identifier = (req.body.identifier || '').trim();
  const password = req.body.password || '';

  if (!identifier || !password) {
    throw new ApiError(400, 'Identifier (email or username) and password are required.');
  }

  // Look up by email (lowercased) or username, explicitly pulling in the hash.
  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { username: identifier }]
  }).select('+password');

  // Same message whether the account is missing or the password is wrong.
  if (!user || !(await comparePassword(password, user.password))) {
    throw new ApiError(401, 'Invalid credentials.');
  }

  if (user.isBanned) {
    throw new ApiError(403, 'Your account is banned.');
  }

  // Keep configured moderator emails promoted even if added after signup.
  if (isModeratorEmail(user.email) && !user.moderator) {
    user.moderator = true;
    await user.save();
  }

  const token = signToken(user._id);

  res.json({
    success: true,
    message: 'Logged in.',
    token,
    user: serializeUser(user)
  });
});

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 * Emails a reset code if an account exists. We always return success to avoid
 * revealing whether an email is registered (anti-enumeration).
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();

  const user = await User.findOne({ email });

  // Only actually send a code if the user exists; otherwise silently no-op.
  if (user) {
    const code = generateOtpCode();
    await Otp.findOneAndUpdate(
      { email },
      {
        email,
        codeHash: hashOtpCode(code),
        purpose: 'reset',
        pendingUsername: null,
        pendingPasswordHash: null,
        attempts: 0,
        expiresAt: otpExpiry()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await sendOtpEmail(email, code);
  }

  res.json({
    success: true,
    message: 'If an account exists for that email, a reset code has been sent.'
  });
});

/**
 * POST /api/auth/reset-password
 * Body: { email, code, newPassword }
 * Verifies the reset code and updates the user's password.
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const code = (req.body.code || '').trim();
  const newPassword = req.body.newPassword || '';

  if (!email || !code) {
    throw new ApiError(400, 'Email and code are required.');
  }
  if (!isValidPassword(newPassword)) {
    throw new ApiError(400, 'New password must be at least 8 characters.');
  }

  const otp = await Otp.findOne({ email, purpose: 'reset' });
  if (!otp) {
    throw new ApiError(400, 'Reset code expired or not found. Please request a new one.');
  }

  if (otp.attempts >= MAX_OTP_ATTEMPTS) {
    await otp.deleteOne();
    throw new ApiError(429, 'Too many incorrect attempts. Please request a new reset code.');
  }

  if (!verifyOtpCode(code, otp.codeHash)) {
    otp.attempts += 1;
    await otp.save();
    throw new ApiError(400, 'Incorrect code. Please try again.');
  }

  const user = await User.findOne({ email });
  if (!user) {
    await otp.deleteOne();
    throw new ApiError(404, 'Account no longer exists.');
  }

  // Hash and store the new password, then consume the code.
  user.password = await hashPassword(newPassword);
  await user.save();
  await otp.deleteOne();

  res.json({ success: true, message: 'Password has been reset. You can now log in.' });
});

/**
 * POST /api/auth/resend
 * Body: { email }
 * Re-issues whatever code is currently pending for this email (signup or reset),
 * preserving any stashed signup data.
 */
export const resend = asyncHandler(async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const existing = await Otp.findOne({ email });
  if (!existing) {
    throw new ApiError(400, 'No pending verification for this email.');
  }

  const code = generateOtpCode();
  existing.codeHash = hashOtpCode(code);
  existing.attempts = 0;
  existing.expiresAt = otpExpiry();
  await existing.save();

  await sendOtpEmail(email, code);

  res.json({ success: true, message: 'A new code has been sent.' });
});

/**
 * Shapes a user document for safe API output. The password hash is excluded by
 * the schema's `select: false`, but we also never reference it here.
 */
export const serializeUser = (user) => ({
  id: user._id,
  email: user.email,
  username: user.username,
  enrolledSections: user.enrolledSections,
  joinedCommunities: user.joinedCommunities || [],
  communityOnboardingComplete: Boolean(user.communityOnboardingComplete),
  scheduleUploaded: user.scheduleUploaded,
  isBanned: user.isBanned,
  // The frontend uses this flag to decide whether to render the moderator tab.
  moderator: user.moderator,
  lastUsernameChange: user.lastUsernameChange,
  createdAt: user.createdAt
});
