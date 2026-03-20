import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  BarChart3,
  Star,
  LineChart,
  Smile,
  Frown,
  Meh,
  RefreshCw,
  Calendar,
  Send,
  Trash2,
  Pencil,
  Save,
  X,
  ShieldCheck,
  Users,
  TrendingUp,
  PieChart,
  FileSpreadsheet,
} from 'lucide-react';
import GlassCard from '../common/GlassCard';
import { feedbackAPI } from '../../services/api';

const USER_TABS = [
  { id: 'submit', label: 'Submit Feedback', icon: Send },
  { id: 'history', label: 'My Feedback', icon: BarChart3 },
];

const LAWYER_TABS = [
  { id: 'performance', label: 'Performance Analytics', icon: LineChart },
];

const ADMIN_TABS = [
  { id: 'platform', label: 'Platform Analytics', icon: PieChart },
  { id: 'lawyers', label: 'Lawyer Performance', icon: Users },
  { id: 'satisfaction', label: 'Satisfaction Metrics', icon: Smile },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
];

const daysOptions = [7, 30, 90, 180];
const scoreOptions = ['', 1, 2, 3, 4, 5];

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};

const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.message || fallback;
};

const RatingStars = ({ value = 0 }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          color={value >= star ? '#fbbf24' : '#6b7280'}
          fill={value >= star ? '#fbbf24' : 'transparent'}
        />
      ))}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color = '#a855f7', subtitle = '' }) => {
  return (
    <GlassCard style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{label}</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '700', color }}>{value}</div>
          {subtitle ? <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{subtitle}</div> : null}
        </div>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid var(--border-color)',
          }}
        >
          <Icon size={18} color={color} />
        </div>
      </div>
    </GlassCard>
  );
};

const DistributionBar = ({ label, value, total }) => {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 50px', gap: '10px', alignItems: 'center' }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{label}</span>
      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #f59e0b 0%, #a855f7 100%)',
            transition: 'width 0.25s ease',
          }}
        />
      </div>
      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'right' }}>{value}</span>
    </div>
  );
};

