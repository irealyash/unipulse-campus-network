import bcrypt from 'bcryptjs';

/**
 * Password hashing helpers built on bcryptjs.
 *
 * We never store raw passwords — only a salted bcrypt hash. bcrypt bakes the
 * salt into the hash string itself, so we don't manage salts separately.
 */

// Cost factor: higher = slower = harder to brute force. 10 is a sane default.
const SALT_ROUNDS = 10;

// Hashes a plaintext password for storage.
export const hashPassword = async (plain) => {
  return bcrypt.hash(plain, SALT_ROUNDS);
};

// Compares a login attempt against the stored hash. Returns true/false.
export const comparePassword = async (plain, hash) => {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
};
