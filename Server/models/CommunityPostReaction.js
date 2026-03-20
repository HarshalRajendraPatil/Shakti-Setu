const mongoose = require('mongoose');

const communityPostReactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityPost',
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

communityPostReactionSchema.index({ user: 1, post: 1 }, { unique: true });
communityPostReactionSchema.index({ post: 1, reactionType: 1 });

module.exports = mongoose.model('CommunityPostReaction', communityPostReactionSchema);
