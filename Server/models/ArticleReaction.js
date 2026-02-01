const mongoose = require('mongoose');

const articleReactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
  action: { type: String, enum: ['like', 'dislike'], required: true }
}, { timestamps: true });

articleReactionSchema.index({ user: 1, article: 1 }, { unique: true });

module.exports = mongoose.model('ArticleReaction', articleReactionSchema);
