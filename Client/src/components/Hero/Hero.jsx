import { useContext } from 'react';
import { Volume2, ChevronRight, BookOpen, MapPin, Heart } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { useTTS } from '../../hooks/useTTS';
import GlassCard from '../common/GlassCard';

const Hero = () => {
  const { t, setPage, language } = useContext(AppContext);
  const { speak, speaking, stop } = useTTS();

  const handleSpeak = () => {
    if (speaking) stop();
    else speak(t.homeIntro, language);
  };

  return (
    <div className="hero-container">
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <div className="hero-content">
        <div className="tagline-pill">
          <span className="pulsing-dot"></span>
          <span>{t.tagline}</span>
        </div>
        <h1 className="hero-title">
          {t.homeHeader} <br />
          <span className="hero-subtitle">{t.homeSubHeader}</span>
        </h1>
        <p className="hero-description">{t.homeIntro}</p>
        <div className="hero-actions">
          <button onClick={() => setPage('register')} className="btn-primary">
            {t.getStarted} <ChevronRight size={20} />
          </button>
          <button onClick={handleSpeak} className={`btn-secondary ${speaking ? 'speaking' : ''}`}>
            {speaking ? <Volume2 size={20} className="icon-pulse" /> : <Volume2 size={20} />}
            {speaking ? "Speaking..." : t.hearIntro}
          </button>
        </div>
        <div className="features-grid">
          <GlassCard className="feature-card">
            <BookOpen size={32} color="#f472b6" className="feature-icon" />
            <h3>{t.feat1Title}</h3>
            <p>{t.feat1Desc}</p>
          </GlassCard>
          <GlassCard className="feature-card">
            <MapPin size={32} color="#a855f7" className="feature-icon" />
            <h3>{t.feat2Title}</h3>
            <p>{t.feat2Desc}</p>
          </GlassCard>
          <GlassCard className="feature-card">
            <Heart size={32} color="#f87171" className="feature-icon" />
            <h3>{t.feat3Title}</h3>
            <p>{t.feat3Desc}</p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Hero;
