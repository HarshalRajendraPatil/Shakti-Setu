import { Volume2, ExternalLink } from 'lucide-react';
import GlassCard from '../common/GlassCard';

const getLocalizedText = (item, language) => item?.[language] || item?.en || item?.hi || '';

const InfoCard = ({ title, items, icon: Icon, color, language, speak, learnMoreLabel }) => (
  <GlassCard className="dashboard-column">
    <div className="column-header" style={{ borderBottomColor: color }}>
      {Icon && <Icon size={24} color={color} />}
      <h3>{title}</h3>
    </div>
    <div className="scroll-list">
      {items.map((item, idx) => (
        <div key={idx} className="info-item-card">
          <div className="info-content">
            <span className="index-badge" style={{ backgroundColor: color }}>
              {idx + 1}
            </span>
            <div style={{ flex: 1 }}>
              <p>{getLocalizedText(item, language)}</p>
              {item.link && (
                <a 
                  href={item.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="article-link"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '8px',
                    color: color,
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    fontWeight: 500
                  }}
                >
                  {learnMoreLabel} <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
          <button 
            onClick={() => speak(getLocalizedText(item, language), language)} 
            className="card-speak-btn"
          >
            <Volume2 size={18} />
          </button>
        </div>
      ))}
    </div>
  </GlassCard>
);

export default InfoCard;
