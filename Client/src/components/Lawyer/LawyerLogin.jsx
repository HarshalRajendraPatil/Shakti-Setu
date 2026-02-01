import { useState, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock } from 'lucide-react';
import { loginLawyer } from '../../store/slices/lawyerSlice';
import { AppContext } from '../../context/AppContext';
import GlassCard from '../common/GlassCard';
import InputField from '../common/InputField';

const LawyerLogin = () => {
  const dispatch = useDispatch();
  const { t, setPage, language } = useContext(AppContext);
  const { loading, error, lawyer } = useSelector((state) => state.lawyer);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginLawyer(formData));
    
    if (loginLawyer.fulfilled.match(result)) {
      if (result.payload.lawyer.status === 'pending') {
        alert('Your registration is pending admin approval.');
      } else if (result.payload.lawyer.status === 'rejected') {
        alert('Your registration has been rejected. Please contact admin.');
      } else if (result.payload.lawyer.status === 'approved') {
        setPage('lawyer-dashboard');
      }
    }
  };

  return (
    <div className="page-container center-content">
      <GlassCard className="register-card">
        <div className="register-header">
          <h2>Lawyer Login</h2>
          <p>Login to your lawyer account</p>
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
            icon={Mail} 
            label="Email" 
            type="email" 
            required
            value={formData.email} 
            onChange={e => setFormData({...formData, email: e.target.value})}
            placeholder="your.email@example.com"
          />
          <InputField 
            icon={Lock} 
            label="Password" 
            type="password" 
            required
            value={formData.password} 
            onChange={e => setFormData({...formData, password: e.target.value})}
            placeholder="Enter your password"
          />
          <button type="submit" className="btn-primary full-width" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)' }}>
            Not registered?{' '}
            <button 
              type="button" 
              onClick={() => setPage('lawyer-register')}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#a855f7', 
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Register here
            </button>
          </p>
        </form>
      </GlassCard>
    </div>
  );
};

export default LawyerLogin;
