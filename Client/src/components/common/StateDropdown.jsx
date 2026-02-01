import { MapPin, Volume2 } from 'lucide-react';
import { INDIAN_STATES } from '../../constants/indianStates';

const StateDropdown = ({ value, onChange, onSpeak, label, language }) => (
  <div className="input-group">
    <div className="label-row">
      <label>{label}</label>
      {onSpeak && (
        <button type="button" onClick={onSpeak} className="speak-label-btn">
          <Volume2 size={16} />
        </button>
      )}
    </div>
    <div className="input-wrapper">
      <MapPin className="input-icon" size={20} />
      <select 
        value={value} 
        onChange={onChange} 
        className="text-input"
        style={{ 
          background: 'transparent', 
          border: 'none', 
          outline: 'none',
          width: '100%',
          padding: '12px',
          fontSize: '1rem',
          color: 'inherit',
          cursor: 'pointer'
        }}
      >
        <option value="">Select State</option>
        {INDIAN_STATES.map((state) => (
          <option key={state.value} value={state.value}>
            {state.label}
          </option>
        ))}
      </select>
    </div>
  </div>
);

export default StateDropdown;
