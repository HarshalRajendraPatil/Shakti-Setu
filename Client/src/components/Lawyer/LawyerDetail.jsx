import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { getLawyerById, getUserConsultations } from '../../store/slices/consultationSlice';
import { reportAPI, authAPI } from '../../services/api';
import GlassCard from '../common/GlassCard';
import ConsultationRequest from '../Consultation/ConsultationRequest';
import { Star, MapPin, Phone, Mail, Briefcase, Scale, ArrowLeft, Clock, Flag, Bookmark, BookmarkCheck } from 'lucide-react';

const LawyerDetail = ({ lawyerId }) => {
  const dispatch = useDispatch();
  const { setPage, openForFollowUp, setOpenForFollowUp } = useContext(AppContext);
  const { lawyerDetail, reviews, consultations, loading } = useSelector((state) => state.consultation);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { isAuthenticated: isLawyerAuthenticated, lawyer } = useSelector((state) => state.lawyer);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [preFilledSubject, setPreFilledSubject] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedToggling, setSavedToggling] = useState(false);

  // Check if user is trying to consult themselves
  const isSelfConsultation = isLawyerAuthenticated && (lawyer?.id === lawyerId || lawyer?._id === lawyerId);

  // User cannot request again if they already have a pending consultation with this lawyer (no response yet)
  const lawyerIdMatch = (c) => (c.lawyer?._id?.toString?.() || c.lawyer?.id) === (lawyerId?.toString?.() || lawyerId);
  const hasPendingWithThisLawyer = isAuthenticated && !isLawyerAuthenticated && consultations?.some(
    (c) => lawyerIdMatch(c) && c.status === 'pending'
  );

  useEffect(() => {
    if (lawyerId) {
      dispatch(getLawyerById(lawyerId));
    }
  }, [dispatch, lawyerId]);

  useEffect(() => {
    if (isAuthenticated && !isLawyerAuthenticated && lawyerId) {
      dispatch(getUserConsultations());
    }
  }, [dispatch, isAuthenticated, isLawyerAuthenticated, lawyerId]);

  // Open request form with pre-filled subject when user chose "Request follow-up" from My Consultations
  useEffect(() => {
    const lid = openForFollowUp?.lawyerId?._id ?? openForFollowUp?.lawyerId;
    if (openForFollowUp && lid != null && String(lid) === String(lawyerId)) {
      setShowRequestForm(true);
      setPreFilledSubject(openForFollowUp.subject || '');
      setOpenForFollowUp(null);
    }
  }, [lawyerId, openForFollowUp, setOpenForFollowUp]);

  useEffect(() => {
    if (!isAuthenticated || isLawyerAuthenticated || !lawyerId) return;
    authAPI.getSavedLawyers()
      .then((res) => {
        const ids = (res.data.lawyers || []).map((l) => l._id?.toString?.() || l.id?.toString?.());
        setIsSaved(ids.includes(lawyerId.toString()));
      })
      .catch(() => {});
  }, [isAuthenticated, isLawyerAuthenticated, lawyerId]);

  const handleToggleSaved = async () => {
    if (savedToggling) return;
    setSavedToggling(true);
    try {
      if (isSaved) {
        await authAPI.removeSavedLawyer(lawyerId);
        setIsSaved(false);
      } else {
        await authAPI.addSavedLawyer(lawyerId);
        setIsSaved(true);
      }
    } catch (e) {
      // ignore
    } finally {
      setSavedToggling(false);
    }
  };

  if (loading) {
    return <div className="page-container center-content">Loading...</div>;
  }

  if (!lawyerDetail) {
    return (
      <div className="page-container center-content">
        <GlassCard>
          <p>Lawyer not found</p>
          <button onClick={() => setPage('lawyers')} className="btn-primary" style={{ marginTop: '1rem' }}>
            Back to Lawyers
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <button
        onClick={() => setPage('lawyers')}
        style={{
          background: 'none',
          border: 'none',
          color: '#a855f7',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '1rem'
        }}
      >
        <ArrowLeft size={20} />
        Back to Lawyers
      </button>

      {showRequestForm ? (
        <ConsultationRequest
          lawyerId={lawyerId}
          onClose={() => { setShowRequestForm(false); setPreFilledSubject(''); }}
          initialSubject={preFilledSubject}
        />
      ) : (
        <>
          <GlassCard style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
              <div style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                background: 'var(--primary-grad)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 'bold',
                color: 'white',
                flexShrink: 0
              }}>
                {lawyerDetail.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ marginBottom: '0.5rem' }}>{lawyerDetail.name}</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  <Scale size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Bar No: {lawyerDetail.barNumber}
                </p>
                {lawyerDetail.averageRating > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Star size={18} color="#fbbf24" fill="#fbbf24" />
                    <span style={{ fontWeight: 'bold' }}>{lawyerDetail.averageRating.toFixed(1)}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      ({lawyerDetail.totalRatings} reviews)
                    </span>
                  </div>
                )}
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <Briefcase size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  {lawyerDetail.experience} years experience
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Location</p>
                <p style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} />
                  {lawyerDetail.city && `${lawyerDetail.city}, `}{lawyerDetail.state}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Phone</p>
                <a href={`tel:${lawyerDetail.phone}`} style={{ color: '#a855f7', textDecoration: 'none' }}>
                  <Phone size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  {lawyerDetail.phone}
                </a>
              </div>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Email</p>
                <a href={`mailto:${lawyerDetail.email}`} style={{ color: '#a855f7', textDecoration: 'none' }}>
                  <Mail size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  {lawyerDetail.email}
                </a>
              </div>
              {lawyerDetail.consultationFee > 0 && (
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Fee</p>
                  <p>₹{lawyerDetail.consultationFee}</p>
                </div>
              )}
            </div>

            {lawyerDetail.specialization && lawyerDetail.specialization.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Specializations:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {lawyerDetail.specialization.map((spec, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(168, 85, 247, 0.2)',
                        borderRadius: '16px',
                        color: '#a855f7',
                        fontSize: '0.85rem'
                      }}
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {lawyerDetail.bio && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>About:</p>
                <p style={{ lineHeight: '1.6', color: 'var(--text-muted)' }}>{lawyerDetail.bio}</p>
              </div>
            )}

            {isSelfConsultation ? (
              <button
                disabled
                className="btn-primary"
                style={{ 
                  width: '100%', 
                  marginTop: '1rem',
                  opacity: 0.5,
                  cursor: 'not-allowed'
                }}
              >
                Cannot Consult Yourself
              </button>
            ) : hasPendingWithThisLawyer ? (
              <div
                style={{
                  width: '100%',
                  marginTop: '1rem',
                  padding: '1rem',
                  background: 'rgba(251, 191, 36, 0.15)',
                  border: '1px solid rgba(251, 191, 36, 0.4)',
                  borderRadius: '8px',
                  color: '#fbbf24',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.95rem'
                }}
              >
                <Clock size={20} />
                You already have a pending request with this lawyer. Wait for their response before sending another.
              </div>
            ) : isAuthenticated ? (
              <button
                onClick={() => setShowRequestForm(true)}
                className="btn-primary"
                style={{ width: '100%', marginTop: '1rem' }}
              >
                Request Consultation
              </button>
            ) : (
              <button
                onClick={() => setPage('login')}
                className="btn-primary"
                style={{ width: '100%', marginTop: '1rem' }}
              >
                Login to Request Consultation
              </button>
            )}
            {isAuthenticated && !isLawyerAuthenticated && !isSelfConsultation && (
              <>
                <button
                  onClick={handleToggleSaved}
                  disabled={savedToggling}
                  style={{
                    width: '100%',
                    marginTop: '0.75rem',
                    padding: '10px 16px',
                    background: isSaved ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${isSaved ? 'rgba(251, 191, 36, 0.5)' : 'var(--border-color)'}`,
                    borderRadius: '8px',
                    color: isSaved ? '#fbbf24' : 'var(--text-muted)',
                    cursor: savedToggling ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '0.9rem'
                  }}
                >
                  {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                  {isSaved ? 'Saved' : 'Save lawyer'}
                </button>
                <button
                  onClick={() => setShowReportModal(true)}
                style={{
                  width: '100%',
                  marginTop: '0.75rem',
                  padding: '10px 16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px',
                  color: '#f87171',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '0.9rem'
                }}
              >
                <Flag size={18} />
                Report this lawyer
              </button>
              </>
            )}
          </GlassCard>

          {showReportModal && (
            <ReportLawyerModal
              lawyerName={lawyerDetail.name}
              reason={reportReason}
              setReason={setReportReason}
              description={reportDescription}
              setDescription={setReportDescription}
              submitting={reportSubmitting}
              success={reportSuccess}
              onClose={() => {
                setShowReportModal(false);
                setReportReason('');
                setReportDescription('');
                setReportSuccess(false);
              }}
              onSubmit={async () => {
                if (!reportReason.trim()) {
                  alert('Please enter a reason for the report');
                  return;
                }
                setReportSubmitting(true);
                try {
                  await reportAPI.reportLawyer(lawyerId, reportReason.trim(), reportDescription.trim());
                  setReportSuccess(true);
                  setTimeout(() => {
                    setShowReportModal(false);
                    setReportReason('');
                    setReportDescription('');
                    setReportSuccess(false);
                  }, 1500);
                } catch (e) {
                  alert(e.response?.data?.message || 'Failed to submit report');
                } finally {
                  setReportSubmitting(false);
                }
              }}
            />
          )}

          {reviews && reviews.length > 0 && (
            <GlassCard>
              <h3 style={{ marginBottom: '1rem' }}>Reviews ({reviews.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reviews.map((review) => (
                  <div
                    key={review._id}
                    style={{
                      padding: '1rem',
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--primary-grad)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.9rem',
                          fontWeight: 'bold'
                        }}>
                          {review.user?.name?.charAt(0) || 'U'}
                        </div>
                        <span>{review.user?.name || 'Anonymous'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={16} color="#fbbf24" fill="#fbbf24" />
                        <span>{review.rating}</span>
                      </div>
                    </div>
                    {review.review && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{review.review}</p>
                    )}
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
};

function ReportLawyerModal({
  lawyerName,
  reason,
  setReason,
  description,
  setDescription,
  submitting,
  success,
  onClose,
  onSubmit,
}) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <GlassCard style={{ maxWidth: '480px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flag size={22} color="#f87171" />
            Report lawyer
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Reporting: <strong>{lawyerName}</strong>. Your report will be reviewed by admin.
        </p>
        {success ? (
          <p style={{ color: '#22c55e', marginBottom: '1rem' }}>Report submitted successfully. Thank you.</p>
        ) : (
          <>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Reason for report *</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Unprofessional behaviour"
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'inherit',
                marginBottom: '1rem',
                fontSize: '1rem',
              }}
            />
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Additional details (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened..."
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'inherit',
                minHeight: '80px',
                resize: 'vertical',
                marginBottom: '1rem',
                fontSize: '0.95rem',
              }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '10px 20px', background: 'rgba(107, 114, 128, 0.2)', border: '1px solid #6b7280', borderRadius: '8px', color: '#6b7280', cursor: 'pointer' }}>Cancel</button>
              <button onClick={onSubmit} disabled={submitting || !reason.trim()} style={{ padding: '10px 20px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting || !reason.trim() ? 0.7 : 1 }}>{submitting ? 'Submitting...' : 'Submit Report'}</button>
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}

export default LawyerDetail;
