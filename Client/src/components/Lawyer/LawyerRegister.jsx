import { useState, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { User, Mail, Lock, Phone, Scale, MapPin, Briefcase, FileText } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { useTTS } from '../../hooks/useTTS';
import { registerLawyer } from '../../store/slices/lawyerSlice';
import GlassCard from '../common/GlassCard';
import InputField from '../common/InputField';
import StateDropdown from '../common/StateDropdown';
import { LAWYER_SPECIALIZATIONS } from '../../constants/lawyerSpecializations';

const LawyerRegister = () => {
  const dispatch = useDispatch();
  const { t, setPage, language } = useContext(AppContext);
  const { speak } = useTTS();
  const { loading, error } = useSelector((state) => state.lawyer);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    barNumber: '',
    specialization: [],
    experience: '',
    state: '',
    city: '',
    address: '',
  });

  const handleSpecializationChange = (spec) => {
    setFormData(prev => ({
      ...prev,
      specialization: prev.specialization.includes(spec)
        ? prev.specialization.filter(s => s !== spec)
        : [...prev.specialization, spec]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.specialization.length === 0) {
      alert('Please select at least one specialization');
      return;
    }

    const result = await dispatch(registerLawyer(formData));
    
    if (registerLawyer.fulfilled.match(result)) {
      alert('Registration successful! Waiting for admin approval.');
      setPage('lawyer-login');
    }
  };

  return (
    <div className="page-container center-content">
      <GlassCard className="register-card" style={{ maxWidth: '600px' }}>
        <div className="register-header">
          <h2>Lawyer Registration</h2>
          <p>Register as a lawyer to help women with legal issues</p>
        </div>

        {error && (
          <div className="error-message" style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid #ef4444', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '1rem',
            color: '#ef4444'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <InputField 
            icon={User} 
            label="Full Name" 
            type="text" 
            required
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})}
            placeholder="e.g. Adv. Priya Sharma" 
            onSpeak={() => speak("Full Name", language)}
          />
          <InputField 
            icon={Mail} 
            label="Email" 
            type="email" 
            required
            value={formData.email} 
            onChange={e => setFormData({...formData, email: e.target.value})}
            placeholder="your.email@example.com" 
            onSpeak={() => speak("Email", language)}
          />
          <InputField 
            icon={Lock} 
            label="Password" 
            type="password" 
            required
            value={formData.password} 
            onChange={e => setFormData({...formData, password: e.target.value})}
            placeholder="Minimum 6 characters" 
            onSpeak={() => speak("Password", language)}
          />
          <InputField 
            icon={Phone} 
            label="Phone Number" 
            type="tel" 
            required
            value={formData.phone} 
            onChange={e => setFormData({...formData, phone: e.target.value})}
            placeholder="e.g. 9876543210" 
            onSpeak={() => speak("Phone Number", language)}
          />
          <InputField 
            icon={FileText} 
            label="Bar Number" 
            type="text" 
            required
            value={formData.barNumber} 
            onChange={e => setFormData({...formData, barNumber: e.target.value})}
            placeholder="e.g. BAR/2020/12345" 
            onSpeak={() => speak("Bar Number", language)}
          />
          <StateDropdown
            value={formData.state}
            onChange={e => setFormData({...formData, state: e.target.value})}
            label="State/Region"
            onSpeak={() => speak("State", language)}
            language={language}
          />
          <InputField 
            icon={MapPin} 
            label="City" 
            type="text" 
            value={formData.city} 
            onChange={e => setFormData({...formData, city: e.target.value})}
            placeholder="e.g. Mumbai" 
            onSpeak={() => speak("City", language)}
          />
          <InputField 
            icon={Briefcase} 
            label="Address (Optional)" 
            type="text" 
            value={formData.address} 
            onChange={e => setFormData({...formData, address: e.target.value})}
            placeholder="Office address" 
            onSpeak={() => speak("Address", language)}
          />
          <InputField 
            icon={Briefcase} 
            label="Years of Experience" 
            type="number" 
            required
            min="0"
            value={formData.experience} 
            onChange={e => setFormData({...formData, experience: e.target.value})}
            placeholder="e.g. 5" 
            onSpeak={() => speak("Experience", language)}
          />
          
          <div className="input-group">
            <label style={{ marginBottom: '10px' }}>Specialization (Select at least one) *</label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
              gap: '10px',
              maxHeight: '200px',
              overflowY: 'auto',
              padding: '10px',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              {LAWYER_SPECIALIZATIONS.map((spec) => (
                <label key={spec} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.specialization.includes(spec)}
                    onChange={() => handleSpecializationChange(spec)}
                    style={{ cursor: 'pointer' }}
                  />
                  {spec}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary full-width" disabled={loading}>
            {loading ? 'Registering...' : 'Register as Lawyer'}
          </button>
          <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)' }}>
            Already registered?{' '}
            <button 
              type="button" 
              onClick={() => setPage('lawyer-login')}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#a855f7', 
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Login here
            </button>
          </p>
        </form>
      </GlassCard>
    </div>
  );
};

export default LawyerRegister;
