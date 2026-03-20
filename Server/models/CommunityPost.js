const mongoose = require('mongoose');

const reactionsSummarySchema = new mongoose.Schema({
  support: { type: Number, default: 0 },
  helpful: { type: Number, default: 0 },
  care: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
}, { _id: false });

const communityPostSchema = new mongoose.Schema({
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
    minlength: 3,
    maxlength: 3000
  },
  isAnonymous: {
    type: Boolean,
    default: true
  },
  tags: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['active', 'deleted', 'hidden'],
    default: 'active',
    index: true
  },
  commentsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  reactionsSummary: {
    type: reactionsSummarySchema,
    default: () => ({})
  },
  lastActivityAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

communityPostSchema.index({ status: 1, createdAt: -1 });
communityPostSchema.index({ status: 1, lastActivityAt: -1 });
communityPostSchema.index({ tags: 1, createdAt: -1 });

module.exports = mongoose.model('CommunityPost', communityPostSchema);
