import { useEffect, useState, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MapPin, Phone, Mail, Briefcase, Scale, Search, Star, Eye } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { getApprovedLawyers } from '../../store/slices/lawyerSlice';
import { getLawyerById } from '../../store/slices/consultationSlice';
import GlassCard from '../common/GlassCard';
import LawyerDetail from './LawyerDetail';
import { INDIAN_STATES } from '../../constants/indianStates';
import { LAWYER_SPECIALIZATIONS } from '../../constants/lawyerSpecializations';

const LawyerListing = () => {
  const dispatch = useDispatch();
  const { t, language, setPage, openLawyerId, setOpenLawyerId } = useContext(AppContext);
  const { approvedLawyers, loading } = useSelector((state) => state.lawyer);
  const [selectedLawyerId, setSelectedLawyerId] = useState(null);
  const [filters, setFilters] = useState({
    state: '',
    specialization: '',
    search: '',
  });

  useEffect(() => {
    dispatch(getApprovedLawyers(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    if (openLawyerId) {
      setSelectedLawyerId(openLawyerId);
      dispatch(getLawyerById(openLawyerId));
      setOpenLawyerId(null);
    }
  }, [openLawyerId, setOpenLawyerId, dispatch]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleViewDetails = (lawyerId) => {
    setSelectedLawyerId(lawyerId);
    dispatch(getLawyerById(lawyerId));
  };

  if (selectedLawyerId) {
    return <LawyerDetail lawyerId={selectedLawyerId} />;
  }

  return (
    <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Find a Lawyer</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Connect with verified lawyers who can help you with your legal issues
        </p>

        <GlassCard style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by name or specialization..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'inherit',
                  fontSize: '1rem'
                }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>State</label>
                <select
                  value={filters.state}
                  onChange={(e) => handleFilterChange('state', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'inherit',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All States</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state.value} value={state.value}>{state.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Specialization</label>
                <select
                  value={filters.specialization}
                  onChange={(e) => handleFilterChange('specialization', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'inherit',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All Specializations</option>
                  {LAWYER_SPECIALIZATIONS.map((spec) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </GlassCard>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading lawyers...</div>
        ) : approvedLawyers.length === 0 ? (
          <GlassCard style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>No lawyers found matching your criteria.</p>
          </GlassCard>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {approvedLawyers.map((lawyer) => (
              <GlassCard key={lawyer._id || lawyer.id} style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ marginBottom: '0.5rem', color: '#a855f7' }}>{lawyer.name}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    <Scale size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    Bar No: {lawyer.barNumber}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <Briefcase size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    {lawyer.experience} years experience
                  </p>
                  {lawyer.averageRating > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '0.5rem' }}>
                      <Star size={14} color="#fbbf24" fill="#fbbf24" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                        {lawyer.averageRating.toFixed(1)}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ({lawyer.totalRatings})
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    {lawyer.city && `${lawyer.city}, `}{lawyer.state}
                  </p>
                  {lawyer.specialization && lawyer.specialization.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <p style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>Specializations:</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {lawyer.specialization.map((spec, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '0.75rem',
                              padding: '4px 8px',
                              background: 'rgba(168, 85, 247, 0.2)',
                              borderRadius: '4px',
                              color: '#a855f7'
                            }}
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <a
                    href={`tel:${lawyer.phone}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#a855f7',
                      textDecoration: 'none',
                      fontSize: '0.9rem'
                    }}
                  >
                    <Phone size={16} />
                    {lawyer.phone}
                  </a>
                  <a
                    href={`mailto:${lawyer.email}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#a855f7',
                      textDecoration: 'none',
                      fontSize: '0.9rem'
                    }}
                  >
                    <Mail size={16} />
                    {lawyer.email}
                  </a>
                  <button
                    onClick={() => handleViewDetails(lawyer._id || lawyer.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '8px',
                      background: 'rgba(168, 85, 247, 0.2)',
                      border: '1px solid #a855f7',
                      borderRadius: '8px',
                      color: '#a855f7',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      marginTop: '0.5rem'
                    }}
                  >
                    <Eye size={16} />
                    View Profile
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LawyerListing;
