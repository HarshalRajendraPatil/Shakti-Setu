import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { getCurrentLawyer, updateProfile, getLawyerStats } from '../../store/slices/lawyerSlice';
import { getLawyerConsultations } from '../../store/slices/consultationSlice';
import GlassCard from '../common/GlassCard';
import ConsultationManagement from './ConsultationManagement';
import { Star, Briefcase, Users, Clock, TrendingUp, Edit2, Save, X, MessageSquare, BarChart3 } from 'lucide-react';

const LawyerProfile = () => {
  const dispatch = useDispatch();
  const { setPage } = useContext(AppContext);
  const { lawyer, loading } = useSelector((state) => state.lawyer);
  const { consultations } = useSelector((state) => state.consultation);
  const [stats, setStats] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'consultations'
  const [profileData, setProfileData] = useState({
    bio: '',
    education: [],
    languages: [],
    consultationFee: 0,
    availability: {}
  });

  useEffect(() => {
    dispatch(getCurrentLawyer());
  }, [dispatch]);

  useEffect(() => {
    if (lawyer) {
      setProfileData({
        bio: lawyer.bio || '',
        education: lawyer.education || [],
        languages: lawyer.languages || ['English', 'Hindi'],
        consultationFee: lawyer.consultationFee || 0,
        availability: lawyer.availability || {}
      });
      if (lawyer.id) {
        dispatch(getLawyerStats()).then((result) => {
          if (getLawyerStats.fulfilled.match(result)) {
            setStats(result.payload.stats);
          }
        });
        dispatch(getLawyerConsultations());
      }
    }
  }, [lawyer, dispatch]);

  const handleSave = async () => {
    await dispatch(updateProfile(profileData));
    setIsEditing(false);
    dispatch(getCurrentLawyer());
  };

  if (loading || !lawyer) {
    return <div className="page-container center-content">Loading...</div>;
  }

  return (
    <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2>Profile</h2>
        <p style={{ color: 'var(--text-muted)' }}>Manage your lawyer profile, stats, and consultation requests</p>
        <button
          onClick={() => setPage('feedback')}
          style={{
            marginTop: '0.9rem',
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(59, 130, 246, 0.45)',
            background: 'rgba(59, 130, 246, 0.16)',
            color: '#60a5fa',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem'
          }}
        >
          <BarChart3 size={16} />
          Open Feedback Analytics
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)' }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'profile' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'profile' ? '2px solid #a855f7' : '2px solid transparent',
            color: activeTab === 'profile' ? '#a855f7' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: activeTab === 'profile' ? '600' : '400'
          }}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('consultations')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'consultations' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'consultations' ? '2px solid #a855f7' : '2px solid transparent',
            color: activeTab === 'consultations' ? '#a855f7' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: activeTab === 'consultations' ? '600' : '400',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <MessageSquare size={18} />
          Consultations
          {stats && stats.pendingConsultations > 0 && (
            <span style={{
              padding: '2px 8px',
              borderRadius: '12px',
              background: '#fbbf24',
              color: '#000',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>
              {stats.pendingConsultations}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'consultations' ? (
        <ConsultationManagement />
      ) : (
        <>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <GlassCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: 'var(--primary-grad)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: 'white'
            }}>
              {lawyer.name.charAt(0)}
            </div>
            <div>
              <h3>{lawyer.name}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                {lawyer.status === 'approved' ? '✓ Verified' : '⏳ Pending Approval'}
              </p>
            </div>
          </div>
          {lawyer.averageRating > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Star size={20} color="#fbbf24" fill="#fbbf24" />
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{lawyer.averageRating.toFixed(1)}</span>
              <span style={{ color: 'var(--text-muted)' }}>({lawyer.totalRatings} reviews)</span>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Experience</p>
              <p style={{ fontWeight: 'bold' }}>{lawyer.experience} years</p>
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Consultations</p>
              <p style={{ fontWeight: 'bold' }}>{lawyer.totalConsultations || 0}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Statistics</h3>
          </div>
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <Clock size={24} color="#a855f7" style={{ marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pending</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.pendingConsultations}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Users size={24} color="#22c55e" style={{ marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Accepted</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.acceptedConsultations}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Briefcase size={24} color="#3b82f6" style={{ marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Completed</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.completedConsultations}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <TrendingUp size={24} color="#f59e0b" style={{ marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalConsultations}</p>
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      <GlassCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Profile Information</h3>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: '8px 16px',
                background: 'rgba(168, 85, 247, 0.2)',
                border: '1px solid #a855f7',
                borderRadius: '8px',
                color: '#a855f7',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Edit2 size={16} />
              Edit
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleSave}
                style={{
                  padding: '8px 16px',
                  background: '#22c55e',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Save size={16} />
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setProfileData({
                    bio: lawyer.bio || '',
                    education: lawyer.education || [],
                    languages: lawyer.languages || ['English', 'Hindi'],
                    consultationFee: lawyer.consultationFee || 0,
                    availability: lawyer.availability || {}
                  });
                }}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  color: '#ef4444',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Bio</label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'inherit',
                  minHeight: '100px',
                  resize: 'vertical'
                }}
                placeholder="Tell us about yourself..."
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Consultation Fee (₹)</label>
              <input
                type="number"
                value={profileData.consultationFee}
                onChange={(e) => setProfileData({...profileData, consultationFee: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'inherit'
                }}
              />
            </div>
          </div>
        ) : (
          <div>
            {lawyer.bio && <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>{lawyer.bio}</p>}
            {lawyer.consultationFee > 0 && (
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Consultation Fee:</strong> ₹{lawyer.consultationFee}
              </p>
            )}
            {lawyer.languages && lawyer.languages.length > 0 && (
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Languages:</strong> {lawyer.languages.join(', ')}
              </p>
            )}
            {lawyer.education && lawyer.education.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <strong>Education:</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  {lawyer.education.map((edu, idx) => (
                    <li key={idx}>{edu}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </GlassCard>

      <GlassCard style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Recent Consultations</h3>
        {consultations.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            No consultations yet
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {consultations.slice(0, 5).map((consultation) => (
              <div
                key={consultation._id}
                style={{
                  padding: '1rem',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>{consultation.subject}</strong>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    background: consultation.status === 'pending' ? 'rgba(251, 191, 36, 0.2)' :
                                 consultation.status === 'accepted' ? 'rgba(34, 197, 94, 0.2)' :
                                 consultation.status === 'completed' ? 'rgba(59, 130, 246, 0.2)' :
                                 'rgba(239, 68, 68, 0.2)',
                    color: consultation.status === 'pending' ? '#fbbf24' :
                           consultation.status === 'accepted' ? '#22c55e' :
                           consultation.status === 'completed' ? '#3b82f6' :
                           '#ef4444'
                  }}>
                    {consultation.status}
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  {consultation.user?.name} • {consultation.consultationType}
                </p>
                <p style={{ fontSize: '0.85rem' }}>{consultation.description.substring(0, 100)}...</p>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
        </>
      )}
    </div>
  );
};

export default LawyerProfile;
