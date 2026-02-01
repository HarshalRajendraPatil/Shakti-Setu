import { useState, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { User, Calendar, MapPin, Phone, Mail, Lock } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { useTTS } from '../../hooks/useTTS';
import { fetchDemographicInsights } from '../../services/api';
import { registerUser } from '../../store/slices/authSlice';
import GlassCard from '../common/GlassCard';
import InputField from '../common/InputField';
import StateDropdown from '../common/StateDropdown';

const Register = () => {
  const dispatch = useDispatch();
  const { t, setUser, setPage, language, registerForm, setRegisterForm, setDashboardData } = useContext(AppContext);
  const { speak } = useTTS();
  const { loading, error } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    age: '',
    state: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Register user
    const result = await dispatch(registerUser(formData));
    
    if (registerUser.fulfilled.match(result)) {
      // Set user in context
      setUser(result.payload.user);
      setRegisterForm({
        name: formData.name,
        age: formData.age,
        state: formData.state,
        phone: formData.phone,
      });

      // Fetch dashboard data
      const data = await fetchDemographicInsights(formData.age, formData.state);
      setDashboardData(data);
      
      setPage('dashboard');
    }
  };

  return (
    <div className="page-container center-content">
      <GlassCard className="register-card">
        <div className="register-header">
          <h2>{t.registerTitle}</h2>
          <p>{t.registerIntro}</p>
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
            label={t.registerName} 
            type="text" 
            required
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})}
            placeholder="e.g. Priya Sharma" 
            onSpeak={() => speak(t.registerName, language)}
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
            icon={Calendar} 
            label={t.registerAge} 
            type="number" 
            required
            value={formData.age} 
            onChange={e => setFormData({...formData, age: e.target.value})}
            placeholder="e.g. 28" 
            onSpeak={() => speak(t.registerAge, language)}
          />
          <StateDropdown
            value={formData.state}
            onChange={e => setFormData({...formData, state: e.target.value})}
            label={t.registerState}
            onSpeak={() => speak(t.registerState, language)}
            language={language}
          />
          <InputField 
            icon={Phone} 
            label={t.registerPhone} 
            type="tel" 
            required
            value={formData.phone} 
            onChange={e => setFormData({...formData, phone: e.target.value})}
            placeholder="e.g. 9876543210" 
            onSpeak={() => speak(t.registerPhone, language)}
          />
          <button type="submit" className="btn-primary full-width" disabled={loading}>
            {loading ? t.registerLoading : t.registerButton}
          </button>
          <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <button 
              type="button" 
              onClick={() => setPage('login')}
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

export default Register;
