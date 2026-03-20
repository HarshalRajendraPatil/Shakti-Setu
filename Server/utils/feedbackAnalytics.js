const mongoose = require('mongoose');
const Feedback = require('../models/Feedback');
const FeedbackAnalyticsReport = require('../models/FeedbackAnalyticsReport');
const Consultation = require('../models/Consultation');
const Lawyer = require('../models/Lawyer');

const RATING_KEYS = ['1', '2', '3', '4', '5'];

const round = (value, digits = 2) => {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(digits));
};

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (!mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const getDateRangeFromQuery = ({ startDate, endDate, days, defaultDays = 30 } = {}) => {
  const parsedStart = normalizeDate(startDate);
  const parsedEnd = normalizeDate(endDate);

  if (parsedStart && parsedEnd && parsedStart <= parsedEnd) {
    return { startDate: parsedStart, endDate: parsedEnd };
  }

  const safeDays = Math.min(Math.max(parseInt(days, 10) || defaultDays, 1), 365);
  const end = new Date();
  const start = new Date(end.getTime() - safeDays * 24 * 60 * 60 * 1000);

  return { startDate: start, endDate: end };
};

const getCompletedPeriodRange = (periodType, referenceDate = new Date()) => {
  const ref = new Date(referenceDate);

  if (periodType === 'weekly') {
    const utcDay = (ref.getUTCDay() + 6) % 7; // Monday=0, Sunday=6
    const currentWeekStart = new Date(Date.UTC(
      ref.getUTCFullYear(),
      ref.getUTCMonth(),
      ref.getUTCDate() - utcDay,
      0,
      0,
      0,
      0
    ));

    const periodEnd = new Date(currentWeekStart.getTime() - 1);
    const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000 + 1);

    return { startDate: periodStart, endDate: periodEnd };
  }

  if (periodType === 'monthly') {
    const currentMonthStart = new Date(Date.UTC(
      ref.getUTCFullYear(),
      ref.getUTCMonth(),
      1,
      0,
      0,
      0,
      0
    ));

    const periodEnd = new Date(currentMonthStart.getTime() - 1);
    const periodStart = new Date(Date.UTC(
      periodEnd.getUTCFullYear(),
      periodEnd.getUTCMonth(),
      1,
      0,
      0,
      0,
      0
    ));

    return { startDate: periodStart, endDate: periodEnd };
  }

  throw new Error('Invalid period type. Use weekly or monthly');
};

const getPreviousWindow = ({ startDate, endDate }) => {
  const sizeMs = endDate.getTime() - startDate.getTime() + 1;
  const prevEnd = new Date(startDate.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - sizeMs + 1);
  return { startDate: prevStart, endDate: prevEnd };
};

const buildFeedbackMatch = ({ startDate, endDate, targetType, lawyerId }) => {
  const match = {
    status: 'active',
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  };

  if (targetType) match.targetType = targetType;
  if (lawyerId) {
    const objectId = toObjectId(lawyerId);
    if (!objectId) throw new Error('Invalid lawyer ID');
    match.lawyer = objectId;
  }

  return match;
};

const getBaseDistribution = () => ({
  '1': 0,
  '2': 0,
  '3': 0,
  '4': 0,
  '5': 0
});

const normalizeDistribution = (distributionList = []) => {
  const distribution = getBaseDistribution();

  distributionList.forEach((item) => {
    const key = String(item._id);
    if (RATING_KEYS.includes(key)) distribution[key] = item.count;
  });

  return distribution;
};

const mergeLegacyConsultationRatings = async ({ match, includeOnlyWhenNotBackfilled = true }) => {
  const feedbackConsultationIds = await Feedback.find({
    consultation: { $ne: null },
    ...(match.lawyer ? { lawyer: match.lawyer } : {})
  }).distinct('consultation');

  const consultationMatch = {
    status: 'completed',
    rating: { $exists: true, $ne: null },
    createdAt: { $gte: match.createdAt.$gte, $lte: match.createdAt.$lte }
  };

  if (match.lawyer) consultationMatch.lawyer = match.lawyer;

  if (includeOnlyWhenNotBackfilled && feedbackConsultationIds.length > 0) {
    consultationMatch._id = { $nin: feedbackConsultationIds };
  }

  const result = await Consultation.aggregate([
    { $match: consultationMatch },
    {
      $group: {
        _id: null,
        totalFeedbacks: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        sumRatings: { $sum: '$rating' },
        uniqueUsers: { $addToSet: '$user' },
        distribution: {
          $push: '$rating'
        }
      }
    }
  ]);

  if (!result.length) {
    return {
      totalFeedbacks: 0,
      averageRating: 0,
      sumRatings: 0,
      uniqueUsers: 0,
      uniqueUserIds: [],
      ratingDistribution: getBaseDistribution()
    };
  }

  const entry = result[0];
  const legacyDistribution = getBaseDistribution();
  (entry.distribution || []).forEach((rating) => {
    const key = String(rating);
    if (RATING_KEYS.includes(key)) legacyDistribution[key] += 1;
  });

  return {
    totalFeedbacks: entry.totalFeedbacks || 0,
    averageRating: entry.averageRating || 0,
    sumRatings: entry.sumRatings || 0,
    uniqueUsers: (entry.uniqueUsers || []).length,
    uniqueUserIds: (entry.uniqueUsers || []).map((id) => String(id)),
    ratingDistribution: legacyDistribution
  };
};

