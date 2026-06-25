import crypto from 'crypto';

/**
 * OTP helpers. We deliberately avoid storing the raw code in the database:
 * only a salted SHA-256 hash is persisted, while the plaintext code is sent
 * to the user's inbox. This means a leaked DB still can't reveal live codes.
 */

// Generates a random 6 digit numeric code as a zero-padded string (e.g. "004271").
export const generateOtpCode = () => {
  const code = crypto.randomInt(0, 1_000_000); // 0 .. 999999
  return code.toString().padStart(6, '0');
};

// Hashes a code with the server's OTP_SECRET so identical codes for different
// deployments produce different hashes (acts like a pepper).
export const hashOtpCode = (code) => {
  return crypto
    .createHmac('sha256', process.env.OTP_SECRET || 'fallback_otp_secret')
    .update(code)
    .digest('hex');
};

// Constant-time comparison to verify a submitted code against the stored hash.
export const verifyOtpCode = (code, storedHash) => {
  const candidate = hashOtpCode(code);
  // timingSafeEqual requires equal-length buffers; hex of sha256 is always 64 chars.
  const a = Buffer.from(candidate);
  const b = Buffer.from(storedHash);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

// Returns a Date this many minutes in the future, used for the OTP TTL.
export const otpExpiry = () => {
  const minutes = parseInt(process.env.OTP_TTL_MINUTES || '10', 10);
  return new Date(Date.now() + minutes * 60 * 1000);
};
