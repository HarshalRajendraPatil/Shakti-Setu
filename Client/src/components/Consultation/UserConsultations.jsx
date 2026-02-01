import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { getUserConsultations, cancelConsultation, addRating } from '../../store/slices/consultationSlice';
import { reportAPI } from '../../services/api';
import GlassCard from '../common/GlassCard';
import { CheckCircle, XCircle, Clock, MessageSquare, User, Calendar, Phone, Video, Mail, MapPin, Star, Trash2, Flag, RotateCcw } from 'lucide-react';

const UserConsultations = () => {
  const dispatch = useDispatch();
  const { setPage, setOpenLawyerId, setOpenForFollowUp } = useContext(AppContext);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { consultations, loading } = useSelector((state) => state.consultation);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(null);
  const [showReportModal, setShowReportModal] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getUserConsultations());
    }
  }, [dispatch, isAuthenticated]);

  const handleCancel = async (consultationId) => {
    if (window.confirm('Are you sure you want to cancel this consultation?')) {
      await dispatch(cancelConsultation(consultationId));
      dispatch(getUserConsultations());
    }
  };

  const handleRate = (consultation) => {
    setShowRatingModal(consultation);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return { bg: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' };
      case 'accepted': return { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' };
      case 'rejected': return { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' };
      case 'completed': return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' };
      case 'cancelled': return { bg: 'rgba(107, 114, 128, 0.2)', color: '#6b7280' };
      default: return { bg: 'rgba(255,255,255,0.1)', color: '#fff' };
    }
  };

  const getConsultationTypeIcon = (type) => {
    switch (type) {
      case 'phone': return Phone;
      case 'video': return Video;
      case 'in-person': return MapPin;
      case 'email': return Mail;
      default: return Phone;
    }
  };

  const filteredConsultations = selectedStatus 
    ? consultations.filter(c => c.status === selectedStatus)
    : consultations;

  if (!isAuthenticated) {
    return (
      <div className="page-container center-content">
        <GlassCard style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem' }}>
          <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
            Please log in to view your consultation requests.
          </p>
          <button onClick={() => setPage('login')} className="btn-primary">
            Go to Login
          </button>
        </GlassCard>
      </div>
    );
  }

  if (loading) {
    return <div className="page-container center-content">Loading consultations...</div>;
  }

  return (
    <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2>My Consultations</h2>
        <p style={{ color: 'var(--text-muted)' }}>View and manage your consultation requests</p>
      </div>

      {/* Status Filter */}
      <GlassCard style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedStatus('')}
            style={{
              padding: '8px 16px',
              background: selectedStatus === '' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(0,0,0,0.2)',
              border: `1px solid ${selectedStatus === '' ? '#a855f7' : 'var(--border-color)'}`,
              borderRadius: '8px',
              color: selectedStatus === '' ? '#a855f7' : 'inherit',
              cursor: 'pointer'
            }}
          >
            All
          </button>
          {['pending', 'accepted', 'completed', 'rejected', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              style={{
                padding: '8px 16px',
                background: selectedStatus === status ? 'rgba(168, 85, 247, 0.2)' : 'rgba(0,0,0,0.2)',
                border: `1px solid ${selectedStatus === status ? '#a855f7' : 'var(--border-color)'}`,
                borderRadius: '8px',
                color: selectedStatus === status ? '#a855f7' : 'inherit',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Consultations List */}
      {filteredConsultations.length === 0 ? (
        <GlassCard style={{ textAlign: 'center', padding: '3rem' }}>
          <Clock size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>
            {selectedStatus ? `No ${selectedStatus} consultations` : 'No consultations yet'}
          </p>
        </GlassCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredConsultations.map((consultation) => {
            const statusColor = getStatusColor(consultation.status);
            const TypeIcon = getConsultationTypeIcon(consultation.consultationType);
            
            return (
              <GlassCard key={consultation._id} style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>{consultation.subject}</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        <User size={16} />
                        {consultation.lawyer?.name || 'Unknown Lawyer'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        <TypeIcon size={16} />
                        {consultation.consultationType}
                      </div>
                      {consultation.preferredDate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                          <Calendar size={16} />
                          {new Date(consultation.preferredDate).toLocaleDateString()}
                          {consultation.preferredTime && ` at ${consultation.preferredTime}`}
                        </div>
                      )}
                    </div>
                  </div>
                  <span style={{
                    padding: '6px 16px',
                    borderRadius: '16px',
                    fontSize: '0.85rem',
                    background: statusColor.bg,
                    color: statusColor.color,
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    height: 'fit-content'
                  }}>
                    {consultation.status}
                  </span>
                </div>

                <div style={{ 
                  padding: '1rem', 
                  background: 'rgba(0,0,0,0.2)', 
                  borderRadius: '8px', 
                  marginBottom: '1rem' 
                }}>
                  <p style={{ marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Your Request:</p>
                  <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{consultation.description}</p>
                </div>

                {/* Lawyer Response */}
                {consultation.lawyerResponse && (
                  <div style={{ 
                    padding: '1rem', 
                    background: consultation.status === 'accepted' 
                      ? 'rgba(34, 197, 94, 0.1)' 
                      : consultation.status === 'rejected'
                      ? 'rgba(239, 68, 68, 0.1)'
                      : 'rgba(168, 85, 247, 0.1)', 
                    borderRadius: '8px', 
                    marginBottom: '1rem',
                    border: `1px solid ${consultation.status === 'accepted' 
                      ? 'rgba(34, 197, 94, 0.3)' 
                      : consultation.status === 'rejected'
                      ? 'rgba(239, 68, 68, 0.3)'
                      : 'rgba(168, 85, 247, 0.3)'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                      <MessageSquare size={18} color={consultation.status === 'accepted' ? '#22c55e' : consultation.status === 'rejected' ? '#ef4444' : '#a855f7'} />
                      <p style={{ fontWeight: 'bold', fontSize: '0.9rem', color: consultation.status === 'accepted' ? '#22c55e' : consultation.status === 'rejected' ? '#ef4444' : '#a855f7' }}>
                        Lawyer's Response:
                      </p>
                    </div>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{consultation.lawyerResponse}</p>
                    
                    {consultation.status === 'accepted' && (
                      <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px' }}>
                        <p style={{ fontSize: '0.85rem', color: '#22c55e', marginBottom: '0.5rem' }}>
                          ✓ Your consultation has been accepted! Contact the lawyer to proceed.
                        </p>
                        {consultation.lawyer && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            <p><strong>Lawyer:</strong> {consultation.lawyer.name}</p>
                            <p><strong>Phone:</strong> <a href={`tel:${consultation.lawyer.phone}`} style={{ color: '#a855f7' }}>{consultation.lawyer.phone}</a></p>
                            <p><strong>Email:</strong> <a href={`mailto:${consultation.lawyer.email}`} style={{ color: '#a855f7' }}>{consultation.lawyer.email}</a></p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {consultation.status === 'rejected' && (
                      <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                        <p style={{ fontSize: '0.85rem', color: '#ef4444' }}>
                          This consultation request has been rejected. You can request consultation from another lawyer.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Lawyer Info */}
                {consultation.lawyer && (
                  <div style={{ 
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    fontSize: '0.85rem'
                  }}>
                    <p style={{ marginBottom: '0.25rem' }}>
                      <strong>Lawyer:</strong> {consultation.lawyer.name}
                    </p>
                    <p style={{ marginBottom: '0.25rem' }}>
                      <strong>Bar Number:</strong> {consultation.lawyer.barNumber}
                    </p>
                    {consultation.lawyer.specialization && consultation.lawyer.specialization.length > 0 && (
                      <p>
                        <strong>Specialization:</strong> {consultation.lawyer.specialization.join(', ')}
                      </p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {consultation.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(consultation._id)}
                      style={{
                        padding: '10px 20px',
                        background: 'rgba(107, 114, 128, 0.2)',
                        border: '1px solid #6b7280',
                        borderRadius: '8px',
                        color: '#6b7280',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <Trash2 size={18} />
                      Cancel Request
                    </button>
                  )}
                  
                  {consultation.status === 'accepted' && (
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <a
                        href={`tel:${consultation.lawyer?.phone}`}
                        style={{
                          padding: '10px 20px',
                          background: 'rgba(34, 197, 94, 0.2)',
                          border: '1px solid #22c55e',
                          borderRadius: '8px',
                          color: '#22c55e',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.9rem',
                          textDecoration: 'none'
                        }}
                      >
                        <Phone size={18} />
                        Call Lawyer
                      </a>
                      <a
                        href={`mailto:${consultation.lawyer?.email}`}
                        style={{
                          padding: '10px 20px',
                          background: 'rgba(59, 130, 246, 0.2)',
                          border: '1px solid #3b82f6',
                          borderRadius: '8px',
                          color: '#3b82f6',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.9rem',
                          textDecoration: 'none'
                        }}
                      >
                        <Mail size={18} />
                        Email Lawyer
                      </a>
                    </div>
                  )}

                  {consultation.status === 'completed' && !consultation.rating && (
                    <button
                      onClick={() => handleRate(consultation)}
                      style={{
                        padding: '10px 20px',
                        background: 'rgba(251, 191, 36, 0.2)',
                        border: '1px solid #fbbf24',
                        borderRadius: '8px',
                        color: '#fbbf24',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <Star size={18} />
                      Rate & Review
                    </button>
                  )}

                  {consultation.rating && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px' }}>
                      <Star size={18} color="#fbbf24" fill="#fbbf24" />
                      <span style={{ fontWeight: 'bold' }}>Rated: {consultation.rating}/5</span>
                      {consultation.review && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>• {consultation.review}</span>
                      )}
                    </div>
                  )}
                  {consultation.status === 'completed' && consultation.lawyer && (
                    <button
                      onClick={() => {
                        const lid = consultation.lawyer?._id || consultation.lawyer;
                        if (lid) {
                          setOpenForFollowUp({ lawyerId: lid, subject: `Follow-up: ${consultation.subject}` });
                          setOpenLawyerId(lid);
                          setPage('lawyers');
                        }
                      }}
                      style={{
                        padding: '10px 20px',
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid #3b82f6',
                        borderRadius: '8px',
                        color: '#3b82f6',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <RotateCcw size={18} />
                      Request follow-up
                    </button>
                  )}
                  {consultation.lawyer && (
                    <button
                      onClick={() => setShowReportModal(consultation)}
                      style={{
                        padding: '8px 16px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: '8px',
                        color: '#f87171',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.85rem'
                      }}
                    >
                      <Flag size={16} />
                      Report this lawyer
                    </button>
                  )}
                </div>

                <p style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--text-muted)', 
                  marginTop: '1rem',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '0.75rem'
                }}>
                  Requested: {new Date(consultation.createdAt).toLocaleString()}
                  {consultation.respondedAt && (
                    <> • Responded: {new Date(consultation.respondedAt).toLocaleString()}</>
                  )}
                  {consultation.completedAt && (
                    <> • Completed: {new Date(consultation.completedAt).toLocaleString()}</>
                  )}
                </p>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Report Lawyer Modal */}
      {showReportModal && (
        <ReportLawyerModalInline
          lawyerName={showReportModal.lawyer?.name}
          lawyerId={showReportModal.lawyer?._id || showReportModal.lawyer}
          reason={reportReason}
          setReason={setReportReason}
          description={reportDescription}
          setDescription={setReportDescription}
          submitting={reportSubmitting}
          onClose={() => {
            setShowReportModal(null);
            setReportReason('');
            setReportDescription('');
          }}
          onSubmit={async () => {
            if (!reportReason.trim()) {
              alert('Please enter a reason for the report');
              return;
            }
            const lid = showReportModal.lawyer?._id || showReportModal.lawyer;
            if (!lid) return;
            setReportSubmitting(true);
            try {
              await reportAPI.reportLawyer(lid, reportReason.trim(), reportDescription.trim());
              setShowReportModal(null);
              setReportReason('');
              setReportDescription('');
            } catch (e) {
              alert(e.response?.data?.message || 'Failed to submit report');
            } finally {
              setReportSubmitting(false);
            }
          }}
        />
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <RatingModal 
          consultation={showRatingModal} 
          onClose={() => setShowRatingModal(null)}
          onSuccess={() => {
            setShowRatingModal(null);
            dispatch(getUserConsultations());
          }}
        />
      )}
    </div>
  );
};

// Report Lawyer Modal (inline for My Consultations)
function ReportLawyerModalInline({ lawyerName, lawyerId, reason, setReason, description, setDescription, submitting, onClose, onSubmit }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <GlassCard style={{ maxWidth: '480px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Flag size={22} color="#f87171" /> Report lawyer</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Reporting: <strong>{lawyerName || 'Lawyer'}</strong></p>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Reason *</label>
        <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Unprofessional behaviour" style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'inherit', marginBottom: '1rem', fontSize: '1rem' }} />
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Details (optional)</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what happened..." style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'inherit', minHeight: '80px', resize: 'vertical', marginBottom: '1rem', fontSize: '0.95rem' }} />
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'rgba(107, 114, 128, 0.2)', border: '1px solid #6b7280', borderRadius: '8px', color: '#6b7280', cursor: 'pointer' }}>Cancel</button>
          <button onClick={onSubmit} disabled={submitting || !reason.trim()} style={{ padding: '10px 20px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting || !reason.trim() ? 0.7 : 1 }}>{submitting ? 'Submitting...' : 'Submit Report'}</button>
        </div>
      </GlassCard>
    </div>
  );
}

// Rating Modal Component
const RatingModal = ({ consultation, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const { loading } = useSelector((state) => state.consultation);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    const result = await dispatch(addRating({ 
      consultationId: consultation._id, 
      rating, 
      review 
    }));

    if (addRating.fulfilled.match(result)) {
      onSuccess();
    }
  };

  return (
    <div style={{
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
      padding: '20px'
    }}>
      <GlassCard style={{ maxWidth: '500px', width: '100%' }}>
        <h3 style={{ marginBottom: '1rem' }}>Rate Your Consultation</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          How was your consultation experience with {consultation.lawyer?.name}?
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Rating *</label>
            <div style={{ display: 'flex', gap: '8px', fontSize: '2rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: (hoveredRating >= star || rating >= star) ? '#fbbf24' : '#6b7280'
                  }}
                >
                  <Star size={32} fill={(hoveredRating >= star || rating >= star) ? '#fbbf24' : 'transparent'} />
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Review (Optional)</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience..."
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'inherit',
                minHeight: '100px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'rgba(107, 114, 128, 0.2)',
                border: '1px solid #6b7280',
                borderRadius: '8px',
                color: '#6b7280',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || rating === 0}
              style={{
                padding: '10px 20px',
                background: 'rgba(251, 191, 36, 0.2)',
                border: '1px solid #fbbf24',
                borderRadius: '8px',
                color: '#fbbf24',
                cursor: loading || rating === 0 ? 'not-allowed' : 'pointer',
                opacity: loading || rating === 0 ? 0.5 : 1
              }}
            >
              {loading ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

export default UserConsultations;
