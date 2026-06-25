import jwt from 'jsonwebtoken';

/**
 * Signs a JWT containing the user's id. This token is what the frontend stores
 * (e.g. in localStorage) and sends back in the Authorization header on every
 * protected request.
 */
export const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

/**
 * Verifies and decodes a JWT. Throws if the token is invalid or expired,
 * which the auth middleware catches and turns into a 401.
 */
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
