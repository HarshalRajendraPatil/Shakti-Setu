import { Volume2, ExternalLink } from 'lucide-react';
import GlassCard from '../common/GlassCard';

const InfoCard = ({ title, items, icon: Icon, color, language, speak }) => (
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
              <p>{language === 'hi' ? item.hi : item.en}</p>
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
                  Learn more <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
          <button 
            onClick={() => speak(language === 'hi' ? item.hi : item.en, language)} 
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