const calculateNps = (distribution) => {
  const total = Object.values(distribution).reduce((sum, value) => sum + value, 0);
  if (!total) return 0;

  const promoters = distribution['5'] || 0;
  const detractors = (distribution['1'] || 0) + (distribution['2'] || 0) + (distribution['3'] || 0);

  return round(((promoters - detractors) / total) * 100);
};

const calculateSatisfactionIndex = ({ averageRating, positiveRatio }) => {
  const ratingComponent = (averageRating / 5) * 70;
  const sentimentComponent = (positiveRatio / 100) * 30;
  return round(ratingComponent + sentimentComponent);
};

const getPlatformFeedbackAnalytics = async ({ startDate, endDate }) => {
  const match = buildFeedbackMatch({ startDate, endDate });

  const [agg] = await Feedback.aggregate([
    { $match: match },
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              totalFeedbacks: { $sum: 1 },
              averageRating: { $avg: '$rating' },
              uniqueUsers: { $addToSet: '$submittedByUser' },
              positiveCount: { $sum: { $cond: [{ $eq: ['$sentiment', 'positive'] }, 1, 0] } },
              neutralCount: { $sum: { $cond: [{ $eq: ['$sentiment', 'neutral'] }, 1, 0] } },
              negativeCount: { $sum: { $cond: [{ $eq: ['$sentiment', 'negative'] }, 1, 0] } }
            }
          }
        ],
        ratingDistribution: [
          { $group: { _id: '$rating', count: { $sum: 1 } } }
        ],
        categoryDistribution: [
          { $unwind: { path: '$categories', preserveNullAndEmptyArrays: false } },
          { $group: { _id: '$categories', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 20 }
        ],
        dimensionAverages: [
          {
            $group: {
              _id: null,
              easeOfUse: { $avg: '$dimensions.easeOfUse' },
              responseTime: { $avg: '$dimensions.responseTime' },
              legalClarity: { $avg: '$dimensions.legalClarity' },
              supportQuality: { $avg: '$dimensions.supportQuality' },
              valueForMoney: { $avg: '$dimensions.valueForMoney' }
            }
          }
        ]
      }
    }
  ]);

  const summary = agg?.summary?.[0] || {};
  const directDistribution = normalizeDistribution(agg?.ratingDistribution || []);

  const legacy = await mergeLegacyConsultationRatings({ match });

  const mergedDistribution = getBaseDistribution();
  RATING_KEYS.forEach((key) => {
    mergedDistribution[key] = (directDistribution[key] || 0) + (legacy.ratingDistribution[key] || 0);
  });

  const directCount = summary.totalFeedbacks || 0;
  const mergedCount = directCount + legacy.totalFeedbacks;

  const directSumRatings = RATING_KEYS.reduce((sum, key) => sum + Number(key) * (directDistribution[key] || 0), 0);
  const mergedSumRatings = directSumRatings + legacy.sumRatings;
  const averageRating = mergedCount ? round(mergedSumRatings / mergedCount) : 0;

  const positiveCount = (summary.positiveCount || 0) + (legacy.ratingDistribution['4'] || 0) + (legacy.ratingDistribution['5'] || 0);
  const neutralCount = (summary.neutralCount || 0) + (legacy.ratingDistribution['3'] || 0);
  const negativeCount = (summary.negativeCount || 0) + (legacy.ratingDistribution['1'] || 0) + (legacy.ratingDistribution['2'] || 0);

  const positiveRatio = mergedCount ? round((positiveCount / mergedCount) * 100) : 0;
  const neutralRatio = mergedCount ? round((neutralCount / mergedCount) * 100) : 0;
  const negativeRatio = mergedCount ? round((negativeCount / mergedCount) * 100) : 0;

  const npsScore = calculateNps(mergedDistribution);
  const satisfactionIndex = calculateSatisfactionIndex({ averageRating, positiveRatio });

  const dimensions = agg?.dimensionAverages?.[0] || {};
  const directUserIds = new Set((summary.uniqueUsers || []).map((id) => String(id)));
  (legacy.uniqueUserIds || []).forEach((id) => directUserIds.add(String(id)));

  return {
    window: { startDate, endDate },
    summary: {
      totalFeedbacks: mergedCount,
      uniqueUsers: directUserIds.size,
      averageRating,
      satisfactionIndex,
      npsScore,
      positiveRatio,
      neutralRatio,
      negativeRatio
    },
    satisfactionMetrics: {
      overallAverage: averageRating,
      dimensionAverages: {
        easeOfUse: round(dimensions.easeOfUse || 0),
        responseTime: round(dimensions.responseTime || 0),
        legalClarity: round(dimensions.legalClarity || 0),
        supportQuality: round(dimensions.supportQuality || 0),
        valueForMoney: round(dimensions.valueForMoney || 0)
      },
      ratingDistribution: mergedDistribution,
      categoryDistribution: (agg?.categoryDistribution || []).map((item) => ({
        category: item._id,
        count: item.count
      }))
    }
  };
};

