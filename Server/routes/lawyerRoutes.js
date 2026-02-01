const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  getApprovedLawyers,
  getPendingLawyers,
  updateLawyerStatus,
  updateProfile,
  getLawyerStats
} = require('../controller/lawyerController');
const lawyerAuthMiddleware = require('../middleware/lawyerAuthMiddleware');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/approved', getApprovedLawyers); // Public - users can see approved lawyers

// Lawyer protected routes
router.get('/me', lawyerAuthMiddleware, getMe);
router.put('/profile', lawyerAuthMiddleware, updateProfile);
router.get('/stats', lawyerAuthMiddleware, getLawyerStats);

// Admin routes
router.get('/pending', authMiddleware, adminMiddleware, getPendingLawyers);
router.put('/:lawyerId/status', authMiddleware, adminMiddleware, updateLawyerStatus);

module.exports = router;
