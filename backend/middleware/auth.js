import User from '../models/User.js';
import { verifyToken } from '../utils/token.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * `protect` is the gatekeeper for every authenticated route.
 *
 * It expects a header of the form:  Authorization: Bearer <jwt>
 * On success it attaches the full user document to `req.user` so downstream
 * controllers can read enrolledSections, username, etc. without re-querying.
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Pull the token out of the Authorization header.
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized: no token provided');
  }

  // Verify signature + expiry. Any failure becomes a clean 401.
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    throw new ApiError(401, 'Not authorized: token invalid or expired');
  }

  // Load the user referenced by the token.
  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'Not authorized: user no longer exists');
  }

  req.user = user;
  next();
});

/**
 * `requireNotBanned` blocks write actions (posting, commenting, chatting) for
 * banned users while still letting them read. Use it after `protect` on routes
 * that create content.
 */
export const requireNotBanned = (req, res, next) => {
  if (req.user?.isBanned) {
    throw new ApiError(403, 'Your account is banned from posting.');
  }
  next();
};

/**
 * `requireModerator` gates the entire moderator tab. Use it after `protect` on
 * every /api/moderator route so only users with moderator === true get in.
 */
export const requireModerator = (req, res, next) => {
  if (!req.user?.moderator) {
    throw new ApiError(403, 'Moderator access required.');
  }
  next();
};