const getLawyerPerformanceAnalytics = async ({ startDate, endDate, lawyerId, limit = 50 }) => {
  const match = buildFeedbackMatch({ startDate, endDate, targetType: 'lawyer', lawyerId });

  const current = await Feedback.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$lawyer',
        totalFeedbacks: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        positiveCount: { $sum: { $cond: [{ $eq: ['$sentiment', 'positive'] }, 1, 0] } },
        responseTimeAverage: { $avg: '$dimensions.responseTime' },
        supportQualityAverage: { $avg: '$dimensions.supportQuality' }
      }
    },
    { $sort: { averageRating: -1, totalFeedbacks: -1 } },
    { $limit: Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200) },
    {
      $lookup: {
        from: 'lawyers',
        localField: '_id',
        foreignField: '_id',
        as: 'lawyerDoc'
      }
    },
    { $unwind: { path: '$lawyerDoc', preserveNullAndEmptyArrays: true } }
  ]);

  const previousWindow = getPreviousWindow({ startDate, endDate });
  const prevMatch = buildFeedbackMatch({
    startDate: previousWindow.startDate,
    endDate: previousWindow.endDate,
    targetType: 'lawyer',
    lawyerId
  });

  const prev = await Feedback.aggregate([
    { $match: prevMatch },
    {
      $group: {
        _id: '$lawyer',
        averageRating: { $avg: '$rating' }
      }
    }
  ]);

  const prevMap = new Map(prev.map((item) => [String(item._id), item.averageRating || 0]));

  return {
    window: { startDate, endDate },
    lawyers: current.map((item) => {
      const prevAverage = prevMap.get(String(item._id));
      const trendDelta = Number.isFinite(prevAverage)
        ? round((item.averageRating || 0) - prevAverage)
        : 0;
      const positiveRatio = item.totalFeedbacks
        ? round((item.positiveCount / item.totalFeedbacks) * 100)
        : 0;

      return {
        lawyer: item._id,
        lawyerName: item.lawyerDoc?.name || 'Unknown Lawyer',
        state: item.lawyerDoc?.state || '',
        averageRating: round(item.averageRating || 0),
        totalFeedbacks: item.totalFeedbacks || 0,
        positiveRatio,
        responseTimeAverage: round(item.responseTimeAverage || 0),
        supportQualityAverage: round(item.supportQualityAverage || 0),
        ratingTrendDelta: trendDelta
      };
    })
  };
};

const getUserSatisfactionMetrics = async ({ startDate, endDate }) => {
  const analytics = await getPlatformFeedbackAnalytics({ startDate, endDate });

  const total = analytics.summary.totalFeedbacks;
  const dist = analytics.satisfactionMetrics.ratingDistribution;

  const dissatisfiedCount = (dist['1'] || 0) + (dist['2'] || 0);
  const neutralCount = dist['3'] || 0;
  const satisfiedCount = (dist['4'] || 0) + (dist['5'] || 0);

  return {
    window: analytics.window,
    summary: analytics.summary,
    satisfaction: {
      satisfied: {
        count: satisfiedCount,
        ratio: total ? round((satisfiedCount / total) * 100) : 0
      },
      neutral: {
        count: neutralCount,
        ratio: total ? round((neutralCount / total) * 100) : 0
      },
      dissatisfied: {
        count: dissatisfiedCount,
        ratio: total ? round((dissatisfiedCount / total) * 100) : 0
      },
      dimensions: analytics.satisfactionMetrics.dimensionAverages
    },
    distribution: analytics.satisfactionMetrics.ratingDistribution,
    categoryDistribution: analytics.satisfactionMetrics.categoryDistribution
  };
};

