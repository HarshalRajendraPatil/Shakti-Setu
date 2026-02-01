import { useEffect, useState, useContext } from 'react';
import { articlesAPI } from '../../services/api';
import { AppContext } from '../../context/AppContext';
import GlassCard from '../common/GlassCard';
import { ThumbsUp, ThumbsDown, Eye } from 'lucide-react';
import { useSelector } from 'react-redux';

const ArticleView = () => {
  const { openArticleId, language } = useContext(AppContext);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reactionLoading, setReactionLoading] = useState(false);

  useEffect(() => {
    if (!openArticleId) {
      setArticle(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    articlesAPI
      .getArticleById(openArticleId)
      .then((res) => {
        if (!cancelled) setArticle(res.data.article);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [openArticleId]);

  useEffect(() => {
    if (!article?._id) return;
    articlesAPI.incrementReadCount(article._id).catch(() => {});
  }, [article?._id]);

  const handleLike = async () => {
    if (!isAuthenticated || !article?._id) return;
    setReactionLoading(true);
    try {
      await articlesAPI.like(article._id);
      const res = await articlesAPI.getArticleById(article._id);
      setArticle(res.data.article);
    } catch (err) {}
    setReactionLoading(false);
  };

  const handleDislike = async () => {
    if (!isAuthenticated || !article?._id) return;
    setReactionLoading(true);
    try {
      await articlesAPI.dislike(article._id);
      const res = await articlesAPI.getArticleById(article._id);
      setArticle(res.data.article);
    } catch (err) {}
    setReactionLoading(false);
  };

  const isHi = language === 'hi';

  if (!openArticleId) {
    return (
      <div className="page-container center-content">
        <GlassCard style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No article selected.</p>
        </GlassCard>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container center-content">
        <p style={{ color: 'var(--text-muted)' }}>{isHi ? 'लेख लोड हो रहा है...' : 'Loading article...'}</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="page-container center-content">
        <GlassCard style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Article not found.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <GlassCard style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <span
            style={{
              padding: '6px 12px',
              background: 'rgba(168, 85, 247, 0.2)',
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: '#a855f7'
            }}
          >
            {article.category}
          </span>
        </div>
        <h1 style={{ marginBottom: '1rem', fontSize: '1.75rem' }}>{article.title}</h1>
        {article.excerpt && (
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '1rem' }}>{article.excerpt}</p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Eye size={18} />
            {article.readCount ?? 0} reads
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ThumbsUp size={18} />
            {article.likeCount ?? 0} likes
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ThumbsDown size={18} />
            {article.dislikeCount ?? 0} dislikes
          </span>
          {isAuthenticated && (
            <span style={{ display: 'inline-flex', gap: '8px', marginLeft: 'auto' }}>
              <button
                type="button"
                onClick={handleLike}
                disabled={reactionLoading}
                style={{
                  padding: '8px 16px',
                  background: article.myReaction === 'like' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${article.myReaction === 'like' ? '#22c55e' : 'var(--border-color)'}`,
                  borderRadius: '8px',
                  color: article.myReaction === 'like' ? '#22c55e' : 'inherit',
                  cursor: reactionLoading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.9rem'
                }}
              >
                <ThumbsUp size={18} /> Like
              </button>
              <button
                type="button"
                onClick={handleDislike}
                disabled={reactionLoading}
                style={{
                  padding: '8px 16px',
                  background: article.myReaction === 'dislike' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${article.myReaction === 'dislike' ? '#ef4444' : 'var(--border-color)'}`,
                  borderRadius: '8px',
                  color: article.myReaction === 'dislike' ? '#ef4444' : 'inherit',
                  cursor: reactionLoading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.9rem'
                }}
              >
                <ThumbsDown size={18} /> Dislike
              </button>
            </span>
          )}
        </div>
        <div
          style={{
            lineHeight: 1.8,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {article.content}
        </div>
        <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {isHi
            ? 'यह जानकारी कानूनी सलाह नहीं है। अपनी स्थिति के लिए किसी वकील से परामर्श करें।'
            : 'This information is not legal advice. Consult a lawyer for your situation.'}
        </p>
      </GlassCard>
    </div>
  );
};

export default ArticleView;