const FeedbackCenter = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { isAuthenticated: isLawyerAuthenticated, lawyer } = useSelector((state) => state.lawyer);

  const isUser = isAuthenticated && !isLawyerAuthenticated;
  const isLawyer = isLawyerAuthenticated;
  const isAdmin = isUser && user?.role === 'admin';

  const tabConfig = useMemo(() => {
    if (isAdmin) return ADMIN_TABS;
    if (isLawyer) return LAWYER_TABS;
    if (isUser) return USER_TABS;
    return [];
  }, [isAdmin, isLawyer, isUser]);

  const [activeTab, setActiveTab] = useState(tabConfig[0]?.id || 'submit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // User states
  const [submitForm, setSubmitForm] = useState({
    targetType: 'platform',
    rating: 0,
    comment: '',
    categories: '',
    easeOfUse: '',
    responseTime: '',
    legalClarity: '',
    supportQuality: '',
    valueForMoney: '',
  });
  const [myFeedback, setMyFeedback] = useState([]);
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [editDraft, setEditDraft] = useState({ rating: 0, comment: '' });

  // Lawyer state
  const [lawyerDays, setLawyerDays] = useState(90);
  const [lawyerPerformance, setLawyerPerformance] = useState(null);

  // Admin states
  const [adminDays, setAdminDays] = useState(30);
  const [platformAnalytics, setPlatformAnalytics] = useState(null);
  const [lawyerAnalytics, setLawyerAnalytics] = useState([]);
  const [satisfactionMetrics, setSatisfactionMetrics] = useState(null);
  const [reports, setReports] = useState([]);
  const [reportPeriodType, setReportPeriodType] = useState('weekly');
  const [forceRegeneration, setForceRegeneration] = useState(false);

  useEffect(() => {
    if (!tabConfig.length) return;
    if (!tabConfig.some((tab) => tab.id === activeTab)) {
      setActiveTab(tabConfig[0].id);
    }
  }, [tabConfig, activeTab]);

  const clearBannerAfterDelay = () => {
    setTimeout(() => setNotice(''), 2500);
  };

  const fetchMyFeedback = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await feedbackAPI.getMyFeedback({ status: 'active', limit: 30, page: 1 });
      setMyFeedback(res.data.feedbacks || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load your feedback entries'));
    } finally {
      setLoading(false);
    }
  };

  const fetchLawyerPerformance = async (days = lawyerDays) => {
    setLoading(true);
    setError('');
    try {
      const res = await feedbackAPI.getMyLawyerPerformance({ days });
      setLawyerPerformance(res.data.performance || null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load performance analytics'));
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformAnalytics = async (days = adminDays) => {
    setLoading(true);
    setError('');
    try {
      const res = await feedbackAPI.getPlatformAnalytics({ days });
      setPlatformAnalytics(res.data || null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load platform analytics'));
    } finally {
      setLoading(false);
    }
  };

  const fetchLawyerAnalytics = async (days = adminDays) => {
    setLoading(true);
    setError('');
    try {
      const res = await feedbackAPI.getLawyerPerformanceAnalytics({ days, limit: 50 });
      setLawyerAnalytics(res.data.lawyers || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load lawyer analytics'));
    } finally {
      setLoading(false);
    }
  };

  const fetchSatisfactionMetrics = async (days = adminDays) => {
    setLoading(true);
    setError('');
    try {
      const res = await feedbackAPI.getSatisfactionMetrics({ days });
      setSatisfactionMetrics(res.data || null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load satisfaction metrics'));
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await feedbackAPI.listReports({ limit: 30, page: 1 });
      setReports(res.data.reports || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load reports'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated && !isLawyerAuthenticated) return;

    if (isUser && !isAdmin && activeTab === 'history') {
      fetchMyFeedback();
    }

    if (isLawyer && activeTab === 'performance') {
      fetchLawyerPerformance(lawyerDays);
    }

    if (isAdmin) {
      if (activeTab === 'platform') fetchPlatformAnalytics(adminDays);
      if (activeTab === 'lawyers') fetchLawyerAnalytics(adminDays);
      if (activeTab === 'satisfaction') fetchSatisfactionMetrics(adminDays);
      if (activeTab === 'reports') fetchReports();
    }
  }, [activeTab, isAuthenticated, isLawyerAuthenticated, isLawyer, isUser, isAdmin]);

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!submitForm.rating || submitForm.rating < 1 || submitForm.rating > 5) {
      setError('Please select a rating between 1 and 5');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const dimensions = {};
      ['easeOfUse', 'responseTime', 'legalClarity', 'supportQuality', 'valueForMoney'].forEach((key) => {
        const value = Number(submitForm[key]);
        if (Number.isFinite(value) && value >= 1 && value <= 5) {
          dimensions[key] = value;
        }
      });

      await feedbackAPI.createFeedback({
        targetType: 'platform',
        rating: Number(submitForm.rating),
        comment: submitForm.comment.trim(),
        categories: submitForm.categories
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        dimensions,
      });

      setSubmitForm({
        targetType: 'platform',
        rating: 0,
        comment: '',
        categories: '',
        easeOfUse: '',
        responseTime: '',
        legalClarity: '',
        supportQuality: '',
        valueForMoney: '',
      });
      setNotice('Feedback submitted successfully');
      clearBannerAfterDelay();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to submit feedback'));
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (entry) => {
    setEditingFeedback(entry._id);
    setEditDraft({
      rating: entry.rating || 0,
      comment: entry.comment || '',
    });
  };

  const handleUpdateFeedback = async (feedbackId) => {
    if (!editDraft.rating || editDraft.rating < 1 || editDraft.rating > 5) {
      setError('Rating must be between 1 and 5');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await feedbackAPI.updateMyFeedback(feedbackId, {
        rating: Number(editDraft.rating),
        comment: editDraft.comment,
      });
      setNotice('Feedback updated');
      clearBannerAfterDelay();
      setEditingFeedback(null);
      await fetchMyFeedback();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update feedback'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm('Delete this feedback entry?')) return;

    setLoading(true);
    setError('');
    try {
      await feedbackAPI.deleteMyFeedback(feedbackId);
      setNotice('Feedback deleted');
      clearBannerAfterDelay();
      await fetchMyFeedback();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete feedback'));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setError('');
    try {
      await feedbackAPI.generateReport({
        periodType: reportPeriodType,
        force: forceRegeneration,
      });
      setNotice(`${reportPeriodType} report generation complete`);
      clearBannerAfterDelay();
      await fetchReports();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to generate report'));
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated && !isLawyerAuthenticated) {
    return (
      <div className="page-container center-content">
        <GlassCard style={{ maxWidth: '520px', textAlign: 'center' }}>
          <ShieldCheck size={42} style={{ margin: '0 auto 1rem', color: '#a855f7' }} />
          <h3 style={{ marginBottom: '0.75rem' }}>Feedback & Ratings</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Sign in as user, lawyer, or admin to access feedback submissions, analytics, and reports.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart3 size={24} color="#a855f7" />
          Feedback & Ratings
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.3rem' }}>
          {isAdmin
            ? 'Monitor platform sentiment, lawyer performance, and generate weekly/monthly feedback reports.'
            : isLawyer
            ? 'Track your service performance trends and user rating insights.'
            : 'Share your platform experience and manage your feedback history.'}
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1rem' }}>
        {tabConfig.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 14px',
                borderRadius: '10px',
                border: `1px solid ${activeTab === tab.id ? '#a855f7' : 'var(--border-color)'}`,
                background: activeTab === tab.id ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.04)',
                color: activeTab === tab.id ? '#e879f9' : 'var(--text-muted)',
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {(error || notice) && (
        <GlassCard
          style={{
            marginBottom: '1rem',
            borderColor: error ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)',
            background: error ? 'rgba(127, 29, 29, 0.25)' : 'rgba(20, 83, 45, 0.22)',
            padding: '0.9rem 1rem',
          }}
        >
          <p style={{ fontSize: '0.9rem', color: error ? '#fca5a5' : '#86efac' }}>{error || notice}</p>
        </GlassCard>
      )}

      {activeTab === 'submit' && (
        <GlassCard style={{ maxWidth: '900px' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Submit Platform Feedback</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '0.92rem' }}>
            Your feedback improves legal support quality and helps us track satisfaction trends platform-wide.
          </p>

          <form onSubmit={handleSubmitFeedback}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Overall Rating *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSubmitForm((prev) => ({ ...prev, rating: value }))}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      border: `1px solid ${submitForm.rating === value ? '#f59e0b' : 'var(--border-color)'}`,
                      background: submitForm.rating === value ? 'rgba(251, 191, 36, 0.18)' : 'rgba(255,255,255,0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Star size={20} color="#fbbf24" fill={submitForm.rating >= value ? '#fbbf24' : 'transparent'} />
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.9rem', marginBottom: '1rem' }}>
              {[
                ['easeOfUse', 'Ease Of Use'],
                ['responseTime', 'Response Time'],
                ['legalClarity', 'Legal Clarity'],
                ['supportQuality', 'Support Quality'],
                ['valueForMoney', 'Value For Money'],
              ].map(([key, label]) => (
                <div key={key}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.84rem', color: 'var(--text-muted)' }}>{label}</label>
                  <select
                    value={submitForm[key]}
                    onChange={(e) => setSubmitForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'rgba(0,0,0,0.2)',
                      color: 'inherit',
                    }}
                  >
                    {scoreOptions.map((option) => (
                      <option key={`${key}-${option || 'empty'}`} value={option}>
                        {option ? `${option}/5` : 'Not rated'}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.45rem' }}>Categories (comma-separated)</label>
              <input
                type="text"
                value={submitForm.categories}
                onChange={(e) => setSubmitForm((prev) => ({ ...prev, categories: e.target.value }))}
                placeholder="e.g. onboarding, legal-clarity, support"
                style={{
                  width: '100%',
                  padding: '11px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'rgba(0,0,0,0.2)',
                  color: 'inherit',
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.45rem' }}>Comment</label>
              <textarea
                value={submitForm.comment}
                onChange={(e) => setSubmitForm((prev) => ({ ...prev, comment: e.target.value }))}
                placeholder="Share details to help us improve..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  resize: 'vertical',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'rgba(0,0,0,0.2)',
                  color: 'inherit',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        </GlassCard>
      )}

      {activeTab === 'history' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button
              onClick={() => fetchMyFeedback()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 13px',
                borderRadius: '9px',
                border: '1px solid var(--border-color)',
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--text-muted)',
              }}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="page-container center-content">Loading feedback history...</div>
          ) : myFeedback.length === 0 ? (
            <GlassCard style={{ textAlign: 'center', padding: '2.5rem' }}>
              <BarChart3 size={40} style={{ margin: '0 auto 0.8rem', color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-muted)' }}>No feedback found yet.</p>
            </GlassCard>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {myFeedback.map((entry) => (
                <GlassCard key={entry._id} style={{ padding: '1.1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.4rem' }}>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            padding: '4px 9px',
                            borderRadius: '999px',
                            background: entry.targetType === 'platform' ? 'rgba(59,130,246,0.2)' : 'rgba(168,85,247,0.2)',
                            color: entry.targetType === 'platform' ? '#60a5fa' : '#c084fc',
                          }}
                        >
                          {entry.targetType}
                        </span>
                        <RatingStars value={entry.rating} />
                      </div>
                      <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                        Submitted: {formatDate(entry.createdAt)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleStartEdit(entry)}
                        style={{
                          padding: '7px 11px',
                          borderRadius: '8px',
                          border: '1px solid rgba(59,130,246,0.5)',
                          background: 'rgba(59,130,246,0.16)',
                          color: '#60a5fa',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.84rem',
                        }}
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteFeedback(entry._id)}
                        style={{
                          padding: '7px 11px',
                          borderRadius: '8px',
                          border: '1px solid rgba(239,68,68,0.5)',
                          background: 'rgba(239,68,68,0.16)',
                          color: '#f87171',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.84rem',
                        }}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>

                  {editingFeedback === entry._id ? (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                      <div style={{ display: 'flex', gap: '7px', marginBottom: '0.9rem' }}>
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={`${entry._id}-${value}`}
                            type="button"
                            onClick={() => setEditDraft((prev) => ({ ...prev, rating: value }))}
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '8px',
                              border: `1px solid ${editDraft.rating === value ? '#f59e0b' : 'var(--border-color)'}`,
                              background: editDraft.rating === value ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.03)',
                            }}
                          >
                            <Star size={16} color="#fbbf24" fill={editDraft.rating >= value ? '#fbbf24' : 'transparent'} />
                          </button>
                        ))}
                      </div>

                      <textarea
                        value={editDraft.comment}
                        onChange={(e) => setEditDraft((prev) => ({ ...prev, comment: e.target.value }))}
                        style={{
                          width: '100%',
                          minHeight: '90px',
                          resize: 'vertical',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          padding: '10px',
                          background: 'rgba(0,0,0,0.2)',
                          color: 'inherit',
                          fontFamily: 'inherit',
                        }}
                      />

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.75rem' }}>
                        <button
                          onClick={() => setEditingFeedback(null)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid rgba(107,114,128,0.5)',
                            background: 'rgba(107,114,128,0.15)',
                            color: '#9ca3af',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <X size={14} /> Cancel
                        </button>
                        <button
                          onClick={() => handleUpdateFeedback(entry._id)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid rgba(34,197,94,0.5)',
                            background: 'rgba(34,197,94,0.17)',
                            color: '#4ade80',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <Save size={14} /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ marginTop: '0.8rem', color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.55' }}>
                      {entry.comment || 'No additional comment provided.'}
                    </p>
                  )}
                </GlassCard>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'performance' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Time window:</label>
              <select
                value={lawyerDays}
                onChange={async (e) => {
                  const next = Number(e.target.value);
                  setLawyerDays(next);
                  await fetchLawyerPerformance(next);
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'rgba(0,0,0,0.2)',
                  color: 'inherit',
                }}
              >
                {daysOptions.map((day) => (
                  <option key={`lawyer-days-${day}`} value={day}>{day} days</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => fetchLawyerPerformance(lawyerDays)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--text-muted)',
              }}
            >
              <RefreshCw size={15} /> Refresh
            </button>
          </div>

          {loading && !lawyerPerformance ? (
            <div className="page-container center-content">Loading performance analytics...</div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <StatCard icon={Star} label="Average Rating" value={lawyerPerformance?.averageRating ?? 0} color="#f59e0b" />
                <StatCard icon={Users} label="Total Feedbacks" value={lawyerPerformance?.totalFeedbacks ?? 0} color="#3b82f6" />
                <StatCard icon={Smile} label="Positive Ratio" value={`${lawyerPerformance?.positiveRatio ?? 0}%`} color="#22c55e" />
                <StatCard
                  icon={TrendingUp}
                  label="Rating Trend"
                  value={`${lawyerPerformance?.ratingTrendDelta ?? 0}`}
                  subtitle="vs previous window"
                  color={(lawyerPerformance?.ratingTrendDelta ?? 0) >= 0 ? '#22c55e' : '#ef4444'}
                />
              </div>

              <GlassCard>
                <h3 style={{ marginBottom: '0.8rem' }}>Service Quality Dimensions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.9rem' }}>
                  <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Response Time</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.3rem' }}>{lawyerPerformance?.responseTimeAverage ?? 0}</div>
                  </div>
                  <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Support Quality</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.3rem' }}>{lawyerPerformance?.supportQualityAverage ?? 0}</div>
                  </div>
                  <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Lawyer</div>
                    <div style={{ fontSize: '1rem', fontWeight: '600', marginTop: '0.3rem' }}>{lawyerPerformance?.lawyerName || lawyer?.name || 'N/A'}</div>
                  </div>
                </div>
              </GlassCard>
            </>
          )}
        </>
      )}

      {isAdmin && activeTab === 'platform' && (
        <>
          <AdminDayFilter
            days={adminDays}
            onChange={async (next) => {
              setAdminDays(next);
              await fetchPlatformAnalytics(next);
            }}
            onRefresh={() => fetchPlatformAnalytics(adminDays)}
          />

          {loading && !platformAnalytics ? (
            <div className="page-container center-content">Loading platform analytics...</div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.9rem', marginBottom: '1rem' }}>
                <StatCard icon={BarChart3} label="Total Feedbacks" value={platformAnalytics?.summary?.totalFeedbacks ?? 0} color="#a855f7" />
                <StatCard icon={Users} label="Unique Users" value={platformAnalytics?.summary?.uniqueUsers ?? 0} color="#3b82f6" />
                <StatCard icon={Star} label="Avg Rating" value={platformAnalytics?.summary?.averageRating ?? 0} color="#f59e0b" />
                <StatCard icon={Smile} label="Satisfaction Index" value={platformAnalytics?.summary?.satisfactionIndex ?? 0} color="#22c55e" />
                <StatCard icon={LineChart} label="NPS Score" value={platformAnalytics?.summary?.npsScore ?? 0} color="#06b6d4" />
              </div>

              <GlassCard>
                <h3 style={{ marginBottom: '0.8rem' }}>Rating Distribution</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
                  {[5, 4, 3, 2, 1].map((score) => (
                    <DistributionBar
                      key={`platform-dist-${score}`}
                      label={`${score} Star`}
                      value={platformAnalytics?.satisfactionMetrics?.ratingDistribution?.[String(score)] || 0}
                      total={platformAnalytics?.summary?.totalFeedbacks || 0}
                    />
                  ))}
                </div>

                <h4 style={{ marginBottom: '0.6rem' }}>Dimension Averages</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                  {Object.entries(platformAnalytics?.satisfactionMetrics?.dimensionAverages || {}).map(([key, val]) => (
                    <div key={`platform-dim-${key}`} style={{ padding: '0.7rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '700', marginTop: '0.3rem' }}>{val || 0}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </>
          )}
        </>
      )}

      {isAdmin && activeTab === 'lawyers' && (
        <>
          <AdminDayFilter
            days={adminDays}
            onChange={async (next) => {
              setAdminDays(next);
              await fetchLawyerAnalytics(next);
            }}
            onRefresh={() => fetchLawyerAnalytics(adminDays)}
          />

          {loading && lawyerAnalytics.length === 0 ? (
            <div className="page-container center-content">Loading lawyer analytics...</div>
          ) : lawyerAnalytics.length === 0 ? (
            <GlassCard style={{ textAlign: 'center', padding: '2rem' }}>
              <Users size={36} style={{ margin: '0 auto 0.8rem', color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-muted)' }}>No lawyer feedback analytics available yet.</p>
            </GlassCard>
          ) : (
            <GlassCard style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 8px' }}>Lawyer</th>
                    <th style={{ padding: '10px 8px' }}>State</th>
                    <th style={{ padding: '10px 8px' }}>Avg Rating</th>
                    <th style={{ padding: '10px 8px' }}>Feedbacks</th>
                    <th style={{ padding: '10px 8px' }}>Positive %</th>
                    <th style={{ padding: '10px 8px' }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {lawyerAnalytics.map((entry) => (
                    <tr key={entry.lawyer} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 8px' }}>{entry.lawyerName}</td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>{entry.state || '-'}</td>
                      <td style={{ padding: '10px 8px' }}>{entry.averageRating}</td>
                      <td style={{ padding: '10px 8px' }}>{entry.totalFeedbacks}</td>
                      <td style={{ padding: '10px 8px' }}>{entry.positiveRatio}%</td>
                      <td style={{ padding: '10px 8px', color: entry.ratingTrendDelta >= 0 ? '#4ade80' : '#f87171' }}>
                        {entry.ratingTrendDelta >= 0 ? '+' : ''}{entry.ratingTrendDelta}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          )}
        </>
      )}

      {isAdmin && activeTab === 'satisfaction' && (
        <>
          <AdminDayFilter
            days={adminDays}
            onChange={async (next) => {
              setAdminDays(next);
              await fetchSatisfactionMetrics(next);
            }}
            onRefresh={() => fetchSatisfactionMetrics(adminDays)}
          />

          {loading && !satisfactionMetrics ? (
            <div className="page-container center-content">Loading satisfaction metrics...</div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.9rem', marginBottom: '1rem' }}>
                <StatCard icon={Smile} label="Satisfied" value={`${satisfactionMetrics?.satisfaction?.satisfied?.ratio || 0}%`} color="#22c55e" />
                <StatCard icon={Meh} label="Neutral" value={`${satisfactionMetrics?.satisfaction?.neutral?.ratio || 0}%`} color="#f59e0b" />
                <StatCard icon={Frown} label="Dissatisfied" value={`${satisfactionMetrics?.satisfaction?.dissatisfied?.ratio || 0}%`} color="#ef4444" />
              </div>

              <GlassCard style={{ marginBottom: '1rem' }}>
                <h3 style={{ marginBottom: '0.8rem' }}>Satisfaction Distribution</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                  <DistributionBar
                    label="Satisfied"
                    value={satisfactionMetrics?.satisfaction?.satisfied?.count || 0}
                    total={satisfactionMetrics?.summary?.totalFeedbacks || 0}
                  />
                  <DistributionBar
                    label="Neutral"
                    value={satisfactionMetrics?.satisfaction?.neutral?.count || 0}
                    total={satisfactionMetrics?.summary?.totalFeedbacks || 0}
                  />
                  <DistributionBar
                    label="Dissatisfied"
                    value={satisfactionMetrics?.satisfaction?.dissatisfied?.count || 0}
                    total={satisfactionMetrics?.summary?.totalFeedbacks || 0}
                  />
                </div>
              </GlassCard>

              <GlassCard>
                <h3 style={{ marginBottom: '0.8rem' }}>Top Feedback Categories</h3>
                {(satisfactionMetrics?.categoryDistribution || []).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No categorized feedback in selected time window.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {satisfactionMetrics.categoryDistribution.map((item) => (
                      <span
                        key={`category-${item.category}`}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '999px',
                          border: '1px solid var(--border-color)',
                          background: 'rgba(255,255,255,0.04)',
                          fontSize: '0.82rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {item.category} ({item.count})
                      </span>
                    ))}
                  </div>
                )}
              </GlassCard>
            </>
          )}
        </>
      )}

      {isAdmin && activeTab === 'reports' && (
        <>
          <GlassCard style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <div>
                <h3 style={{ marginBottom: '0.5rem' }}>Generate Weekly/Monthly Reports</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Generate analytics snapshots for the most recently completed period.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={reportPeriodType}
                  onChange={(e) => setReportPeriodType(e.target.value)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(0,0,0,0.2)',
                    color: 'inherit',
                  }}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <input
                    type="checkbox"
                    checked={forceRegeneration}
                    onChange={(e) => setForceRegeneration(e.target.checked)}
                  />
                  Force regenerate
                </label>

                <button
                  onClick={handleGenerateReport}
                  disabled={loading}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(34,197,94,0.5)',
                    background: 'rgba(34,197,94,0.18)',
                    color: '#4ade80',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Calendar size={15} /> Generate
                </button>

                <button
                  onClick={() => fetchReports()}
                  style={{
                    padding: '9px 13px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(255,255,255,0.04)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <RefreshCw size={15} /> Refresh
                </button>
              </div>
            </div>
          </GlassCard>

          {loading && reports.length === 0 ? (
            <div className="page-container center-content">Loading reports...</div>
          ) : reports.length === 0 ? (
            <GlassCard style={{ textAlign: 'center', padding: '2rem' }}>
              <FileSpreadsheet size={38} style={{ margin: '0 auto 0.7rem', color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-muted)' }}>No generated reports available yet.</p>
            </GlassCard>
          ) : (
            <GlassCard style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 8px' }}>Period</th>
                    <th style={{ padding: '10px 8px' }}>Window</th>
                    <th style={{ padding: '10px 8px' }}>Feedbacks</th>
                    <th style={{ padding: '10px 8px' }}>Avg Rating</th>
                    <th style={{ padding: '10px 8px' }}>Satisfaction</th>
                    <th style={{ padding: '10px 8px' }}>Generated</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 8px', textTransform: 'capitalize' }}>{report.periodType}</td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                        {formatDate(report.periodStart)} - {formatDate(report.periodEnd)}
                      </td>
                      <td style={{ padding: '10px 8px' }}>{report.summary?.totalFeedbacks || 0}</td>
                      <td style={{ padding: '10px 8px' }}>{report.summary?.averageRating || 0}</td>
                      <td style={{ padding: '10px 8px' }}>{report.summary?.satisfactionIndex || 0}</td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-muted)', fontSize: '0.84rem' }}>{formatDate(report.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
};

function AdminDayFilter({ days, onChange, onRefresh }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Time window:</label>
        <select
          value={days}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            padding: '8px 10px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'rgba(0,0,0,0.2)',
            color: 'inherit',
          }}
        >
          {daysOptions.map((day) => (
            <option key={`admin-days-${day}`} value={day}>{day} days</option>
          ))}
        </select>
      </div>

      <button
        onClick={onRefresh}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '9px 13px',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          background: 'rgba(255,255,255,0.04)',
          color: 'var(--text-muted)',
        }}
      >
        <RefreshCw size={15} /> Refresh
      </button>
    </div>
  );
}

export default FeedbackCenter;
