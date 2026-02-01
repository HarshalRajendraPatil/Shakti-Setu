import { useState, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock } from 'lucide-react';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { fetchDemographicInsights } from '../../services/api';
import { AppContext } from '../../context/AppContext';
import GlassCard from '../common/GlassCard';
import InputField from '../common/InputField';

const Login = () => {
  const dispatch = useDispatch();
  const { t, setPage, language, setUser, setDashboardData } = useContext(AppContext);
  const { loading, error } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(loginUser(formData));
    if (loginUser.fulfilled.match(result)) {
      setUser(result.payload.user);
      // Fetch dashboard data
      const data = await fetchDemographicInsights(result.payload.user.age, result.payload.user.state);
      setDashboardData(data);
      setPage('dashboard');
    }
  };

  return (
    <div className="page-container center-content">
      <GlassCard className="register-card">
        <div className="register-header">
          <h2>Login</h2>
          <p>Welcome back! Please login to continue.</p>
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
            Don't have an account?{' '}
            <button 
              type="button" 
              onClick={() => setPage('register')}
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

export default Login;
