import { useEffect, useMemo, useState, useContext } from 'react';
import { useSelector } from 'react-redux';
import {
  MessageCircle,
  Send,
  Search,
  RefreshCw,
  HeartHandshake,
  Lightbulb,
  HandHeart,
  UserCircle2,
  Lock,
  Trash2,
  ChevronLeft,
  PlusCircle,
} from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import GlassCard from '../common/GlassCard';
import { communityAPI } from '../../services/api';

const REACTIONS = [
  { type: 'support', label: 'Support', icon: HeartHandshake, color: '#22c55e' },
  { type: 'helpful', label: 'Helpful', icon: Lightbulb, color: '#f59e0b' },
  { type: 'care', label: 'Care', icon: HandHeart, color: '#ec4899' },
];

const safeDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};

const trimText = (text, max = 220) => {
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
};

const CommunitySupport = () => {
  const { setPage } = useContext(AppContext);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { isAuthenticated: isLawyerAuthenticated } = useSelector((state) => state.lawyer);

  const canWrite = isAuthenticated && !isLawyerAuthenticated;

  const [posts, setPosts] = useState([]);
  const [postsPage, setPostsPage] = useState(1);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsLoading, setPostsLoading] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [tagText, setTagText] = useState('');
  const [sortBy, setSortBy] = useState('active');

  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [detailLoading, setDetailLoading] = useState(false);

  const [postFormOpen, setPostFormOpen] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postTags, setPostTags] = useState('');
  const [postAnonymous, setPostAnonymous] = useState(true);

  const [commentContent, setCommentContent] = useState('');
  const [commentAnonymous, setCommentAnonymous] = useState(false);

  const [bannerError, setBannerError] = useState('');
  const [bannerSuccess, setBannerSuccess] = useState('');

  const postHasMore = useMemo(() => posts.length < postsTotal, [posts.length, postsTotal]);
  const commentsHasMore = useMemo(() => comments.length < commentsTotal, [comments.length, commentsTotal]);

  const setSuccess = (msg) => {
    setBannerSuccess(msg);
    setTimeout(() => setBannerSuccess(''), 2200);
  };

  const setError = (msg) => {
    setBannerError(msg);
    setTimeout(() => setBannerError(''), 2600);
  };

  const requireUserWriteAccess = () => {
    if (canWrite) return true;
    if (isLawyerAuthenticated) {
      setError('Community posting is currently available for user accounts only.');
      return false;
    }
    setPage('login');
    return false;
  };

  const loadPosts = async ({ page = 1, append = false, search, tag, sort } = {}) => {
    setPostsLoading(true);
    try {
      const effectiveSearch = (search ?? searchText).trim();
      const effectiveTag = (tag ?? tagText).trim().toLowerCase();
      const effectiveSort = sort ?? sortBy;

      const params = { page, limit: 10, sortBy: effectiveSort };
      if (effectiveSearch) params.search = effectiveSearch;
      if (effectiveTag) params.tag = effectiveTag;

      const res = await communityAPI.listPosts(params);
      const nextPosts = res.data.posts || [];

      setPosts((prev) => (append ? [...prev, ...nextPosts] : nextPosts));
      setPostsPage(page);
      setPostsTotal(res.data.total || 0);
    } catch (error) {
      setError(error?.response?.data?.message || 'Failed to load community posts');
    } finally {
      setPostsLoading(false);
    }
  };

  const openPost = async (postId) => {
    setDetailLoading(true);
    try {
      const res = await communityAPI.getPostById(postId, { page: 1, limit: 10 });
      setSelectedPost(res.data.post || null);
      setComments(res.data.comments || []);
      setCommentsPage(res.data.commentsPage || 1);
      setCommentsTotal(res.data.commentsTotal || 0);
    } catch (error) {
      setError(error?.response?.data?.message || 'Unable to load post details');
    } finally {
      setDetailLoading(false);
    }
  };

  const loadMoreComments = async () => {
    if (!selectedPost || !commentsHasMore) return;

    const nextPage = commentsPage + 1;
    try {
      const res = await communityAPI.listPostComments(selectedPost.id, { page: nextPage, limit: 10 });
      setComments((prev) => [...prev, ...(res.data.comments || [])]);
      setCommentsPage(nextPage);
      setCommentsTotal(res.data.total || commentsTotal);
    } catch (error) {
      setError(error?.response?.data?.message || 'Failed to load more comments');
    }
  };

  useEffect(() => {
    loadPosts({ page: 1, append: false });
  }, []);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!requireUserWriteAccess()) return;

    const safeContent = postContent.trim();
    if (safeContent.length < 3) {
      setError('Post content should be at least 3 characters.');
      return;
    }

    try {
      const res = await communityAPI.createPost({
        content: safeContent,
        isAnonymous: postAnonymous,
        tags: postTags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      });

      setPostContent('');
      setPostTags('');
      setPostAnonymous(true);
      setPostFormOpen(false);
      setSuccess('Post shared with the community.');

      await loadPosts({ page: 1, append: false });
      if (res.data?.post?.id) {
        await openPost(res.data.post.id);
      }
    } catch (error) {
      setError(error?.response?.data?.message || 'Unable to create post');
    }
  };

  const handleCreateComment = async (e) => {
    e.preventDefault();
    if (!selectedPost) return;
    if (!requireUserWriteAccess()) return;

    const safeContent = commentContent.trim();
    if (!safeContent) {
      setError('Comment cannot be empty.');
      return;
    }

    try {
      const res = await communityAPI.createComment(selectedPost.id, {
        content: safeContent,
        isAnonymous: commentAnonymous,
      });

      setCommentContent('');
      setCommentAnonymous(false);
      setComments((prev) => [...prev, res.data.comment]);
      setCommentsTotal((prev) => prev + 1);
      setSelectedPost((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          commentsCount: (prev.commentsCount || 0) + 1,
          lastActivityAt: new Date().toISOString(),
        };
      });
      setSuccess('Comment posted.');

      setPosts((prev) => prev.map((post) => {
        if (post.id !== selectedPost.id) return post;
        return {
          ...post,
          commentsCount: (post.commentsCount || 0) + 1,
          lastActivityAt: new Date().toISOString(),
        };
      }));
    } catch (error) {
      setError(error?.response?.data?.message || 'Unable to add comment');
    }
  };

  const handlePostReaction = async (postId, reactionType) => {
    if (!requireUserWriteAccess()) return;

    try {
      const res = await communityAPI.reactToPost(postId, reactionType);
      const { userReaction, reactionsSummary } = res.data;

      setPosts((prev) => prev.map((post) => post.id === postId ? { ...post, userReaction, reactionsSummary } : post));
      setSelectedPost((prev) => {
        if (!prev || prev.id !== postId) return prev;
        return { ...prev, userReaction, reactionsSummary };
      });
    } catch (error) {
      setError(error?.response?.data?.message || 'Could not react to post');
    }
  };

  const handleCommentReaction = async (commentId, reactionType) => {
    if (!requireUserWriteAccess()) return;

    try {
      const res = await communityAPI.reactToComment(commentId, reactionType);
      const { userReaction, reactionsSummary } = res.data;

      setComments((prev) => prev.map((item) => item.id === commentId ? { ...item, userReaction, reactionsSummary } : item));
    } catch (error) {
      setError(error?.response?.data?.message || 'Could not react to comment');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!requireUserWriteAccess()) return;
    if (!window.confirm('Delete this post?')) return;

    try {
      await communityAPI.deletePost(postId);
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
        setComments([]);
        setCommentsPage(1);
        setCommentsTotal(0);
      }
      setSuccess('Post deleted.');
    } catch (error) {
      setError(error?.response?.data?.message || 'Failed to delete post');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!requireUserWriteAccess()) return;
    if (!window.confirm('Delete this comment?')) return;

    try {
      await communityAPI.deleteComment(commentId);
      setComments((prev) => prev.filter((item) => item.id !== commentId));
      setCommentsTotal((prev) => Math.max(prev - 1, 0));
      setSelectedPost((prev) => {
        if (!prev) return prev;
        return { ...prev, commentsCount: Math.max((prev.commentsCount || 0) - 1, 0) };
      });
      setPosts((prev) => prev.map((post) => post.id === selectedPost?.id ? {
        ...post,
        commentsCount: Math.max((post.commentsCount || 0) - 1, 0),
      } : post));
      setSuccess('Comment deleted.');
    } catch (error) {
      setError(error?.response?.data?.message || 'Failed to delete comment');
    }
  };

  const clearFilters = async () => {
    setSearchText('');
    setTagText('');
    setSortBy('active');
    await loadPosts({ page: 1, append: false, search: '', tag: '', sort: 'active' });
  };

  return (
    <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageCircle size={24} color="#a855f7" />
          Community Support
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.35rem' }}>
          A safe space to ask for support anonymously and learn from shared experiences.
        </p>
      </div>

      {(bannerError || bannerSuccess) && (
        <GlassCard
          style={{
            marginBottom: '1rem',
            borderColor: bannerError ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)',
            background: bannerError ? 'rgba(127, 29, 29, 0.28)' : 'rgba(20, 83, 45, 0.24)',
            padding: '0.8rem 1rem',
          }}
        >
          <p style={{ color: bannerError ? '#fca5a5' : '#86efac', fontSize: '0.9rem' }}>
            {bannerError || bannerSuccess}
          </p>
        </GlassCard>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        <div>
          <GlassCard style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '0.8rem' }}>
              <div style={{ position: 'relative' }}>
                <Search size={17} style={{ position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search posts"
                  style={{
                    width: '100%',
                    padding: '10px 10px 10px 34px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(0,0,0,0.2)',
                    color: 'inherit',
                  }}
                />
              </div>
              <button
                onClick={() => loadPosts({ page: 1, append: false })}
                style={{
                  padding: '10px 13px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                }}
              >
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.7rem' }}>
              <input
                value={tagText}
                onChange={(e) => setTagText(e.target.value)}
                placeholder="Filter by tag"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'rgba(0,0,0,0.2)',
                  color: 'inherit',
                }}
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'rgba(0,0,0,0.2)',
                  color: 'inherit',
                }}
              >
                <option value="active">Most Active</option>
                <option value="recent">Most Recent</option>
                <option value="top">Top Reactions</option>
              </select>
              <button
                onClick={clearFilters}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'var(--text-muted)',
                }}
              >
                Clear
              </button>
            </div>
          </GlassCard>

          <GlassCard style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <div>
                <h3 style={{ marginBottom: '0.35rem', fontSize: '1.05rem' }}>Share Your Concern</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  Example: "I faced harassment, what should I do?"
                </p>
              </div>
              <button
                onClick={() => {
                  if (!requireUserWriteAccess()) return;
                  setPostFormOpen((prev) => !prev);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(168, 85, 247, 0.45)',
                  background: 'rgba(168, 85, 247, 0.2)',
                  color: '#e879f9',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <PlusCircle size={15} />
                {postFormOpen ? 'Close' : 'New Post'}
              </button>
            </div>

            {postFormOpen && (
              <form onSubmit={handleCreatePost} style={{ marginTop: '1rem' }}>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Describe your situation..."
                  style={{
                    width: '100%',
                    minHeight: '110px',
                    resize: 'vertical',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    padding: '12px',
                    background: 'rgba(0,0,0,0.2)',
                    color: 'inherit',
                    fontFamily: 'inherit',
                    marginBottom: '0.7rem',
                  }}
                />
                <input
                  value={postTags}
                  onChange={(e) => setPostTags(e.target.value)}
                  placeholder="Tags (comma separated): safety, harassment"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(0,0,0,0.2)',
                    color: 'inherit',
                    marginBottom: '0.7rem',
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    <input
                      type="checkbox"
                      checked={postAnonymous}
                      onChange={(e) => setPostAnonymous(e.target.checked)}
                    />
                    Post anonymously
                  </label>

                  <button className="btn-primary" type="submit" style={{ padding: '10px 16px', borderRadius: '8px' }}>
                    <Send size={15} />
                    Share Post
                  </button>
                </div>
              </form>
            )}

            {!canWrite && (
              <div style={{ marginTop: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                <Lock size={14} />
                Sign in with a user account to post, comment, and react.
              </div>
            )}
          </GlassCard>

          {postsLoading && posts.length === 0 ? (
            <GlassCard style={{ textAlign: 'center', padding: '2rem' }}>Loading community posts...</GlassCard>
          ) : posts.length === 0 ? (
            <GlassCard style={{ textAlign: 'center', padding: '2rem' }}>
              <MessageCircle size={34} style={{ margin: '0 auto 0.7rem', color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-muted)' }}>No posts yet. Be the first to share your concern.</p>
            </GlassCard>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {posts.map((post) => (
                <GlassCard
                  key={post.id}
                  style={{
                    padding: '1rem',
                    borderColor: selectedPost?.id === post.id ? 'rgba(168,85,247,0.5)' : undefined,
                    background: selectedPost?.id === post.id ? 'rgba(88,28,135,0.2)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.4rem' }}>
                        <UserCircle2 size={16} color="#c084fc" />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{post.author?.name || 'Anonymous'}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>• {safeDate(post.createdAt)}</span>
                      </div>
                      <p style={{ lineHeight: '1.55', marginBottom: '0.6rem' }}>{trimText(post.content, 280)}</p>

                      {post.tags?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '0.6rem' }}>
                          {post.tags.map((tag) => (
                            <span
                              key={`${post.id}-${tag}`}
                              style={{
                                fontSize: '0.75rem',
                                padding: '3px 8px',
                                borderRadius: '999px',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-muted)',
                              }}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {(canWrite && String(user?.id || user?._id) === String(post.author?.id)) && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        title="Delete post"
                        style={{
                          padding: '6px',
                          borderRadius: '7px',
                          border: '1px solid rgba(239,68,68,0.4)',
                          background: 'rgba(239,68,68,0.15)',
                          color: '#f87171',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {REACTIONS.map(({ type, label, icon: Icon, color }) => (
                        <button
                          key={`${post.id}-${type}`}
                          onClick={() => handlePostReaction(post.id, type)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: `1px solid ${post.userReaction === type ? color : 'var(--border-color)'}`,
                            background: post.userReaction === type ? `${color}22` : 'rgba(255,255,255,0.04)',
                            color: post.userReaction === type ? color : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.82rem',
                          }}
                        >
                          <Icon size={14} />
                          {label} ({post.reactionsSummary?.[type] || 0})
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => openPost(post.id)}
                      style={{
                        padding: '7px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(59,130,246,0.5)',
                        background: 'rgba(59,130,246,0.15)',
                        color: '#60a5fa',
                        fontSize: '0.84rem',
                      }}
                    >
                      Open Comments ({post.commentsCount || 0})
                    </button>
                  </div>
                </GlassCard>
              ))}

              {postHasMore && (
                <button
                  onClick={() => loadPosts({ page: postsPage + 1, append: true })}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-muted)',
                  }}
                >
                  Load More Posts
                </button>
              )}
            </div>
          )}
        </div>

        <div>
          <GlassCard style={{ minHeight: '420px' }}>
            {!selectedPost ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '2rem' }}>
                <MessageCircle size={34} style={{ margin: '0 auto 0.8rem' }} />
                <p>Select a post to read and add comments.</p>
              </div>
            ) : detailLoading ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '2rem' }}>
                Loading post details...
              </div>
            ) : (
              <>
                <button
                  onClick={() => {
                    setSelectedPost(null);
                    setComments([]);
                    setCommentsTotal(0);
                    setCommentsPage(1);
                  }}
                  style={{
                    marginBottom: '0.8rem',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(255,255,255,0.04)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.82rem',
                  }}
                >
                  <ChevronLeft size={14} /> Back to list
                </button>

                <div style={{ marginBottom: '0.9rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
                  <h3 style={{ marginBottom: '0.45rem', fontSize: '1rem' }}>Selected Post</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.45rem' }}>
                    {selectedPost.author?.name || 'Anonymous'} • {safeDate(selectedPost.createdAt)}
                  </p>
                  <p style={{ lineHeight: '1.6' }}>{selectedPost.content}</p>
                </div>

                <h4 style={{ marginBottom: '0.7rem' }}>Comments ({selectedPost.commentsCount || 0})</h4>

                <form onSubmit={handleCreateComment} style={{ marginBottom: '1rem' }}>
                  <textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Reply with support or guidance..."
                    style={{
                      width: '100%',
                      minHeight: '78px',
                      resize: 'vertical',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      padding: '10px',
                      background: 'rgba(0,0,0,0.2)',
                      color: 'inherit',
                      fontFamily: 'inherit',
                      marginBottom: '0.55rem',
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      <input
                        type="checkbox"
                        checked={commentAnonymous}
                        onChange={(e) => setCommentAnonymous(e.target.checked)}
                      />
                      Reply anonymously
                    </label>

                    <button
                      type="submit"
                      className="btn-primary"
                      style={{
                        padding: '9px 12px',
                        borderRadius: '8px',
                        fontSize: '0.84rem',
                      }}
                    >
                      <Send size={14} /> Reply
                    </button>
                  </div>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {comments.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No comments yet. Be the first to respond.</p>
                  ) : comments.map((comment) => (
                    <div
                      key={comment.id}
                      style={{
                        padding: '0.8rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.03)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '0.35rem' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {comment.author?.name || 'Anonymous'} • {safeDate(comment.createdAt)}
                        </p>

                        {(canWrite && String(user?.id || user?._id) === String(comment.author?.id)) && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            title="Delete comment"
                            style={{
                              padding: '4px',
                              borderRadius: '6px',
                              border: '1px solid rgba(239,68,68,0.35)',
                              background: 'rgba(239,68,68,0.15)',
                              color: '#f87171',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>

                      <p style={{ lineHeight: '1.5', marginBottom: '0.45rem', fontSize: '0.92rem' }}>{comment.content}</p>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {REACTIONS.map(({ type, label, icon: Icon, color }) => (
                          <button
                            key={`${comment.id}-${type}`}
                            onClick={() => handleCommentReaction(comment.id, type)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '8px',
                              border: `1px solid ${comment.userReaction === type ? color : 'var(--border-color)'}`,
                              background: comment.userReaction === type ? `${color}22` : 'rgba(255,255,255,0.03)',
                              color: comment.userReaction === type ? color : 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '0.78rem',
                            }}
                          >
                            <Icon size={12} />
                            {label} ({comment.reactionsSummary?.[type] || 0})
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {commentsHasMore && (
                  <button
                    onClick={loadMoreComments}
                    style={{
                      marginTop: '0.8rem',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Load More Comments
                  </button>
                )}
              </>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default CommunitySupport;
