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
  eventDate: { 
    type: Date, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index arrangement optimizes loading upcoming events while hiding or purging past ones
eventSchema.index({ communityId: 1, eventDate: 1 });

export default mongoose.model('Event', eventSchema);