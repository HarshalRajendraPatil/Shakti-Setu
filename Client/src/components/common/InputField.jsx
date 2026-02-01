import { Volume2 } from 'lucide-react';

const InputField = ({ icon: Icon, label, onSpeak, ...props }) => (
  <div className="input-group">
    <div className="label-row">
      <label>{label}</label>
      <button type="button" onClick={onSpeak} className="speak-label-btn">
        <Volume2 size={16} />
      </button>
    </div>
    <div className="input-wrapper">
      {Icon && <Icon className="input-icon" size={20} />}
      <input {...props} className="text-input" />
    </div>
  </div>
);

export default InputField;
