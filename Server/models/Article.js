const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  excerpt: {
    type: String,
    default: '',
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'en',
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  readCount: { type: Number, default: 0 },
  likeCount: { type: Number, default: 0 },
  dislikeCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

articleSchema.index({ category: 1 });
articleSchema.index({ slug: 1 });

module.exports = mongoose.model('Article', articleSchema);
