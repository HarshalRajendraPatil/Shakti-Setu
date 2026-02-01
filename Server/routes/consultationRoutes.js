const express = require('express');
const router = express.Router();
const {
  createConsultation,
  getUserConsultations,
  getLawyerConsultations,
  updateConsultationStatus,
  addRating,
  getLawyerById,
  cancelConsultation
} = require('../controller/consultationController');
const { getMessages, sendMessage } = require('../controller/chatController');
const { authMiddleware } = require('../middleware/authMiddleware');
const lawyerAuthMiddleware = require('../middleware/lawyerAuthMiddleware');
const chatAuthMiddleware = require('../middleware/chatAuthMiddleware');

// Public routes
router.get('/lawyer/:lawyerId', getLawyerById);

// User routes
router.post('/', authMiddleware, createConsultation);
router.get('/user', authMiddleware, getUserConsultations);
router.post('/:consultationId/rating', authMiddleware, addRating);
router.put('/:consultationId/cancel', authMiddleware, cancelConsultation);

// Lawyer routes
router.get('/lawyer', lawyerAuthMiddleware, getLawyerConsultations);
router.put('/:consultationId/status', lawyerAuthMiddleware, updateConsultationStatus);

// Chat (user or lawyer – chatAuthMiddleware accepts both tokens)
router.get('/:consultationId/messages', chatAuthMiddleware, getMessages);
router.post('/:consultationId/messages', chatAuthMiddleware, sendMessage);

module.exports = router;
