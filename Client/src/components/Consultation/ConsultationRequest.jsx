import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { createConsultation } from '../../store/slices/consultationSlice';
import GlassCard from '../common/GlassCard';
import InputField from '../common/InputField';
import { FileText, Calendar, Clock, Phone, Video, Mail, MapPin } from 'lucide-react';

const ConsultationRequest = ({ lawyerId, onClose, initialSubject = '' }) => {
  const dispatch = useDispatch();
  const { t, language } = useContext(AppContext);
  const { loading, error } = useSelector((state) => state.consultation);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    subject: initialSubject,
    description: '',
    preferredDate: '',
    preferredTime: '',
    consultationType: 'phone'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('Please login to request a consultation');
      return;
    }

    const result = await dispatch(createConsultation({
      lawyerId,
      ...formData
    }));

    if (createConsultation.fulfilled.match(result)) {
      alert('Consultation request sent successfully!');
      onClose();
    }
  };

  return (
    <GlassCard style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Request Consultation</h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '1.5rem'
          }}
        >
          ×
        </button>
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
          icon={FileText} 
          label="Subject" 
          type="text" 
          required
          value={formData.subject} 
          onChange={e => setFormData({...formData, subject: e.target.value})}
          placeholder="e.g. Property Rights Issue"
        />
        
        <div className="input-group">
          <label>Description</label>
          <textarea
            required
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            placeholder="Describe your legal issue in detail..."
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <InputField 
            icon={Calendar} 
            label="Preferred Date" 
            type="date" 
            value={formData.preferredDate} 
            onChange={e => setFormData({...formData, preferredDate: e.target.value})}
          />
          <InputField 
            icon={Clock} 
            label="Preferred Time" 
            type="time" 
            value={formData.preferredTime} 
            onChange={e => setFormData({...formData, preferredTime: e.target.value})}
          />
        </div>

        <div className="input-group">
          <label>Consultation Type</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
            {[
              { value: 'phone', icon: Phone, label: 'Phone' },
              { value: 'video', icon: Video, label: 'Video Call' },
              { value: 'in-person', icon: MapPin, label: 'In-Person' },
              { value: 'email', icon: Mail, label: 'Email' }
            ].map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData({...formData, consultationType: type.value})}
                style={{
                  padding: '12px',
                  background: formData.consultationType === type.value 
                    ? 'rgba(168, 85, 247, 0.2)' 
                    : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${formData.consultationType === type.value ? '#a855f7' : 'var(--border-color)'}`,
                  borderRadius: '8px',
                  color: 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  justifyContent: 'center'
                }}
              >
                <type.icon size={18} />
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary full-width" disabled={loading}>
          {loading ? 'Sending Request...' : 'Send Consultation Request'}
        </button>
      </form>
    </GlassCard>
  );
};

export default ConsultationRequest;
