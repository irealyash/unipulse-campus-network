import mongoose from 'mongoose';
import { emojiReactionSchema } from './reactionSchema.js';

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
  // Like/dislike reactions (same model as posts/comments): sets of user ids.
  likes: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
  },
  dislikes: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
  },
  // Free-form emoji reactions. A user may add several different emojis but only
  // once per emoji (enforced in utils/emojiReaction.js).
  reactions: {
    type: [emojiReactionSchema],
    default: []
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Net like score, handy for the UI.
messageSchema.virtual('score').get(function () {
  return this.likes.length - this.dislikes.length;
});
messageSchema.set('toJSON', { virtuals: true });
messageSchema.set('toObject', { virtuals: true });

// Index layout optimizes reverse-chronological pagination for initial chat load requests
messageSchema.index({ communityId: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
