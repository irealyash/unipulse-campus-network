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
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index arrangement optimizes loading upcoming events while hiding or purging past ones
eventSchema.index({ communityId: 1, eventDate: 1 });

export default mongoose.model('Event', eventSchema);