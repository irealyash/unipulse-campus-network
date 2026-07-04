import mongoose from 'mongoose';

/**
 * EVENT MODEL
 * ----------------------------------------------------------------------------
 * Represents a scheduled event within a community (e.g., study sessions,
 * club meetings, socials). Events go through moderator review before appearing
 * in the community's event feed.
 *
 * Supports RSVP tracking (coming/busy), capacity limits, media attachments,
 * moderator tags, and private notes for moderators.
 */
const eventSchema = new mongoose.Schema({
  // The community this event belongs to (references Community._id string slug).
  communityId: { 
    type: String, 
    required: true 
  },
  // The user who created this event (references the User collection).
  creatorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // Frozen snapshot of the creator's anonymous username at event creation.
  creatorUsername: {
    type: String,
    default: '',
    trim: true,
  },
  // The title/name of the event (shown in feeds and detail views).
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  // Optional longer description of the event (details, instructions, etc.).
  description: { 
    type: String 
  },
  // Event cover/profile image (URL). Defaults are generated if not set.
  imageUrl: {
    type: String,
    default: null
  },
  // Additional media gallery (images, videos, gifs) attached to the event.
  media: {
    type: [
      {
        url: { type: String, required: true },
        mediaType: { type: String, enum: ['image', 'video', 'gif'], required: true },
      },
    ],
    default: [],
  },
  // The date/time when the event is scheduled to occur.
  eventDate: { 
    type: Date, 
    required: true 
  },
  // RSVP lists — users tap "I will come" (green) or "I am busy" (red).
  coming: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
  },
  busy: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
  },
  /** Max attendees; null means unlimited. */
  capacity: {
    type: Number,
    default: null,
    min: 1,
  },
  // Moderation lifecycle: pending -> approved (visible) or rejected (hidden).
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  // The moderator (User) who approved or rejected this event.
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Timestamp when the moderator reviewed this event.
  reviewedAt: {
    type: Date,
    default: null
  },
  // Visual badge for the event card:
  //   "Official"    -> university/org-sanctioned event
  //   "Student-Led" -> organized by students independently
  //   "Limited"     -> limited capacity / exclusive
  //   "Trending"    -> popular / high RSVP count
  tag: {
    type: String,
    enum: ['Official', 'Student-Led', 'Limited', 'Trending'],
    default: null,
  },
  /** Creator notes for moderators only — never shown in public feeds. */
  moderatorNote: {
    type: String,
    default: '',
    trim: true,
  },
  // Timestamp when the event was originally created/submitted.
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index arrangement optimizes loading upcoming events while hiding or purging past ones
eventSchema.index({ communityId: 1, status: 1, eventDate: 1 });
// Secondary index for the moderator queue: pending events sorted newest first.
eventSchema.index({ status: 1, createdAt: -1 });

// Export the Event model bound to the "events" collection.
export default mongoose.model('Event', eventSchema);