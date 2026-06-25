import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  postId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Post', 
    required: true 
  },
  parentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Comment', 
    default: null 
  }, // If null, it is a root comment on the post
  authorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  anonymousUsername: { 
    type: String, 
    required: true 
  }, // Frozen string value representing their alias at the exact time of posting
  content: { 
    type: String, 
    required: true 
  },
  // Same Reddit-style voting model used on posts (see Post.js for the rationale).
  upvotes: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
  },
  downvotes: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Computed net score, exposed on JSON output for the frontend.
commentSchema.virtual('score').get(function () {
  return this.upvotes.length - this.downvotes.length;
});
commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

// Index optimization for retrieving a post's full comment map efficiently
commentSchema.index({ postId: 1, parentId: 1 });

export default mongoose.model('Comment', commentSchema);