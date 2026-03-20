const express = require('express');
const router = express.Router();

const {
  createPost,
  listPosts,
  getPostById,
  listPostComments,
  createComment,
  reactToPost,
  reactToComment,
  deletePost,
  deleteComment
} = require('../controller/communityController');

const { authMiddleware, optionalAuthMiddleware } = require('../middleware/authMiddleware');

// Public read endpoints (attach user if token exists)
router.get('/posts', optionalAuthMiddleware, listPosts);
router.get('/posts/:postId', optionalAuthMiddleware, getPostById);
router.get('/posts/:postId/comments', optionalAuthMiddleware, listPostComments);

// Authenticated write endpoints
router.post('/posts', authMiddleware, createPost);
router.delete('/posts/:postId', authMiddleware, deletePost);
router.post('/posts/:postId/comments', authMiddleware, createComment);
router.delete('/comments/:commentId', authMiddleware, deleteComment);
router.post('/posts/:postId/reactions', authMiddleware, reactToPost);
router.post('/comments/:commentId/reactions', authMiddleware, reactToComment);

module.exports = router;
