const mongoose = require('mongoose');

const reactionsSummarySchema = new mongoose.Schema({
  support: { type: Number, default: 0 },
  helpful: { type: Number, default: 0 },
  care: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
}, { _id: false });

const communityCommentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityPost',
    required: true,
    index: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 1500
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'deleted', 'hidden'],
    default: 'active',
    index: true
  },
  reactionsSummary: {
    type: reactionsSummarySchema,
    default: () => ({})
  }
}, {
  timestamps: true
});

communityCommentSchema.index({ post: 1, status: 1, createdAt: 1 });
communityCommentSchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model('CommunityComment', communityCommentSchema);
