import mongoose from 'mongoose';

/**
 * One-Time-Password documents back the entire (password-less) auth flow.
 *
 * Flow:
 *  - Signup request          -> we create (or overwrite) a "signup" Otp holding
 *                               the desired username + hashed password until the
 *                               email is verified.
 *  - Forgot-password request -> we create a "reset" Otp for an existing user.
 *  - We email the 6 digit code to the student; verifying it completes the action.
 *
 * (Login itself is password-based and does NOT use this model.)
 *
 * Security notes:
 *  - We never store the raw code, only a SHA-256 hash (see utils/otp.js).
 *  - Documents auto-expire via a TTL index on `expiresAt`, so stale codes
 *    clean themselves up without a cron job.
 */
const otpSchema = new mongoose.Schema({
  // The student email the code was sent to. Lowercased for consistent lookups.
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  // SHA-256 hash of the 6 digit code. The raw code only ever lives in the email.
  codeHash: {
    type: String,
    required: true
  },
  // "signup" provisions a new account; "reset" lets an existing user set a new
  // password after proving inbox ownership.
  purpose: {
    type: String,
    enum: ['signup', 'reset'],
    required: true
  },
  // For signups we hold the desired username here until the email is verified,
  // so we only ever create a real User after ownership of the inbox is proven.
  pendingUsername: {
    type: String,
    default: null
  },
  // For signups we also stash the already-bcrypt-hashed password here, so the
  // raw password is never persisted and the account is created fully formed
  // the moment the email is verified.
  pendingPasswordHash: {
    type: String,
    default: null
  },
  // Brute-force guard: we reject the code once too many wrong tries pile up.
  attempts: {
    type: Number,
    default: 0
  },
  // Absolute expiry timestamp. The TTL index below deletes the doc at this time.
  expiresAt: {
    type: Date,
    required: true
  }
}, { timestamps: true }); // timestamps adds automatic createdAt/updatedAt fields

// TTL index: MongoDB removes the document once `expiresAt` passes (expireAfterSeconds: 0).
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Export the Otp model bound to the "otps" collection.
export default mongoose.model('Otp', otpSchema);
