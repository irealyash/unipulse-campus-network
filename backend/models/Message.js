import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  communityId: { 
    type: String, 
    required: true 
  }, // Links directly to a specific Socket.io channel room
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  anonymousUsername: { 
    type: String, 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index layout optimizes reverse-chronological pagination for initial chat load requests
messageSchema.index({ communityId: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);