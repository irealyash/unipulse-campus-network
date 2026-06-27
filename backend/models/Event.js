import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  communityId: { 
    type: String, 
    required: true 
  },
  creatorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  description: { 
    type: String 
  },
  // Event cover/profile image (URL). Defaults are generated if not set.
  imageUrl: {
    type: String,
    default: null
  },
  media: {
    type: [
      {
        url: { type: String, required: true },
        mediaType: { type: String, enum: ['image', 'video', 'gif'], required: true },
      },
    ],
    default: [],
  },
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
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index arrangement optimizes loading upcoming events while hiding or purging past ones
eventSchema.index({ communityId: 1, status: 1, eventDate: 1 });
eventSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Event', eventSchema);