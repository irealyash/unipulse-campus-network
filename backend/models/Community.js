import mongoose from 'mongoose';

/**
 * COMMUNITY MODEL
 * ----------------------------------------------------------------------------
 * Represents a discussion space in UniPulse — either a course section
 * (auto-created from student schedule uploads) or a general interest group
 * (manually created by moderators).
 *
 * Communities are the top-level namespace for posts, events, and live chat.
 * Uses a custom String _id (slug) instead of ObjectId for readable URLs.
 */
const communitySchema = new mongoose.Schema({
  // The unique identifier for the room/section (e.g., "CPSC-110-L1A" or "chess")
  // Using a custom String ID instead of the default automatic ObjectId
  _id: { 
    type: String, 
    required: true 
  },
  // Human readable name shown in the UI (e.g., "CPSC 110 - L1A" or "Chess Club")
  name: {
    type: String,
    required: true,
    trim: true
  },
  // Optional blurb describing the community
  description: {
    type: String,
    default: ""
  },
  // Community profile picture (URL). If omitted, the API returns a generated default.
  imageUrl: {
    type: String,
    default: null
  },
  // "general"  -> interest communities (public or moderator-managed private)
  // "course"   -> section communities from calendar upload (always private)
  type: {
    type: String,
    enum: ["general", "course"],
    default: "general"
  },
  // Catalog grouping for public communities (course sections use "course").
  category: {
    type: String,
    enum: ["international", "academic", "residence", "general", "faculty", "course"],
    default: "general",
  },
  // false -> any verified student can see and join
  // true  -> course sections via calendar, or general via moderator-added members
  private: {
    type: Boolean,
    default: false
  },
  // Moderator-invited members for private general communities
  members: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
  },
  // The list of custom tags allowed when posting in this specific community
  allowedTags: {
    type: [String],
    default: ["general"] // Every community gets a default tag out of the box
  },
  // Timestamp when the community was created.
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Quickly find public vs private communities by type (for catalog listing).
communitySchema.index({ private: 1, type: 1 });
// Sort communities by category then name for alphabetical catalog pages.
communitySchema.index({ category: 1, name: 1 });
// Look up all communities a given user is a member of (for private groups).
communitySchema.index({ members: 1 });

// Export the Community model bound to the "communities" collection.
export default mongoose.model('Community', communitySchema);