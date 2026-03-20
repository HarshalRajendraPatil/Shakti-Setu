const mongoose = require('mongoose');

const dimensionSchema = new mongoose.Schema({
  easeOfUse: { type: Number, min: 1, max: 5, default: null },
  responseTime: { type: Number, min: 1, max: 5, default: null },
  legalClarity: { type: Number, min: 1, max: 5, default: null },
  supportQuality: { type: Number, min: 1, max: 5, default: null },
  valueForMoney: { type: Number, min: 1, max: 5, default: null }
}, { _id: false });

const feedbackSchema = new mongoose.Schema({
  submittedByUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  consultation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation',
    default: null
  },
  targetType: {
    type: String,
    enum: ['platform', 'lawyer'],
    required: true
  },
  lawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer',
    default: null
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    default: '',
    trim: true,
    maxlength: 2000
  },
  categories: {
    type: [String],
    default: []
  },
  dimensions: {
    type: dimensionSchema,
    default: () => ({})
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral'
  },
  source: {
    type: String,
    enum: ['direct_feedback', 'consultation_rating', 'legacy_import', 'admin_adjustment'],
    default: 'direct_feedback'
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'hidden'],
    default: 'active'
  },
  metadata: {
    channel: { type: String, default: 'web' },
    userAgent: { type: String, default: '' }
  }
}, {
  timestamps: true
});

feedbackSchema.pre('validate', function(next) {
  if (this.targetType === 'lawyer' && !this.lawyer) {
    return next(new Error('Lawyer reference is required for lawyer feedback'));
  }

  if (this.targetType === 'platform') {
    this.lawyer = null;
  }

  if (this.rating >= 4) this.sentiment = 'positive';
  else if (this.rating === 3) this.sentiment = 'neutral';
  else this.sentiment = 'negative';

  next();
});

feedbackSchema.index({ submittedByUser: 1, createdAt: -1 });
feedbackSchema.index({ targetType: 1, lawyer: 1, createdAt: -1 });
feedbackSchema.index({ rating: 1, createdAt: -1 });
feedbackSchema.index(
  { consultation: 1, submittedByUser: 1 },
  { unique: true, partialFilterExpression: { consultation: { $exists: true, $ne: null } } }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
