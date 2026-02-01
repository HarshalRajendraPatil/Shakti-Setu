import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getLawyerConsultations, updateConsultationStatus } from '../../store/slices/consultationSlice';
import GlassCard from '../common/GlassCard';
import { CheckCircle, XCircle, Clock, MessageSquare, User, Calendar, Phone, Video, Mail, MapPin } from 'lucide-react';

const ConsultationManagement = () => {
  const dispatch = useDispatch();
  const { consultations, loading } = useSelector((state) => state.consultation);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [actionType, setActionType] = useState(''); // 'accept' or 'reject'

  useEffect(() => {
    dispatch(getLawyerConsultations(selectedStatus));
  }, [dispatch, selectedStatus]);

  const handleStatusChange = async (consultationId, status) => {
    if (status === 'accepted' || status === 'rejected') {
      setSelectedConsultation(consultationId);
      setActionType(status);
      setResponseText('');
      return;
    }

    // For completed or cancelled, no response needed
    if (window.confirm(`Are you sure you want to ${status} this consultation?`)) {
      await dispatch(updateConsultationStatus({ 
        consultationId, 
        status, 
        lawyerResponse: '' 
      }));
      dispatch(getLawyerConsultations(selectedStatus));
    }
  };

  const handleSubmitResponse = async () => {
    if (!responseText.trim() && actionType === 'accepted') {
      alert('Please provide a response message');
      return;
    }

    if (window.confirm(`Are you sure you want to ${actionType} this consultation?`)) {
      await dispatch(updateConsultationStatus({ 
        consultationId: selectedConsultation, 
        status: actionType, 
        lawyerResponse: responseText 
      }));
      setSelectedConsultation(null);
      setResponseText('');
      setActionType('');
      dispatch(getLawyerConsultations(selectedStatus));
    }
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

  if (loading) {
    return <div className="page-container center-content">Loading consultations...</div>;
  }

  return (
    <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2>Consultation Requests</h2>
        <p style={{ color: 'var(--text-muted)' }}>Manage consultation requests from users</p>
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

      {/* Response Modal */}
      {selectedConsultation && (
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
          <GlassCard style={{ maxWidth: '600px', width: '100%' }}>
            <h3 style={{ marginBottom: '1rem' }}>
              {actionType === 'accepted' ? 'Accept' : 'Reject'} Consultation Request
            </h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                {actionType === 'accepted' 
                  ? 'Response Message (Optional but recommended)' 
                  : 'Rejection Reason (Optional)'}
              </label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder={actionType === 'accepted' 
                  ? 'Add any additional information or instructions for the user...' 
                  : 'Provide a reason for rejection...'}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'inherit',
                  minHeight: '120px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setSelectedConsultation(null);
                  setResponseText('');
                  setActionType('');
                }}
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
                onClick={handleSubmitResponse}
                style={{
                  padding: '10px 20px',
                  background: actionType === 'accepted' 
                    ? 'rgba(34, 197, 94, 0.2)' 
                    : 'rgba(239, 68, 68, 0.2)',
                  border: `1px solid ${actionType === 'accepted' ? '#22c55e' : '#ef4444'}`,
                  borderRadius: '8px',
                  color: actionType === 'accepted' ? '#22c55e' : '#ef4444',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {actionType === 'accepted' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                {actionType === 'accepted' ? 'Accept' : 'Reject'}
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Consultations List */}
      {consultations.length === 0 ? (
        <GlassCard style={{ textAlign: 'center', padding: '3rem' }}>
          <Clock size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>
            {selectedStatus ? `No ${selectedStatus} consultations` : 'No consultations yet'}
          </p>
        </GlassCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {consultations.map((consultation) => {
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
                        {consultation.user?.name || 'Unknown User'}
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
                  <p style={{ marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Description:</p>
                  <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{consultation.description}</p>
                </div>

                {consultation.lawyerResponse && (
                  <div style={{ 
                    padding: '1rem', 
                    background: 'rgba(168, 85, 247, 0.1)', 
                    borderRadius: '8px', 
                    marginBottom: '1rem',
                    border: '1px solid rgba(168, 85, 247, 0.3)'
                  }}>
                    <p style={{ marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem', color: '#a855f7' }}>
                      Your Response:
                    </p>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{consultation.lawyerResponse}</p>
                  </div>
                )}

                {consultation.user && (
                  <div style={{ 
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    fontSize: '0.85rem'
                  }}>
                    <p style={{ marginBottom: '0.25rem' }}>
                      <strong>User:</strong> {consultation.user.name}
                    </p>
                    <p style={{ marginBottom: '0.25rem' }}>
                      <strong>Email:</strong> {consultation.user.email}
                    </p>
                    {consultation.user.phone && (
                      <p>
                        <strong>Phone:</strong> {consultation.user.phone}
                      </p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {consultation.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleStatusChange(consultation._id, 'accepted')}
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
                        fontSize: '0.9rem'
                      }}
                    >
                      <CheckCircle size={18} />
                      Accept
                    </button>
                    <button
                      onClick={() => handleStatusChange(consultation._id, 'rejected')}
                      style={{
                        padding: '10px 20px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid #ef4444',
                        borderRadius: '8px',
                        color: '#ef4444',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <XCircle size={18} />
                      Reject
                    </button>
                  </div>
                )}

                {consultation.status === 'accepted' && (
                  <button
                    onClick={() => handleStatusChange(consultation._id, 'completed')}
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
                    <CheckCircle size={18} />
                    Mark as Completed
                  </button>
                )}

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
                </p>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ConsultationManagement;