const syncLawyerRatingStats = async (lawyerId) => {
  const objectId = toObjectId(lawyerId);
  if (!objectId) return;

  const [feedbackAgg, fallbackAgg] = await Promise.all([
    Feedback.aggregate([
      {
        $match: {
          status: 'active',
          targetType: 'lawyer',
          lawyer: objectId
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          sum: { $sum: '$rating' }
        }
      }
    ]),
    Consultation.aggregate([
      {
        $match: {
          lawyer: objectId,
          status: 'completed',
          rating: { $exists: true, $ne: null }
        }
      },
      {
        $lookup: {
          from: 'feedbacks',
          localField: '_id',
          foreignField: 'consultation',
          as: 'linkedFeedback'
        }
      },
      {
        $match: {
          linkedFeedback: { $size: 0 }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          sum: { $sum: '$rating' }
        }
      }
    ])
  ]);

  const feedbackStats = feedbackAgg[0] || { total: 0, sum: 0 };
  const fallbackStats = fallbackAgg[0] || { total: 0, sum: 0 };

  const totalRatings = (feedbackStats.total || 0) + (fallbackStats.total || 0);
  const sumRatings = (feedbackStats.sum || 0) + (fallbackStats.sum || 0);
  const averageRating = totalRatings ? round(sumRatings / totalRatings) : 0;

  await Lawyer.findByIdAndUpdate(objectId, {
    averageRating,
    totalRatings
  });
};

const ensureFeedbackBackfilledFromConsultations = async ({ maxRecords = 1000 } = {}) => {
  const safeLimit = Math.min(Math.max(parseInt(maxRecords, 10) || 1000, 1), 5000);

  const rows = await Consultation.aggregate([
    {
      $match: {
        status: 'completed',
        rating: { $exists: true, $ne: null },
        user: { $ne: null },
        lawyer: { $ne: null }
      }
    },
    {
      $lookup: {
        from: 'feedbacks',
        localField: '_id',
        foreignField: 'consultation',
        as: 'feedbackMatch'
      }
    },
    {
      $match: {
        feedbackMatch: { $size: 0 }
      }
    },
    { $sort: { createdAt: -1 } },
    { $limit: safeLimit },
    {
      $project: {
        _id: 1,
        user: 1,
        lawyer: 1,
        rating: 1,
        review: 1,
        createdAt: 1,
        updatedAt: 1
      }
    }
  ]);

  if (!rows.length) return { inserted: 0 };

  await Feedback.bulkWrite(rows.map((row) => ({
    updateOne: {
      filter: {
        consultation: row._id,
        submittedByUser: row.user
      },
      update: {
        $setOnInsert: {
          consultation: row._id,
          submittedByUser: row.user,
          targetType: 'lawyer',
          lawyer: row.lawyer,
          rating: row.rating,
          comment: row.review || '',
          categories: ['consultation'],
          source: 'legacy_import',
          metadata: { channel: 'migration' },
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        }
      },
      upsert: true
    }
  })));

  return { inserted: rows.length };
};

const generateAndStoreFeedbackReport = async ({
  periodType,
  startDate,
  endDate,
  generatedBy = null,
  generationSource = 'system',
  force = false
}) => {
  if (!['weekly', 'monthly'].includes(periodType)) {
    throw new Error('Invalid period type. Use weekly or monthly');
  }

  const window = (startDate && endDate)
    ? { startDate: new Date(startDate), endDate: new Date(endDate) }
    : getCompletedPeriodRange(periodType);

  if (Number.isNaN(window.startDate.getTime()) || Number.isNaN(window.endDate.getTime())) {
    throw new Error('Invalid startDate/endDate for report generation');
  }

  await ensureFeedbackBackfilledFromConsultations();

  if (!force) {
    const existing = await FeedbackAnalyticsReport.findOne({
      periodType,
      periodStart: window.startDate,
      periodEnd: window.endDate
    });

    if (existing) {
      return { report: existing, created: false };
    }
  }

  const [platform, lawyerPerformance] = await Promise.all([
    getPlatformFeedbackAnalytics(window),
    getLawyerPerformanceAnalytics({ ...window, limit: 100 })
  ]);

  const reportPayload = {
    periodType,
    periodStart: window.startDate,
    periodEnd: window.endDate,
    generationSource,
    generatedBy: generatedBy || null,
    summary: platform.summary,
    satisfactionMetrics: platform.satisfactionMetrics,
    lawyerPerformance: lawyerPerformance.lawyers,
    metadata: {
      notes: `Auto-generated ${periodType} report`
    }
  };

  const report = await FeedbackAnalyticsReport.findOneAndUpdate(
    {
      periodType,
      periodStart: window.startDate,
      periodEnd: window.endDate
    },
    reportPayload,
    { upsert: true, new: true }
  );

  return { report, created: true };
};

module.exports = {
  getDateRangeFromQuery,
  getCompletedPeriodRange,
  getPlatformFeedbackAnalytics,
  getLawyerPerformanceAnalytics,
  getUserSatisfactionMetrics,
  generateAndStoreFeedbackReport,
  ensureFeedbackBackfilledFromConsultations,
  syncLawyerRatingStats
};
