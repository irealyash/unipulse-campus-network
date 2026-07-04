import mongoose from 'mongoose';

const modMessageMediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    mediaType: {
      type: String,
      enum: ['image', 'video', 'gif'],
      required: true,
    },
  },
  { _id: false }
);

const modMessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ModConversation',
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderRole: {
    type: String,
    enum: ['moderator', 'user'],
    required: true,
  },
  senderUsername: {
    type: String,
    required: true,
    trim: true,
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    default: '',
    trim: true,
  },
  media: {
    type: modMessageMediaSchema,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

modMessageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.model('ModMessage', modMessageSchema);
