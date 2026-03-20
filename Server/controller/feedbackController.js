const Feedback = require('../models/Feedback');
const FeedbackAnalyticsReport = require('../models/FeedbackAnalyticsReport');
const Consultation = require('../models/Consultation');
const Lawyer = require('../models/Lawyer');
const {
  getDateRangeFromQuery,
  getPlatformFeedbackAnalytics,
  getLawyerPerformanceAnalytics: getLawyerPerformanceAnalyticsService,
  getUserSatisfactionMetrics,
  generateAndStoreFeedbackReport,
  syncLawyerRatingStats,
  ensureFeedbackBackfilledFromConsultations
} = require('../utils/feedbackAnalytics');

const parseArray = (value) => {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) return value.filter(Boolean);
  return [String(value)].filter(Boolean);
};

const buildDimensions = (payload = {}) => {
  const keys = ['easeOfUse', 'responseTime', 'legalClarity', 'supportQuality', 'valueForMoney'];
  const dimensions = {};

  keys.forEach((key) => {
    if (payload[key] === undefined || payload[key] === null || payload[key] === '') return;
    const value = Number(payload[key]);
    if (!Number.isFinite(value) || value < 1 || value > 5) {
      throw new Error(`Invalid dimension value for ${key}. Expected number between 1 and 5`);
    }
    dimensions[key] = value;
  });

  return dimensions;
};

