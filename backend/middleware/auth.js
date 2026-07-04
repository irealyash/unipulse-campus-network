/**
 * @file auth.js — Authentication & authorization middleware.
 *
 * Provides three guards that are composed on route definitions:
 *   1. protect          – verifies the JWT and attaches `req.user`
 *   2. requireNotBanned – blocks banned users from write operations
 *   3. requireModerator – restricts access to moderator-only routes
 *
 * Typical usage in a route file:
 *   router.post('/posts', protect, requireNotBanned, createPost);
 *   router.delete('/posts/:id', protect, requireModerator, deletePost);
 */

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

  // Attach the full Mongoose user document so downstream handlers can
  // access fields like enrolledSections, username, isBanned, etc.
  req.user = user;
  next();
});

/**
 * `requireNotBanned` blocks write actions (posting, commenting, chatting) for
 * banned users while still letting them read. Use it after `protect` on routes
 * that create content.
 *
 * @param {Object} req  – must already have `req.user` set by `protect`
 * @param {Object} res  – not modified; error is thrown before reaching res
 * @param {Function} next – called only if the user is not banned
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
 *
 * @param {Object} req  – must already have `req.user` set by `protect`
 * @param {Object} res  – not modified; error is thrown before reaching res
 * @param {Function} next – called only if req.user.moderator is truthy
 */
export const requireModerator = (req, res, next) => {
  if (!req.user?.moderator) {
    throw new ApiError(403, 'Moderator access required.');
  }
  next();
};
