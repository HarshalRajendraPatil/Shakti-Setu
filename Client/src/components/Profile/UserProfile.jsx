import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { getCurrentUser, updateUserProfile } from '../../store/slices/authSlice';
import GlassCard from '../common/GlassCard';
import InputField from '../common/InputField';
import StateDropdown from '../common/StateDropdown';
import { User, Mail, Phone, Calendar, MapPin, Edit2, Save, X, MessageSquare, Bookmark, Eye, Trash2 } from 'lucide-react';
import { authAPI } from '../../services/api';

const UserProfile = () => {
  const dispatch = useDispatch();
  const { setPage, setOpenLawyerId } = useContext(AppContext);
  const { user, loading, error } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    age: '',
    state: '',
  });
  const [savedLawyers, setSavedLawyers] = useState([]);
  const [savedLawyersLoading, setSavedLawyersLoading] = useState(false);

  useEffect(() => {
    dispatch(getCurrentUser());
  }, [dispatch]);

  useEffect(() => {
    if (!user) return;
    setSavedLawyersLoading(true);
    authAPI.getSavedLawyers()
      .then((res) => setSavedLawyers(res.data.lawyers || []))
      .catch(() => setSavedLawyers([]))
      .finally(() => setSavedLawyersLoading(false));
  }, [user]);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        age: user.age?.toString() || '',
        state: user.state || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    const result = await dispatch(updateUserProfile({
      name: profileData.name,
      phone: profileData.phone,
      age: parseInt(profileData.age, 10) || 0,
      state: profileData.state,
    }));
    if (updateUserProfile.fulfilled.match(result)) {
      setIsEditing(false);
    }
  };

  if (!user) {
    return (
      <div className="page-container center-content">
        {loading ? 'Loading...' : 'Please log in to view your profile.'}
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2>My Profile</h2>
        <p style={{ color: 'var(--text-muted)' }}>Manage your account and view your consultations</p>
      </div>

      <GlassCard style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'var(--primary-grad)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                fontWeight: 'bold',
                color: 'white',
              }}
            >
              {user.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 style={{ marginBottom: '0.25rem' }}>{user.name}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{user.email}</p>
              {user.role === 'admin' && (
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: '0.5rem',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    background: 'rgba(168, 85, 247, 0.2)',
                    color: '#a855f7',
                  }}
                >
                  Admin
                </span>
              )}
            </div>
          </div>
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
                gap: '8px',
              }}
            >
              <Edit2 size={16} />
              Edit Profile
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  background: '#22c55e',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Save size={16} />
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setProfileData({
                    name: user.name || '',
                    phone: user.phone || '',
                    age: user.age?.toString() || '',
                    state: user.state || '',
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
                  gap: '8px',
                }}
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          )}
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #ef4444',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '1rem',
              color: '#ef4444',
            }}
          >
            {error}
          </div>
        )}

        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <InputField
              icon={User}
              label="Name"
              type="text"
              required
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              placeholder="Your name"
            />
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.9rem' }}>
                <Mail size={16} color="var(--text-muted)" />
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-muted)',
                  cursor: 'not-allowed',
                }}
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Email cannot be changed
              </p>
            </div>
            <InputField
              icon={Phone}
              label="Phone"
              type="tel"
              required
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              placeholder="e.g. 9876543210"
            />
            <InputField
              icon={Calendar}
              label="Age"
              type="number"
              required
              min="1"
              value={profileData.age}
              onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
              placeholder="e.g. 28"
            />
            <StateDropdown
              value={profileData.state}
              onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
              label="State"
            />
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
              <Mail size={18} color="var(--text-muted)" />
              <span><strong>Email:</strong> {user.email}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
              <Phone size={18} color="var(--text-muted)" />
              <span><strong>Phone:</strong> {user.phone}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
              <Calendar size={18} color="var(--text-muted)" />
              <span><strong>Age:</strong> {user.age}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
              <MapPin size={18} color="var(--text-muted)" />
              <span><strong>State:</strong> {user.state}</span>
            </div>
          </div>
        )}
      </GlassCard>

      <GlassCard style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>My Consultations</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          View all your consultation requests and their status
        </p>
        <button
          onClick={() => setPage('my-consultations')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: 'rgba(168, 85, 247, 0.2)',
            border: '1px solid #a855f7',
            borderRadius: '8px',
            color: '#a855f7',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          <MessageSquare size={20} />
          View My Consultations
        </button>
      </GlassCard>

      <GlassCard>
        <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bookmark size={20} color="#fbbf24" />
          Saved Lawyers
        </h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Lawyers you saved for later. View their profile or remove from list.
        </p>
        {savedLawyersLoading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : savedLawyers.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No saved lawyers yet. Save lawyers from Find Lawyers to see them here.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {savedLawyers.map((lawyer) => (
              <div
                key={lawyer._id || lawyer.id}
                style={{
                  padding: '12px 14px',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '2px' }}>{lawyer.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Bar: {lawyer.barNumber}
                    {lawyer.specialization?.length ? ` • ${lawyer.specialization.join(', ')}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setOpenLawyerId?.(lawyer._id || lawyer.id);
                      setPage('lawyers');
                    }}
                    style={{
                      padding: '8px 14px',
                      background: 'rgba(168, 85, 247, 0.2)',
                      border: '1px solid #a855f7',
                      borderRadius: '8px',
                      color: '#a855f7',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.85rem',
                    }}
                  >
                    <Eye size={16} />
                    View
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await authAPI.removeSavedLawyer(lawyer._id || lawyer.id);
                        setSavedLawyers((prev) => prev.filter((l) => (l._id || l.id) !== (lawyer._id || lawyer.id)));
                      } catch (e) {
                        // ignore
                      }
                    }}
                    style={{
                      padding: '8px 14px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '8px',
                      color: '#f87171',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.85rem',
                    }}
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default UserProfile;
