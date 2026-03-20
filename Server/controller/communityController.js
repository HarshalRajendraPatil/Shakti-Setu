const mongoose = require('mongoose');
const CommunityPost = require('../models/CommunityPost');
const CommunityComment = require('../models/CommunityComment');
const CommunityPostReaction = require('../models/CommunityPostReaction');
const CommunityCommentReaction = require('../models/CommunityCommentReaction');

const VALID_REACTIONS = ['support', 'helpful', 'care'];

const toSafePage = (value, fallback = 1) => Math.max(parseInt(value, 10) || fallback, 1);
const toSafeLimit = (value, fallback = 20, max = 100) => Math.min(Math.max(parseInt(value, 10) || fallback, 1), max);

const sanitizeTags = (rawTags) => {
  if (!rawTags) return [];
  const tags = Array.isArray(rawTags) ? rawTags : String(rawTags).split(',');
  return [...new Set(tags
    .map((tag) => String(tag).trim().toLowerCase())
    .filter(Boolean)
    .map((tag) => tag.slice(0, 40))
  )].slice(0, 8);
};

const safeRegex = (rawText = '') => {
  return String(rawText).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const validateObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const assertActiveAccount = (req, res) => {
  if (req.user?.isSuspended) {
    res.status(403).json({ message: 'Your account is suspended and cannot use community features' });
    return false;
  }
  return true;
};

const canSeeIdentity = ({ authorId, isAnonymous, requesterId, isAdmin }) => {
  if (!isAnonymous) return true;
  if (!requesterId) return false;
  if (isAdmin) return true;
  return String(authorId) === String(requesterId);
};

const serializeAuthor = ({ author, isAnonymous, requesterId, isAdmin }) => {
  if (!author) {
    return { name: 'Anonymous', isAnonymous: true };
  }

  const reveal = canSeeIdentity({
    authorId: author._id,
    isAnonymous,
    requesterId,
    isAdmin
  });

  if (!reveal) {
    return { name: 'Anonymous', isAnonymous: true };
  }

  return {
    id: author._id,
    name: author.name,
    state: author.state,
    isAnonymous: !!isAnonymous
  };
};

const serializePost = ({ post, requesterId, isAdmin, userReaction = null }) => ({
  id: post._id,
  content: post.content,
  tags: post.tags,
  status: post.status,
  isAnonymous: post.isAnonymous,
  commentsCount: post.commentsCount,
  reactionsSummary: post.reactionsSummary || { support: 0, helpful: 0, care: 0, total: 0 },
  userReaction,
  lastActivityAt: post.lastActivityAt,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
  author: serializeAuthor({
    author: post.author,
    isAnonymous: post.isAnonymous,
    requesterId,
    isAdmin
  })
});

const serializeComment = ({ comment, requesterId, isAdmin, userReaction = null }) => ({
  id: comment._id,
  post: comment.post,
  content: comment.content,
  status: comment.status,
  isAnonymous: comment.isAnonymous,
  reactionsSummary: comment.reactionsSummary || { support: 0, helpful: 0, care: 0, total: 0 },
  userReaction,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
  author: serializeAuthor({
    author: comment.author,
    isAnonymous: comment.isAnonymous,
    requesterId,
    isAdmin
  })
});

const recalcPostReactionSummary = async (postId) => {
  const aggregate = await CommunityPostReaction.aggregate([
    { $match: { post: postId } },
    {
      $group: {
        _id: '$reactionType',
        count: { $sum: 1 }
      }
    }
  ]);

  const summary = { support: 0, helpful: 0, care: 0, total: 0 };
  aggregate.forEach((row) => {
    if (VALID_REACTIONS.includes(row._id)) {
      summary[row._id] = row.count;
      summary.total += row.count;
    }
  });

  await CommunityPost.findByIdAndUpdate(postId, { reactionsSummary: summary });
  return summary;
};

const recalcCommentReactionSummary = async (commentId) => {
  const aggregate = await CommunityCommentReaction.aggregate([
    { $match: { comment: commentId } },
    {
      $group: {
        _id: '$reactionType',
        count: { $sum: 1 }
      }
    }
  ]);

  const summary = { support: 0, helpful: 0, care: 0, total: 0 };
  aggregate.forEach((row) => {
    if (VALID_REACTIONS.includes(row._id)) {
      summary[row._id] = row.count;
      summary.total += row.count;
    }
  });

  await CommunityComment.findByIdAndUpdate(commentId, { reactionsSummary: summary });
  return summary;
};

const getUserPostReactionMap = async (requesterId, postIds = []) => {
  if (!requesterId || postIds.length === 0) return new Map();

  const reactions = await CommunityPostReaction.find({
    user: requesterId,
    post: { $in: postIds }
  }).select('post reactionType');

  return new Map(reactions.map((item) => [String(item.post), item.reactionType]));
};

const getUserCommentReactionMap = async (requesterId, commentIds = []) => {
  if (!requesterId || commentIds.length === 0) return new Map();

  const reactions = await CommunityCommentReaction.find({
    user: requesterId,
    comment: { $in: commentIds }
  }).select('comment reactionType');

  return new Map(reactions.map((item) => [String(item.comment), item.reactionType]));
};

exports.createPost = async (req, res) => {
  try {
    if (!assertActiveAccount(req, res)) return;

    const { content, isAnonymous = true, tags } = req.body;

    if (!content || !String(content).trim()) {
      return res.status(400).json({ message: 'Post content is required' });
    }

    const safeContent = String(content).trim();
    if (safeContent.length < 3 || safeContent.length > 3000) {
      return res.status(400).json({ message: 'Post content must be between 3 and 3000 characters' });
    }

    const post = new CommunityPost({
      author: req.user.id,
      content: safeContent,
      isAnonymous: isAnonymous === true,
      tags: sanitizeTags(tags),
      lastActivityAt: new Date()
    });

    await post.save();
    await post.populate('author', 'name state');

    const isAdmin = req.user.role === 'admin';
    res.status(201).json({
      success: true,
      message: 'Community post created successfully',
      post: serializePost({
        post,
        requesterId: req.user.id,
        isAdmin,
        userReaction: null
      })
    });
  } catch (error) {
    console.error('Community createPost error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.listPosts = async (req, res) => {
  try {
    const page = toSafePage(req.query.page, 1);
    const limit = toSafeLimit(req.query.limit, 20, 100);
    const skip = (page - 1) * limit;

    const query = { status: 'active' };

    if (req.query.tag) query.tags = { $in: [String(req.query.tag).trim().toLowerCase()] };
    if (req.query.search && String(req.query.search).trim()) {
      query.content = { $regex: safeRegex(String(req.query.search).trim()), $options: 'i' };
    }

    let sort = { createdAt: -1 };
    if (req.query.sortBy === 'active') sort = { lastActivityAt: -1, createdAt: -1 };
    if (req.query.sortBy === 'top') sort = { 'reactionsSummary.total': -1, commentsCount: -1, createdAt: -1 };

    const [posts, total] = await Promise.all([
      CommunityPost.find(query)
        .populate('author', 'name state')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      CommunityPost.countDocuments(query)
    ]);

    const requesterId = req.user?.id || null;
    const isAdmin = req.user?.role === 'admin';

    const reactionMap = await getUserPostReactionMap(
      requesterId,
      posts.map((post) => post._id)
    );

    res.json({
      success: true,
      page,
      limit,
      total,
      count: posts.length,
      posts: posts.map((post) => serializePost({
        post,
        requesterId,
        isAdmin,
        userReaction: reactionMap.get(String(post._id)) || null
      }))
    });
  } catch (error) {
    console.error('Community listPosts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const { postId } = req.params;
    if (!validateObjectId(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await CommunityPost.findOne({ _id: postId, status: 'active' })
      .populate('author', 'name state');

    if (!post) return res.status(404).json({ message: 'Post not found' });

    const page = toSafePage(req.query.page, 1);
    const limit = toSafeLimit(req.query.limit, 20, 100);
    const skip = (page - 1) * limit;

    const [comments, totalComments] = await Promise.all([
      CommunityComment.find({ post: postId, status: 'active' })
        .populate('author', 'name state')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit),
      CommunityComment.countDocuments({ post: postId, status: 'active' })
    ]);

    const requesterId = req.user?.id || null;
    const isAdmin = req.user?.role === 'admin';

    const [postReactionMap, commentReactionMap] = await Promise.all([
      getUserPostReactionMap(requesterId, [post._id]),
      getUserCommentReactionMap(requesterId, comments.map((item) => item._id))
    ]);

    res.json({
      success: true,
      post: serializePost({
        post,
        requesterId,
        isAdmin,
        userReaction: postReactionMap.get(String(post._id)) || null
      }),
      comments: comments.map((comment) => serializeComment({
        comment,
        requesterId,
        isAdmin,
        userReaction: commentReactionMap.get(String(comment._id)) || null
      })),
      commentsPage: page,
      commentsLimit: limit,
      commentsTotal: totalComments
    });
  } catch (error) {
    console.error('Community getPostById error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.listPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    if (!validateObjectId(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await CommunityPost.findOne({ _id: postId, status: 'active' }).select('_id');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const page = toSafePage(req.query.page, 1);
    const limit = toSafeLimit(req.query.limit, 20, 100);
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      CommunityComment.find({ post: postId, status: 'active' })
        .populate('author', 'name state')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit),
      CommunityComment.countDocuments({ post: postId, status: 'active' })
    ]);

    const requesterId = req.user?.id || null;
    const isAdmin = req.user?.role === 'admin';

    const reactionMap = await getUserCommentReactionMap(
      requesterId,
      comments.map((item) => item._id)
    );

    res.json({
      success: true,
      page,
      limit,
      total,
      count: comments.length,
      comments: comments.map((comment) => serializeComment({
        comment,
        requesterId,
        isAdmin,
        userReaction: reactionMap.get(String(comment._id)) || null
      }))
    });
  } catch (error) {
    console.error('Community listPostComments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createComment = async (req, res) => {
  try {
    if (!assertActiveAccount(req, res)) return;

    const { postId } = req.params;
    if (!validateObjectId(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    const { content, isAnonymous = false } = req.body;

    if (!content || !String(content).trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const safeContent = String(content).trim();
    if (safeContent.length > 1500) {
      return res.status(400).json({ message: 'Comment is too long. Maximum 1500 characters' });
    }

    const post = await CommunityPost.findOne({ _id: postId, status: 'active' }).select('_id commentsCount');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = new CommunityComment({
      post: postId,
      author: req.user.id,
      content: safeContent,
      isAnonymous: isAnonymous === true
    });

    await comment.save();
    await comment.populate('author', 'name state');

    await CommunityPost.findByIdAndUpdate(postId, {
      $inc: { commentsCount: 1 },
      $set: { lastActivityAt: new Date() }
    });

    const isAdmin = req.user.role === 'admin';

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: serializeComment({
        comment,
        requesterId: req.user.id,
        isAdmin,
        userReaction: null
      })
    });
  } catch (error) {
    console.error('Community createComment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.reactToPost = async (req, res) => {
  try {
    if (!assertActiveAccount(req, res)) return;

    const { postId } = req.params;
    if (!validateObjectId(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    const { reactionType } = req.body;

    if (!VALID_REACTIONS.includes(reactionType)) {
      return res.status(400).json({ message: `Invalid reactionType. Use one of: ${VALID_REACTIONS.join(', ')}` });
    }

    const post = await CommunityPost.findOne({ _id: postId, status: 'active' }).select('_id');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const existing = await CommunityPostReaction.findOne({ user: req.user.id, post: postId });

    let userReaction = reactionType;
    if (!existing) {
      await CommunityPostReaction.create({ user: req.user.id, post: postId, reactionType });
    } else if (existing.reactionType === reactionType) {
      await existing.deleteOne();
      userReaction = null;
    } else {
      existing.reactionType = reactionType;
      await existing.save();
    }

    const summary = await recalcPostReactionSummary(post._id);
    await CommunityPost.findByIdAndUpdate(postId, { $set: { lastActivityAt: new Date() } });

    res.json({
      success: true,
      message: userReaction ? 'Reaction updated' : 'Reaction removed',
      userReaction,
      reactionsSummary: summary
    });
  } catch (error) {
    console.error('Community reactToPost error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.reactToComment = async (req, res) => {
  try {
    if (!assertActiveAccount(req, res)) return;

    const { commentId } = req.params;
    if (!validateObjectId(commentId)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }
    const { reactionType } = req.body;

    if (!VALID_REACTIONS.includes(reactionType)) {
      return res.status(400).json({ message: `Invalid reactionType. Use one of: ${VALID_REACTIONS.join(', ')}` });
    }

    const comment = await CommunityComment.findOne({ _id: commentId, status: 'active' }).select('_id post');
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const existing = await CommunityCommentReaction.findOne({ user: req.user.id, comment: commentId });

    let userReaction = reactionType;
    if (!existing) {
      await CommunityCommentReaction.create({ user: req.user.id, comment: commentId, reactionType });
    } else if (existing.reactionType === reactionType) {
      await existing.deleteOne();
      userReaction = null;
    } else {
      existing.reactionType = reactionType;
      await existing.save();
    }

    const summary = await recalcCommentReactionSummary(comment._id);
    await CommunityPost.findByIdAndUpdate(comment.post, { $set: { lastActivityAt: new Date() } });

    res.json({
      success: true,
      message: userReaction ? 'Reaction updated' : 'Reaction removed',
      userReaction,
      reactionsSummary: summary
    });
  } catch (error) {
    console.error('Community reactToComment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    if (!validateObjectId(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await CommunityPost.findOne({ _id: postId, status: 'active' });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const isOwner = String(post.author) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only delete your own post' });
    }

    post.status = 'deleted';
    post.content = '[deleted]';
    post.tags = [];
    await post.save();

    await CommunityComment.updateMany(
      { post: post._id, status: 'active' },
      { $set: { status: 'deleted', content: '[deleted]' } }
    );

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Community deletePost error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    if (!validateObjectId(commentId)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }

    const comment = await CommunityComment.findOne({ _id: commentId, status: 'active' });
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const isOwner = String(comment.author) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only delete your own comment' });
    }

    comment.status = 'deleted';
    comment.content = '[deleted]';
    await comment.save();

    const post = await CommunityPost.findById(comment.post).select('commentsCount');
    if (post) {
      post.commentsCount = Math.max((post.commentsCount || 0) - 1, 0);
      post.lastActivityAt = new Date();
      await post.save();
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Community deleteComment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
