import mongoose from 'mongoose';

/**
 * REPORTED CONTENT
 * ----------------------------------------------------------------------------
 * Records a single report filed by a user against a piece of content (a post,
 * a top-level comment, or a reply). Moderators review these in the moderator
 * tab and either delete the offending content or dismiss the report.
 *
 * We deliberately snapshot BOTH parties at report time:
 *   - the reporter (who flagged it)
 *   - the content's author (who created it)
 * so the report stays meaningful even if usernames change later or the content
 * is removed.
 */
const reportedSchema = new mongoose.Schema({
  // What kind of content is being reported.
  // "comment" = top-level comment, "reply" = a comment that has a parentId
  //   (both live in the Comment collection),
  // "post"    lives in the Post collection,
  // "message" is a group-chat message (Message collection).
  contentType: {
    type: String,
    enum: ['post', 'comment', 'reply', 'message', 'event'],
    required: true
  },

  // The _id of the reported Post / Comment / Message document.
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  // For comments/replies, the post they belong to — lets a moderator jump
  // straight to the surrounding thread. Null for reported posts.
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },

  // The community the content lives in (handy for filtering/navigation).
  communityId: {
    type: String,
    default: null
  },

  // --- The author of the reported content (the person who created it) ---
  contentAuthorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contentAuthorUsername: {
    type: String,
    required: true // frozen alias of the author at report time
  },

  // --- The user who filed the report ---
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reporterUsername: {
    type: String,
    required: true // frozen alias of the reporter at report time
  },

  // Optional free-text reason supplied by the reporter.
  reason: {
    type: String,
    default: '',
    trim: true
  },

  // Lifecycle of the report:
  //   pending   -> awaiting moderator action
  //   resolved  -> moderator deleted the content
  //   dismissed -> moderator skipped/dismissed the report (content kept)
  status: {
    type: String,
    enum: ['pending', 'resolved', 'dismissed'],
    default: 'pending'
  },

  // Which moderator acted on it, and when (audit trail).
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// A given user can only have one active report per piece of content (anti-spam).
reportedSchema.index({ reporterId: 1, contentId: 1 }, { unique: true });

// Moderator queues are almost always "show me pending reports, newest first".
reportedSchema.index({ status: 1, createdAt: -1 });

// Export the Reported model bound to the "reporteds" collection.
export default mongoose.model('Reported', reportedSchema);
