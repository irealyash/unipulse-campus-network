import mongoose from 'mongoose';

/**
 * One direct-message thread between a student and the moderator who contacted them.
 * Each user may only have one active moderator conversation.
 */
const modConversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  moderatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userUsername: {
    type: String,
    required: true,
    trim: true,
  },
  moderatorUsername: {
    type: String,
    required: true,
    trim: true,
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  lastPreview: {
    type: String,
    default: '',
    maxlength: 200,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

modConversationSchema.pre('save', function setUpdatedAt(next) {
  this.updatedAt = new Date();
  next();
});

modConversationSchema.index({ moderatorId: 1, lastMessageAt: -1 });

export default mongoose.model('ModConversation', modConversationSchema);
