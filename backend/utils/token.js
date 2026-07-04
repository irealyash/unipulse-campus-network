/**
 * token.js — JWT generation and verification utilities.
 *
 * Used by the auth middleware to protect routes and by the login/register
 * controllers to issue tokens after successful authentication.
 */
import jwt from 'jsonwebtoken';

/**
 * Signs a JWT containing the user's id. This token is what the frontend stores
 * (e.g. in localStorage) and sends back in the Authorization header on every
 * protected request.
 * @param {string} userId - The MongoDB _id of the authenticated user.
 * @returns {string} A signed JWT string valid for the configured expiry duration.
 */
export const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

/**
 * Verifies and decodes a JWT. Throws if the token is invalid or expired,
 * which the auth middleware catches and turns into a 401.
 * @param {string} token - The JWT string from the Authorization header.
 * @returns {Object} Decoded payload containing { id, iat, exp }.
 * @throws {JsonWebTokenError|TokenExpiredError} On invalid or expired tokens.
 */
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
