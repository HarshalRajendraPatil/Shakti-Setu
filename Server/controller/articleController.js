const Article = require('../models/Article');
const ArticleReaction = require('../models/ArticleReaction');

// Public: get all articles (optional filter by category); optional auth for myReaction
exports.getArticles = async (req, res) => {
  try {
    const { category, language } = req.query;
    const query = {};
    if (category) query.category = category;
    if (language) query.language = language;

    const articles = await Article.find(query)
      .sort({ createdAt: -1 })
      .select('title slug category excerpt content language createdAt readCount likeCount dislikeCount');

    let reactionsMap = {};
    if (req.user && articles.length > 0) {
      const articleIds = articles.map((a) => a._id);
      const reactions = await ArticleReaction.find({
        user: req.user.id,
        article: { $in: articleIds }
      }).select('article action');
      reactions.forEach((r) => {
        reactionsMap[r.article.toString()] = r.action;
      });
    }

    const list = articles.map((a) => {
      const doc = a.toObject();
      doc.myReaction = reactionsMap[a._id.toString()] || null;
      if (doc.content) doc.preview = doc.content.slice(0, 200);
      delete doc.content;
      return doc;
    });

    res.json({
      success: true,
      count: list.length,
      articles: list
    });
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Public: get single article by id or slug; optional auth for myReaction
exports.getArticleById = async (req, res) => {
  try {
    const { id } = req.params;
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    const article = isMongoId
      ? await Article.findById(id)
      : await Article.findOne({ slug: id });

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    let myReaction = null;
    if (req.user) {
      const r = await ArticleReaction.findOne({
        user: req.user.id,
        article: article._id
      });
      if (r) myReaction = r.action;
    }

    const out = article.toObject();
    out.myReaction = myReaction;

    res.json({
      success: true,
      article: out
    });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: create article
exports.createArticle = async (req, res) => {
  try {
    const { title, slug, category, excerpt, content, language } = req.body;
    if (!title || !category || !content) {
      return res.status(400).json({ message: 'Title, category and content are required' });
    }

    const finalSlug = slug && slug.trim() ? slug.trim().toLowerCase().replace(/\s+/g, '-') : title.trim().toLowerCase().replace(/\s+/g, '-');
    const existing = await Article.findOne({ slug: finalSlug });
    if (existing) {
      return res.status(400).json({ message: 'An article with this slug already exists' });
    }

    const article = new Article({
      title: title.trim(),
      slug: finalSlug,
      category: category.trim(),
      excerpt: (excerpt || '').trim(),
      content: content.trim(),
      language: (language || 'en').trim(),
      createdBy: req.user.id
    });

    await article.save();

    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      article
    });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: update article
exports.updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, category, excerpt, content, language } = req.body;

    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    if (title) article.title = title.trim();
    if (category) article.category = category.trim();
    if (excerpt !== undefined) article.excerpt = (excerpt || '').trim();
    if (content) article.content = content.trim();
    if (language) article.language = language.trim();

    if (slug && slug.trim()) {
      const newSlug = slug.trim().toLowerCase().replace(/\s+/g, '-');
      if (newSlug !== article.slug) {
        const existing = await Article.findOne({ slug: newSlug });
        if (existing) {
          return res.status(400).json({ message: 'An article with this slug already exists' });
        }
        article.slug = newSlug;
      }
    }

    await article.save();

    res.json({
      success: true,
      message: 'Article updated successfully',
      article
    });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: delete article
exports.deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await Article.findByIdAndDelete(id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    await ArticleReaction.deleteMany({ article: id });
    res.json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

async function updateArticleCounts(articleId) {
  const [likeCount, dislikeCount] = await Promise.all([
    ArticleReaction.countDocuments({ article: articleId, action: 'like' }),
    ArticleReaction.countDocuments({ article: articleId, action: 'dislike' })
  ]);
  await Article.findByIdAndUpdate(articleId, { likeCount, dislikeCount });
}

// Public: increment read count (optional query ?increment=1)
exports.incrementReadCount = async (req, res) => {
  try {
    const { id } = req.params;
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    const article = isMongoId
      ? await Article.findById(id)
      : await Article.findOne({ slug: id });
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    article.readCount = (article.readCount || 0) + 1;
    await article.save();
    res.json({ success: true, readCount: article.readCount });
  } catch (error) {
    console.error('Increment read count error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// User: like article (one reaction per user: like or dislike)
exports.likeArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await Article.findById(id);
    if (!article) return res.status(404).json({ message: 'Article not found' });

    const existing = await ArticleReaction.findOne({
      user: req.user.id,
      article: id
    });
    if (existing) {
      existing.action = 'like';
      await existing.save();
    } else {
      await ArticleReaction.create({
        user: req.user.id,
        article: id,
        action: 'like'
      });
    }
    await updateArticleCounts(id);
    const updated = await Article.findById(id).select('likeCount dislikeCount');
    res.json({
      success: true,
      likeCount: updated.likeCount,
      dislikeCount: updated.dislikeCount,
      myReaction: 'like'
    });
  } catch (error) {
    console.error('Like article error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// User: dislike article
exports.dislikeArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await Article.findById(id);
    if (!article) return res.status(404).json({ message: 'Article not found' });

    const existing = await ArticleReaction.findOne({
      user: req.user.id,
      article: id
    });
    if (existing) {
      existing.action = 'dislike';
      await existing.save();
    } else {
      await ArticleReaction.create({
        user: req.user.id,
        article: id,
        action: 'dislike'
      });
    }
    await updateArticleCounts(id);
    const updated = await Article.findById(id).select('likeCount dislikeCount');
    res.json({
      success: true,
      likeCount: updated.likeCount,
      dislikeCount: updated.dislikeCount,
      myReaction: 'dislike'
    });
  } catch (error) {
    console.error('Dislike article error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
