const express = require('express');
const router = express.Router();
const {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  incrementReadCount,
  likeArticle,
  dislikeArticle
} = require('../controller/articleController');
const { authMiddleware, adminMiddleware, optionalAuthMiddleware } = require('../middleware/authMiddleware');

// Public routes (optional auth for myReaction)
router.get('/', optionalAuthMiddleware, getArticles);
router.get('/:id', optionalAuthMiddleware, getArticleById);

// Read count (no auth)
router.post('/:id/read', incrementReadCount);

// User reactions (auth required)
router.post('/:id/like', authMiddleware, likeArticle);
router.post('/:id/dislike', authMiddleware, dislikeArticle);

// Admin-only routes
router.post('/', authMiddleware, adminMiddleware, createArticle);
router.put('/:id', authMiddleware, adminMiddleware, updateArticle);
router.delete('/:id', authMiddleware, adminMiddleware, deleteArticle);

module.exports = router;
