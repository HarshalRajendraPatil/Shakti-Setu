import { useState, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { User, Calendar, MapPin, Phone, Mail, Lock, Scale, FileText, Briefcase } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { useTTS } from '../../hooks/useTTS';
import { registerUser, clearError as clearAuthError } from '../../store/slices/authSlice';
import { registerLawyer, clearError as clearLawyerError } from '../../store/slices/lawyerSlice';
import GlassCard from '../common/GlassCard';
import InputField from '../common/InputField';
import StateDropdown from '../common/StateDropdown';
import { LAWYER_SPECIALIZATIONS } from '../../constants/lawyerSpecializations';

const Register = () => {
  const dispatch = useDispatch();
  const { t, setUser, setPage, language, setRegisterForm } = useContext(AppContext);
  const { speak } = useTTS();
  const { loading: authLoading, error: authError } = useSelector((state) => state.auth);
  const { loading: lawyerLoading, error: lawyerError } = useSelector((state) => state.lawyer);

  const [mode, setMode] = useState('user'); // "user" | "lawyer"
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    age: '',
    state: '',
  });
  const [lawyerForm, setLawyerForm] = useState({
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

  const loading = mode === 'user' ? authLoading : lawyerLoading;
  const error = mode === 'user' ? authError : lawyerError;

  const clearErrors = () => {
    dispatch(clearAuthError());
    dispatch(clearLawyerError());
  };

  const handleSpecializationChange = (spec) => {
    setLawyerForm((prev) => ({
      ...prev,
      specialization: prev.specialization.includes(spec)
        ? prev.specialization.filter((s) => s !== spec)
        : [...prev.specialization, spec],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearErrors();
    if (mode === 'user') {
      const result = await dispatch(registerUser(userForm));
      if (registerUser.fulfilled.match(result)) {
        setUser(result.payload.user);
        setRegisterForm({
          name: userForm.name,
          age: userForm.age,
          state: userForm.state,
          phone: userForm.phone,
        });
        setPage('home');
      }
    } else {
      if (lawyerForm.specialization.length === 0) {
        alert('Please select at least one specialization');
        return;
      }
      const result = await dispatch(registerLawyer(lawyerForm));
      if (registerLawyer.fulfilled.match(result)) {
        alert('Registration successful! Waiting for admin approval.');
        setPage('home');
      }
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    clearErrors();
  };

  return (
    <div className="page-container center-content">
      <GlassCard className="register-card" style={{ maxWidth: mode === 'lawyer' ? '600px' : undefined }}>
        <div className="register-header">
          <h2>{mode === 'user' ? t.registerTitle : 'Lawyer Registration'}</h2>
          <p>{mode === 'user' ? t.registerIntro : 'Register as a lawyer to help women with legal issues'}</p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '1.5rem',
            background: 'rgba(0,0,0,0.2)',
            padding: '6px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
          }}
        >
          <button
            type="button"
            onClick={() => switchMode('user')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: mode === 'user' ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: mode === 'user' ? '#e879f9' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.95rem',
            }}
          >
            <User size={18} />
            Register as User
          </button>
          <button
            type="button"
            onClick={() => switchMode('lawyer')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: mode === 'lawyer' ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: mode === 'lawyer' ? '#e879f9' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.95rem',
            }}
          >
            <Scale size={18} />
            Register as Lawyer
          </button>
        </div>

        {error && (
          <div
            className="error-message"
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

        <form onSubmit={handleSubmit} className="register-form">
          {mode === 'user' ? (
            <>
              <InputField
                icon={User}
                label={t.registerName}
                type="text"
                required
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                placeholder="e.g. Priya Sharma"
                onSpeak={() => speak(t.registerName, language)}
              />
              <InputField
                icon={Mail}
                label="Email"
                type="email"
                required
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="your.email@example.com"
                onSpeak={() => speak('Email', language)}
              />
              <InputField
                icon={Lock}
                label="Password"
                type="password"
                required
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder="Minimum 6 characters"
                onSpeak={() => speak('Password', language)}
              />
              <InputField
                icon={Calendar}
                label={t.registerAge}
                type="number"
                required
                value={userForm.age}
                onChange={(e) => setUserForm({ ...userForm, age: e.target.value })}
                placeholder="e.g. 28"
                onSpeak={() => speak(t.registerAge, language)}
              />
              <StateDropdown
                value={userForm.state}
                onChange={(e) => setUserForm({ ...userForm, state: e.target.value })}
                label={t.registerState}
                onSpeak={() => speak(t.registerState, language)}
                language={language}
              />
              <InputField
                icon={Phone}
                label={t.registerPhone}
                type="tel"
                required
                value={userForm.phone}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                placeholder="e.g. 9876543210"
                onSpeak={() => speak(t.registerPhone, language)}
              />
            </>
          ) : (
            <>
              <InputField
                icon={User}
                label="Full Name"
                type="text"
                required
                value={lawyerForm.name}
                onChange={(e) => setLawyerForm({ ...lawyerForm, name: e.target.value })}
                placeholder="e.g. Adv. Priya Sharma"
                onSpeak={() => speak('Full Name', language)}
              />
              <InputField
                icon={Mail}
                label="Email"
                type="email"
                required
                value={lawyerForm.email}
                onChange={(e) => setLawyerForm({ ...lawyerForm, email: e.target.value })}
                placeholder="your.email@example.com"
                onSpeak={() => speak('Email', language)}
              />
              <InputField
                icon={Lock}
                label="Password"
                type="password"
                required
                value={lawyerForm.password}
                onChange={(e) => setLawyerForm({ ...lawyerForm, password: e.target.value })}
                placeholder="Minimum 6 characters"
                onSpeak={() => speak('Password', language)}
              />
              <InputField
                icon={Phone}
                label="Phone Number"
                type="tel"
                required
                value={lawyerForm.phone}
                onChange={(e) => setLawyerForm({ ...lawyerForm, phone: e.target.value })}
                placeholder="e.g. 9876543210"
                onSpeak={() => speak('Phone Number', language)}
              />
              <InputField
                icon={FileText}
                label="Bar Number"
                type="text"
                required
                value={lawyerForm.barNumber}
                onChange={(e) => setLawyerForm({ ...lawyerForm, barNumber: e.target.value })}
                placeholder="e.g. BAR/2020/12345"
                onSpeak={() => speak('Bar Number', language)}
              />
              <StateDropdown
                value={lawyerForm.state}
                onChange={(e) => setLawyerForm({ ...lawyerForm, state: e.target.value })}
                label="State/Region"
                onSpeak={() => speak('State', language)}
                language={language}
              />
              <InputField
                icon={MapPin}
                label="City"
                type="text"
                value={lawyerForm.city}
                onChange={(e) => setLawyerForm({ ...lawyerForm, city: e.target.value })}
                placeholder="e.g. Mumbai"
                onSpeak={() => speak('City', language)}
              />
              <InputField
                icon={Briefcase}
                label="Address (Optional)"
                type="text"
                value={lawyerForm.address}
                onChange={(e) => setLawyerForm({ ...lawyerForm, address: e.target.value })}
                placeholder="Office address"
                onSpeak={() => speak('Address', language)}
              />
              <InputField
                icon={Briefcase}
                label="Years of Experience"
                type="number"
                required
                min="0"
                value={lawyerForm.experience}
                onChange={(e) => setLawyerForm({ ...lawyerForm, experience: e.target.value })}
                placeholder="e.g. 5"
                onSpeak={() => speak('Experience', language)}
              />
              <div className="input-group">
                <label style={{ marginBottom: '10px' }}>Specialization (Select at least one) *</label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '10px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    padding: '10px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {LAWYER_SPECIALIZATIONS.map((spec) => (
                    <label
                      key={spec}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={lawyerForm.specialization.includes(spec)}
                        onChange={() => handleSpecializationChange(spec)}
                        style={{ cursor: 'pointer' }}
                      />
                      {spec}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
          <button type="submit" className="btn-primary full-width" disabled={loading}>
            {loading
              ? mode === 'user'
                ? t.registerLoading
                : 'Registering...'
              : mode === 'user'
                ? t.registerButton
                : 'Register as Lawyer'}
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
                textDecoration: 'underline',
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
