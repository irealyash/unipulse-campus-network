import mongoose from 'mongoose';

/**
 * MODERATOR REQUEST
 * ----------------------------------------------------------------------------
 * A free-text message from a user to the moderators — e.g. "please create a
 * community for CPSC 320 L2B" or "can we add an exams tag here". These show up
 * in the moderator tab so mods can act on community update/change requests.
 *
 * This is intentionally simple: just a string message plus who sent it (so a
 * moderator can follow up or look the user up) and a status to track triage.
 */
const moderatorRequestSchema = new mongoose.Schema({
  // Who sent the request.
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderUsername: {
    type: String,
    required: true // frozen alias snapshot at submission time
  },

  // Optional community the request is about (if the user was inside one).
  communityId: {
    type: String,
    default: null
  },

  // The actual message — this is the core of the schema.
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },

  // Triage lifecycle for moderators.
  //   pending   -> not yet looked at
  //   reviewed  -> a moderator acted on / acknowledged it
  //   dismissed -> closed without action
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'dismissed'],
    default: 'pending'
  },

  // Audit: which moderator handled it and when.
  handledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  handledAt: {
    type: Date,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Moderator queue: newest pending first.
moderatorRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('ModeratorRequest', moderatorRequestSchema);
