import mongoose from 'mongoose';

/**
 * MOD CONVERSATION MODEL
 * ----------------------------------------------------------------------------
 * One direct-message thread between a student and the moderator who contacted
 * them. Each user may only have one active moderator conversation (enforced by
 * the `unique: true` constraint on userId).
 *
 * This is the "header" for the conversation — individual messages live in the
 * ModMessage collection and reference back here via conversationId.
 *
 * Designed to power the moderator inbox: mods see a list of conversations
 * sorted by most-recently-active, with a preview snippet.
 */
const modConversationSchema = new mongoose.Schema({
  // The student involved in this conversation (references User collection).
  // `unique: true` ensures only one active conversation per user.
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  // The moderator who initiated (or owns) this conversation (references User).
  moderatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Frozen username of the student at conversation creation (for display).
  userUsername: {
    type: String,
    required: true,
    trim: true,
  },
  // Frozen username of the moderator at conversation creation (for display).
  moderatorUsername: {
    type: String,
    required: true,
    trim: true,
  },
  // Timestamp of the most recent message — used for sorting the inbox.
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  // Truncated preview of the last message text (shown in the inbox list).
  lastPreview: {
    type: String,
    default: '',
    maxlength: 200,
    trim: true,
  },
  // When the conversation was first created.
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Tracks the last time anything in this conversation was modified.
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook: automatically bump `updatedAt` on every save so we always
// know when the document was last touched without manual updates.
modConversationSchema.pre('save', function setUpdatedAt(next) {
  this.updatedAt = new Date();
  next();
});

// Index for the moderator inbox: list all conversations for a mod, sorted by latest activity.
modConversationSchema.index({ moderatorId: 1, lastMessageAt: -1 });

// Export the ModConversation model bound to the "modconversations" collection.
export default mongoose.model('ModConversation', modConversationSchema);
