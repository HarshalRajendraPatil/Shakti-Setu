const mongoose = require('mongoose');

const feedbackAnalyticsReportSchema = new mongoose.Schema({
  periodType: {
    type: String,
    enum: ['weekly', 'monthly'],
    required: true
  },
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  generationSource: {
    type: String,
    enum: ['system', 'manual'],
    default: 'system'
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  summary: {
    totalFeedbacks: { type: Number, default: 0 },
    uniqueUsers: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    satisfactionIndex: { type: Number, default: 0 },
    npsScore: { type: Number, default: 0 },
    positiveRatio: { type: Number, default: 0 },
    neutralRatio: { type: Number, default: 0 },
    negativeRatio: { type: Number, default: 0 }
  },
  satisfactionMetrics: {
    overallAverage: { type: Number, default: 0 },
    dimensionAverages: {
      easeOfUse: { type: Number, default: 0 },
      responseTime: { type: Number, default: 0 },
      legalClarity: { type: Number, default: 0 },
      supportQuality: { type: Number, default: 0 },
      valueForMoney: { type: Number, default: 0 }
    },
    ratingDistribution: {
      '1': { type: Number, default: 0 },
      '2': { type: Number, default: 0 },
      '3': { type: Number, default: 0 },
      '4': { type: Number, default: 0 },
      '5': { type: Number, default: 0 }
    },
    categoryDistribution: [{
      category: { type: String },
      count: { type: Number }
    }]
  },
  lawyerPerformance: [{
    lawyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Lawyer' },
    lawyerName: { type: String, default: '' },
    state: { type: String, default: '' },
    averageRating: { type: Number, default: 0 },
    totalFeedbacks: { type: Number, default: 0 },
    positiveRatio: { type: Number, default: 0 },
    responseTimeAverage: { type: Number, default: 0 },
    supportQualityAverage: { type: Number, default: 0 },
    ratingTrendDelta: { type: Number, default: 0 }
  }],
  metadata: {
    notes: { type: String, default: '' }
  }
}, {
  timestamps: true
});

feedbackAnalyticsReportSchema.index(
  { periodType: 1, periodStart: 1, periodEnd: 1 },
  { unique: true }
);
feedbackAnalyticsReportSchema.index({ periodType: 1, createdAt: -1 });

module.exports = mongoose.model('FeedbackAnalyticsReport', feedbackAnalyticsReportSchema);
