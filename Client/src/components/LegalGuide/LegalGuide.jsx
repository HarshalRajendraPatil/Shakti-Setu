import { useEffect, useState, useContext } from 'react';
import { articlesAPI } from '../../services/api';
import { AppContext } from '../../context/AppContext';
import GlassCard from '../common/GlassCard';
import { BookOpen, FileText, Calendar, ThumbsUp, ThumbsDown, ExternalLink, Eye } from 'lucide-react';
import { ARTICLE_CATEGORIES } from '../../constants/articleCategories';
import { useSelector } from 'react-redux';

const PREVIEW_LENGTH = 200;

function getArticleUrl(articleId) {
  const origin = window.location.origin;
  const path = window.location.pathname || '/';
  return `${origin}${path}?articleId=${encodeURIComponent(articleId)}`;
}

const LegalGuide = () => {
  const { language } = useContext(AppContext);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [reactionLoading, setReactionLoading] = useState({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = selectedCategory ? { category: selectedCategory } : {};
    articlesAPI
      .getArticles(params)
      .then((res) => {
        if (!cancelled) setArticles(res.data.articles || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Failed to load articles');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedCategory]);

  const handleLike = async (e, articleId) => {
    e.stopPropagation();
    if (!isAuthenticated) return;
    setReactionLoading((prev) => ({ ...prev, [articleId]: true }));
    try {
      await articlesAPI.like(articleId);
      const res = await articlesAPI.getArticles(selectedCategory ? { category: selectedCategory } : {});
      setArticles(res.data.articles || []);
    } catch (err) {
      // ignore
    } finally {
      setReactionLoading((prev) => ({ ...prev, [articleId]: false }));
    }
  };

  const handleDislike = async (e, articleId) => {
    e.stopPropagation();
    if (!isAuthenticated) return;
    setReactionLoading((prev) => ({ ...prev, [articleId]: true }));
    try {
      await articlesAPI.dislike(articleId);
      const res = await articlesAPI.getArticles(selectedCategory ? { category: selectedCategory } : {});
      setArticles(res.data.articles || []);
    } catch (err) {
      // ignore
    } finally {
      setReactionLoading((prev) => ({ ...prev, [articleId]: false }));
    }
  };

  const openInNewWindow = (articleId) => {
    window.open(getArticleUrl(articleId), '_blank', 'noopener,noreferrer');
  };

  const isHi = language === 'hi';

  return (
    <div className="page-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
          <BookOpen size={28} color="#a855f7" />
          {isHi ? 'अपने अधिकार जानें' : 'Know Your Rights'}
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          {isHi
            ? 'सरल भाषा में कानूनी जानकारी पढ़ें। किसी वकील से परामर्श लेने से पहले अपने अधिकारों को समझें।'
            : 'Read legal information in simple language. Understand your rights before consulting a lawyer.'}
        </p>
      </div>

      <GlassCard style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {isHi ? 'श्रेणी' : 'Category'}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={() => setSelectedCategory('')}
            style={{
              padding: '8px 16px',
              background: selectedCategory === '' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(0,0,0,0.2)',
              border: `1px solid ${selectedCategory === '' ? '#a855f7' : 'var(--border-color)'}`,
              borderRadius: '8px',
              color: selectedCategory === '' ? '#a855f7' : 'inherit',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            {isHi ? 'सभी' : 'All'}
          </button>
          {ARTICLE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '8px 16px',
                background: selectedCategory === cat ? 'rgba(168, 85, 247, 0.2)' : 'rgba(0,0,0,0.2)',
                border: `1px solid ${selectedCategory === cat ? '#a855f7' : 'var(--border-color)'}`,
                borderRadius: '8px',
                color: selectedCategory === cat ? '#a855f7' : 'inherit',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </GlassCard>

      {loading ? (
        <div className="center-content" style={{ padding: '2rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>{isHi ? 'लोड हो रहा है...' : 'Loading...'}</p>
        </div>
      ) : error ? (
        <GlassCard style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>{error}</p>
        </GlassCard>
      ) : articles.length === 0 ? (
        <GlassCard style={{ textAlign: 'center', padding: '2rem' }}>
          <FileText size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>
            {isHi ? 'इस श्रेणी में अभी कोई लेख नहीं है।' : 'No articles in this category yet.'}
          </p>
        </GlassCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {articles.map((art) => {
            const preview = art.excerpt
              ? (art.excerpt.length > PREVIEW_LENGTH ? art.excerpt.slice(0, PREVIEW_LENGTH) + '...' : art.excerpt)
              : (art.preview || (art.content || '').slice(0, PREVIEW_LENGTH) + '...');
            const loadingReaction = reactionLoading[art._id];
            return (
              <GlassCard key={art._id} style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        background: 'rgba(168, 85, 247, 0.15)',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        color: '#a855f7',
                        marginBottom: '0.5rem'
                      }}
                    >
                      {art.category}
                    </span>
                    <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>{art.title}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1rem' }}>
                      {preview}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <Eye size={14} />
                        {art.readCount ?? 0} reads
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <ThumbsUp size={14} />
                        {art.likeCount ?? 0}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <ThumbsDown size={14} />
                        {art.dislikeCount ?? 0}
                      </span>
                      {isAuthenticated && (
                        <span style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={(e) => handleLike(e, art._id)}
                            disabled={loadingReaction}
                            style={{
                              padding: '6px 12px',
                              background: art.myReaction === 'like' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(0,0,0,0.2)',
                              border: `1px solid ${art.myReaction === 'like' ? '#22c55e' : 'var(--border-color)'}`,
                              borderRadius: '8px',
                              color: art.myReaction === 'like' ? '#22c55e' : 'var(--text-muted)',
                              cursor: loadingReaction ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.85rem'
                            }}
                          >
                            <ThumbsUp size={14} /> Like
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDislike(e, art._id)}
                            disabled={loadingReaction}
                            style={{
                              padding: '6px 12px',
                              background: art.myReaction === 'dislike' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(0,0,0,0.2)',
                              border: `1px solid ${art.myReaction === 'dislike' ? '#ef4444' : 'var(--border-color)'}`,
                              borderRadius: '8px',
                              color: art.myReaction === 'dislike' ? '#ef4444' : 'var(--text-muted)',
                              cursor: loadingReaction ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.85rem'
                            }}
                          >
                            <ThumbsDown size={14} /> Dislike
                          </button>
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => openInNewWindow(art._id)}
                        style={{
                          padding: '8px 16px',
                          background: 'rgba(168, 85, 247, 0.2)',
                          border: '1px solid #a855f7',
                          borderRadius: '8px',
                          color: '#a855f7',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.9rem'
                        }}
                      >
                        Read more <ExternalLink size={16} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                    <Calendar size={14} />
                    {new Date(art.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LegalGuide;
export { getArticleUrl };
