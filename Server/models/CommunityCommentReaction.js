const mongoose = require('mongoose');

const communityCommentReactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityComment',
    required: true
  },
  reactionType: {
    type: String,
    enum: ['support', 'helpful', 'care'],
    required: true
  }
}, {
  timestamps: true
});

communityCommentReactionSchema.index({ user: 1, comment: 1 }, { unique: true });
communityCommentReactionSchema.index({ comment: 1, reactionType: 1 });

module.exports = mongoose.model('CommunityCommentReaction', communityCommentReactionSchema);
