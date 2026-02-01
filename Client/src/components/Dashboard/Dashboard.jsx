import { useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { AlertCircle, Scale, ArrowRight } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { useTTS } from '../../hooks/useTTS';
import { dashboardAPI } from '../../services/api';
import GlassCard from '../common/GlassCard';
import InfoCard from './InfoCard';

const Dashboard = () => {
  const { user: reduxUser } = useSelector((state) => state.auth);
  const { t, language, dashboardData, setDashboardData, setPage, user: contextUser } = useContext(AppContext);
  const { speak } = useTTS();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const user = reduxUser || contextUser;

  useEffect(() => {
    if (!user?.age || !user?.state) return;
    if (dashboardData) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    dashboardAPI
      .getInsights()
      .then((res) => {
        if (!cancelled && res.data?.problems && res.data?.rights) {
          setDashboardData({ problems: res.data.problems, rights: res.data.rights });
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Failed to load insights');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.age, user?.state, dashboardData, setDashboardData]);

  if (loading || (!dashboardData && !error)) {
    return <div className="page-container center-content">Loading...</div>;
  }

  if (error && !dashboardData) {
    return (
      <div className="page-container center-content">
        <GlassCard style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{error}</p>
          <button
            onClick={() => {
              setError(null);
              setDashboardData(null);
            }}
            className="btn-primary"
          >
            Try again
          </button>
        </GlassCard>
      </div>
    );
  }

  if (!dashboardData) {
    return <div className="page-container center-content">Loading...</div>;
  }

  return (
    <div className="page-container dashboard-layout">
      <div className="dashboard-header">
        <h2>{t.dashTitle}</h2>
        <p>{user?.age} years old • {user?.state}</p>
      </div>

      <div className="dashboard-grid">
        <InfoCard 
          title={t.dashProblems} 
          items={dashboardData.problems} 
          icon={AlertCircle} 
          color="#f87171" 
          language={language}
          speak={speak}
        />
        <InfoCard 
          title={t.dashRights} 
          items={dashboardData.rights} 
          icon={Scale} 
          color="#a855f7" 
          language={language}
          speak={speak}
        />
      </div>

      <GlassCard className="dashboard-footer">
        <div className="footer-content">
          <p>{t.dashFooterText}</p>
          <button onClick={() => setPage('assistant')} className="btn-primary glow-effect">
            {t.dashFooterBtn} <ArrowRight size={20} />
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default Dashboard;
