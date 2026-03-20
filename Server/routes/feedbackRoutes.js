const express = require('express');
const router = express.Router();

const {
  createFeedback,
  updateMyFeedback,
  deleteMyFeedback,
  getMyFeedback,
  getLawyerPublicFeedbackSummary,
  getMyLawyerPerformance,
  getPlatformAnalytics,
  getLawyerPerformanceAnalytics,
  getSatisfactionMetrics,
  generatePeriodicReport,
  listPeriodicReports,
  getLatestPeriodicReport
} = require('../controller/feedbackController');

const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const lawyerAuthMiddleware = require('../middleware/lawyerAuthMiddleware');

// Public endpoints
router.get('/lawyer/:lawyerId/summary', getLawyerPublicFeedbackSummary);

// User endpoints
router.post('/', authMiddleware, createFeedback);
router.get('/my', authMiddleware, getMyFeedback);
router.put('/my/:feedbackId', authMiddleware, updateMyFeedback);
router.delete('/my/:feedbackId', authMiddleware, deleteMyFeedback);

// Lawyer endpoints
router.get('/lawyer/me/performance', lawyerAuthMiddleware, getMyLawyerPerformance);

// Admin endpoints
router.get('/analytics/platform', authMiddleware, adminMiddleware, getPlatformAnalytics);
router.get('/analytics/lawyers', authMiddleware, adminMiddleware, getLawyerPerformanceAnalytics);
router.get('/analytics/satisfaction', authMiddleware, adminMiddleware, getSatisfactionMetrics);
router.post('/reports/generate', authMiddleware, adminMiddleware, generatePeriodicReport);
router.get('/reports', authMiddleware, adminMiddleware, listPeriodicReports);
router.get('/reports/latest/:periodType', authMiddleware, adminMiddleware, getLatestPeriodicReport);

module.exports = router;
