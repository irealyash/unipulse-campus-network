import mongoose from 'mongoose';

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
  // "general"  -> open to every verified student (chess, housing, marketplace...)
  // "course"   -> gated; only students whose enrolledSections include this _id can enter
  // This single field drives all of our access-control logic across posts/chat/events.
  type: {
    type: String,
    enum: ["general", "course"],
    default: "general"
  },
  // The list of custom tags allowed when posting in this specific community
  allowedTags: {
    type: [String],
    default: ["general"] // Every community gets a default tag out of the box
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Community', communitySchema);