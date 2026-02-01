const GlassCard = ({ children, className = "" }) => (
  <div className={`glass-card ${className}`}>
    {children}
  </div>
);

export default GlassCard;