// User submits feedback (platform-wide or lawyer-specific)
exports.createFeedback = async (req, res) => {
  try {
    const {
      targetType,
      lawyerId,
      consultationId,
      rating,
      comment,
      categories,
      dimensions,
      isAnonymous
    } = req.body;

    const safeTargetType = targetType || 'platform';
    const safeRating = Number(rating);

    if (!['platform', 'lawyer'].includes(safeTargetType)) {
      return res.status(400).json({ message: 'Invalid targetType. Use platform or lawyer.' });
    }

    if (!Number.isFinite(safeRating) || safeRating < 1 || safeRating > 5) {
      return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
    }

    let consultation = null;
    if (consultationId) {
      consultation = await Consultation.findById(consultationId);
      if (!consultation) {
        return res.status(404).json({ message: 'Consultation not found' });
      }
      if (String(consultation.user) !== String(req.user.id)) {
        return res.status(403).json({ message: 'You can only submit feedback for your consultations' });
      }
      if (consultation.status !== 'completed') {
        return res.status(400).json({ message: 'Feedback can only be submitted for completed consultations' });
      }

      const existing = await Feedback.findOne({
        consultation: consultation._id,
        submittedByUser: req.user.id
      });
      if (existing) {
        return res.status(409).json({ message: 'Feedback already exists for this consultation' });
      }
    }

    let resolvedLawyerId = null;
    if (safeTargetType === 'lawyer') {
      resolvedLawyerId = lawyerId || consultation?.lawyer;
      if (!resolvedLawyerId) {
        return res.status(400).json({ message: 'Lawyer ID is required for lawyer feedback' });
      }

      const lawyer = await Lawyer.findById(resolvedLawyerId);
      if (!lawyer) {
        return res.status(404).json({ message: 'Lawyer not found' });
      }

      if (consultation && String(consultation.lawyer) !== String(resolvedLawyerId)) {
        return res.status(400).json({ message: 'Consultation lawyer and provided lawyerId do not match' });
      }
    }

    let safeDimensions = {};
    try {
      safeDimensions = buildDimensions(dimensions || {});
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    const feedback = new Feedback({
      submittedByUser: req.user.id,
      consultation: consultation?._id || null,
      targetType: safeTargetType,
      lawyer: resolvedLawyerId,
      rating: safeRating,
      comment: (comment || '').trim(),
      categories: parseArray(categories) || [],
      dimensions: safeDimensions,
      source: consultation ? 'consultation_rating' : 'direct_feedback',
      isAnonymous: isAnonymous === true,
      metadata: {
        channel: 'web',
        userAgent: req.get('User-Agent') || ''
      }
    });

    await feedback.save();

    if (safeTargetType === 'lawyer') {
      await syncLawyerRatingStats(resolvedLawyerId);
    }

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// User updates own feedback
exports.updateMyFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { rating, comment, categories, dimensions, isAnonymous, status } = req.body;

    const feedback = await Feedback.findOne({
      _id: feedbackId,
      submittedByUser: req.user.id,
      status: { $ne: 'hidden' }
    });

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    if (rating !== undefined) {
      const safeRating = Number(rating);
      if (!Number.isFinite(safeRating) || safeRating < 1 || safeRating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }
      feedback.rating = safeRating;
    }

    if (comment !== undefined) feedback.comment = String(comment || '').trim();
    if (categories !== undefined) feedback.categories = parseArray(categories) || [];
    if (isAnonymous !== undefined) feedback.isAnonymous = isAnonymous === true;

    if (dimensions !== undefined) {
      let safeDimensions = {};
      try {
        safeDimensions = buildDimensions(dimensions || {});
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
      const currentDimensions = typeof feedback.dimensions?.toObject === 'function'
        ? feedback.dimensions.toObject()
        : (feedback.dimensions || {});

      feedback.dimensions = {
        ...currentDimensions,
        ...safeDimensions
      };
    }

    if (status !== undefined && ['active', 'hidden'].includes(status)) {
      feedback.status = status;
    }

    await feedback.save();

    if (feedback.targetType === 'lawyer' && feedback.lawyer) {
      await syncLawyerRatingStats(feedback.lawyer);
    }

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      feedback
    });
  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// User soft-deletes own feedback
exports.deleteMyFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;

    const feedback = await Feedback.findOne({
      _id: feedbackId,
      submittedByUser: req.user.id,
      status: 'active'
    });

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    feedback.status = 'hidden';
    await feedback.save();

    if (feedback.targetType === 'lawyer' && feedback.lawyer) {
      await syncLawyerRatingStats(feedback.lawyer);
    }

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// User fetches own feedback history
exports.getMyFeedback = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const query = { submittedByUser: req.user.id };
    if (req.query.status && ['active', 'hidden'].includes(req.query.status)) {
      query.status = req.query.status;
    }

    const [feedbacks, total] = await Promise.all([
      Feedback.find(query)
        .populate('lawyer', 'name email state specialization')
        .populate('consultation', 'subject status consultationType createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Feedback.countDocuments(query)
    ]);

    res.json({
      success: true,
      page,
      limit,
      total,
      count: feedbacks.length,
      feedbacks
    });
  } catch (error) {
    console.error('Get my feedback error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Public lawyer feedback summary
exports.getLawyerPublicFeedbackSummary = async (req, res) => {
  try {
    const { lawyerId } = req.params;

    const lawyer = await Lawyer.findById(lawyerId).select('name averageRating totalRatings status isSuspended state');
    if (!lawyer || lawyer.status !== 'approved' || lawyer.isSuspended) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    const [summaryAgg, recentFeedback] = await Promise.all([
      Feedback.aggregate([
        {
          $match: {
            lawyer: lawyer._id,
            targetType: 'lawyer',
            status: 'active'
          }
        },
        {
          $group: {
            _id: null,
            totalFeedbacks: { $sum: 1 },
            averageRating: { $avg: '$rating' }
          }
        }
      ]),
      Feedback.find({
        lawyer: lawyer._id,
        targetType: 'lawyer',
        status: 'active',
        comment: { $ne: '' }
      })
        .populate('submittedByUser', 'name')
        .sort({ createdAt: -1 })
        .limit(10)
        .select('rating comment isAnonymous createdAt submittedByUser')
    ]);

    const summary = summaryAgg[0] || { totalFeedbacks: 0, averageRating: 0 };

    res.json({
      success: true,
      lawyer: {
        id: lawyer._id,
        name: lawyer.name,
        state: lawyer.state,
        averageRating: Number((summary.averageRating || lawyer.averageRating || 0).toFixed(2)),
        totalRatings: summary.totalFeedbacks || lawyer.totalRatings || 0
      },
      recentFeedback: recentFeedback.map((item) => ({
        id: item._id,
        rating: item.rating,
        comment: item.comment,
        user: item.isAnonymous ? 'Anonymous' : (item.submittedByUser?.name || 'Anonymous'),
        createdAt: item.createdAt
      }))
    });
  } catch (error) {
    console.error('Get lawyer public feedback summary error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Lawyer analytics for own performance
exports.getMyLawyerPerformance = async (req, res) => {
  try {
    const { startDate, endDate, days } = req.query;
    const window = getDateRangeFromQuery({ startDate, endDate, days, defaultDays: 90 });

    const data = await getLawyerPerformanceAnalyticsService({
      ...window,
      lawyerId: req.lawyer.id,
      limit: 1
    });

    res.json({
      success: true,
      window: data.window,
      performance: data.lawyers[0] || {
        lawyer: req.lawyer.id,
        lawyerName: req.lawyer.name,
        averageRating: 0,
        totalFeedbacks: 0,
        positiveRatio: 0,
        responseTimeAverage: 0,
        supportQualityAverage: 0,
        ratingTrendDelta: 0
      }
    });
  } catch (error) {
    console.error('Get my lawyer performance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin platform-wide analytics
exports.getPlatformAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, days } = req.query;
    const window = getDateRangeFromQuery({ startDate, endDate, days, defaultDays: 30 });

    await ensureFeedbackBackfilledFromConsultations();
    const analytics = await getPlatformFeedbackAnalytics(window);

    res.json({
      success: true,
      ...analytics
    });
  } catch (error) {
    console.error('Get platform analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin lawyer performance analytics
exports.getLawyerPerformanceAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, days, lawyerId, limit } = req.query;
    const window = getDateRangeFromQuery({ startDate, endDate, days, defaultDays: 30 });

    await ensureFeedbackBackfilledFromConsultations();
    const analytics = await getLawyerPerformanceAnalyticsService({
      ...window,
      lawyerId,
      limit
    });

    res.json({
      success: true,
      ...analytics
    });
  } catch (error) {
    console.error('Get lawyer performance analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin user satisfaction metrics
exports.getSatisfactionMetrics = async (req, res) => {
  try {
    const { startDate, endDate, days } = req.query;
    const window = getDateRangeFromQuery({ startDate, endDate, days, defaultDays: 30 });

    await ensureFeedbackBackfilledFromConsultations();
    const metrics = await getUserSatisfactionMetrics(window);

    res.json({
      success: true,
      ...metrics
    });
  } catch (error) {
    console.error('Get satisfaction metrics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin report generation (manual)
exports.generatePeriodicReport = async (req, res) => {
  try {
    const { periodType, startDate, endDate, force } = req.body;

    if (!['weekly', 'monthly'].includes(periodType)) {
      return res.status(400).json({ message: 'periodType must be weekly or monthly' });
    }

    const output = await generateAndStoreFeedbackReport({
      periodType,
      startDate,
      endDate,
      generatedBy: req.user.id,
      generationSource: 'manual',
      force: force === true
    });

    res.status(output.created ? 201 : 200).json({
      success: true,
      created: output.created,
      message: output.created ? 'Report generated successfully' : 'Report already existed for this period',
      report: output.report
    });
  } catch (error) {
    console.error('Generate periodic report error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin list reports
exports.listPeriodicReports = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.periodType && ['weekly', 'monthly'].includes(req.query.periodType)) {
      query.periodType = req.query.periodType;
    }

    const [reports, total] = await Promise.all([
      FeedbackAnalyticsReport.find(query)
        .populate('generatedBy', 'name email')
        .sort({ periodStart: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      FeedbackAnalyticsReport.countDocuments(query)
    ]);

    res.json({
      success: true,
      page,
      limit,
      total,
      count: reports.length,
      reports
    });
  } catch (error) {
    console.error('List periodic reports error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin get latest report for period type
exports.getLatestPeriodicReport = async (req, res) => {
  try {
    const { periodType } = req.params;

    if (!['weekly', 'monthly'].includes(periodType)) {
      return res.status(400).json({ message: 'Invalid period type' });
    }

    const report = await FeedbackAnalyticsReport.findOne({ periodType })
      .populate('generatedBy', 'name email')
      .sort({ periodStart: -1, createdAt: -1 });

    if (!report) {
      return res.status(404).json({ message: `No ${periodType} report found` });
    }

    res.json({ success: true, report });
  } catch (error) {
    console.error('Get latest periodic report error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
