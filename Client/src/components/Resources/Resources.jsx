import { useEffect, useState } from "react";
import { useContext } from "react";
import { resourcesAPI } from "../../services/api";
import GlassCard from "../common/GlassCard";
import { Phone, ExternalLink, AlertCircle, BookOpen } from "lucide-react";
import { AppContext } from "../../context/AppContext";

const CATEGORY_ORDER = ["emergency", "national", "legalAid", "usefulLinks"];

const Resources = () => {
  const { language, t } = useContext(AppContext);
  const [resources, setResources] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    resourcesAPI
      .getResources()
      .then((res) => {
        if (!cancelled) setResources(res.data.resources);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load resources");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const useHindiData = language === 'hi';

  const pickLocalizedField = (source, englishKey, hindiKey) => {
    if (!source) return '';
    if (useHindiData) return source[hindiKey] || source[englishKey] || '';
    return source[englishKey] || source[hindiKey] || '';
  };

  if (loading) {
    return (
      <div className="page-container center-content">
        <p style={{ color: "var(--text-muted)" }}>{t.resourcesLoading}</p>
      </div>
    );
  }

  if (error || !resources) {
    return (
      <div className="page-container center-content">
        <GlassCard style={{ maxWidth: "400px", textAlign: "center", padding: "2rem" }}>
          <AlertCircle size={40} color="#f87171" style={{ marginBottom: "1rem" }} />
          <p style={{ color: "var(--text-muted)" }}>{error || t.resourcesError}</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.5rem" }}>
          <BookOpen size={28} color="#a855f7" />
          {t.resourcesTitle}
        </h2>
        <p style={{ color: "var(--text-muted)" }}>
          {t.resourcesSubtitle}
        </p>
      </div>

      {CATEGORY_ORDER.map((key) => {
        const section = resources[key];
        if (!section || !section.items?.length) return null;
        const title = pickLocalizedField(section, 'title', 'titleHi');
        return (
          <GlassCard key={key} style={{ marginBottom: "1.5rem", padding: "1.5rem" }}>
            <h3 style={{ marginBottom: "1rem", color: "#e879f9", fontSize: "1.1rem" }}>{title}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {section.items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "1rem",
                    background: "rgba(0,0,0,0.2)",
                    borderRadius: "10px",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                    <div style={{ flex: "1 1 200px" }}>
                      <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>
                        {pickLocalizedField(item, 'name', 'nameHi')}
                      </div>
                      {item.description && (
                        <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                          {item.description}
                        </p>
                      )}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
                        {item.phone && (
                          <a
                            href={`tel:${item.phone.replace(/\s/g, "")}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              color: "#22c55e",
                              textDecoration: "none",
                              fontSize: "0.95rem",
                              fontWeight: "600",
                            }}
                          >
                            <Phone size={18} />
                            {item.phone}
                          </a>
                        )}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              color: "#a855f7",
                              textDecoration: "none",
                              fontSize: "0.9rem",
                            }}
                          >
                            <ExternalLink size={16} />
                            {t.resourcesOpenWebsite}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        );
      })}

      <GlassCard style={{ padding: "1rem", marginTop: "1rem", background: "rgba(168, 85, 247, 0.08)", borderColor: "rgba(168, 85, 247, 0.3)" }}>
        <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", margin: 0 }}>
          {t.resourcesDisclaimer}
        </p>
      </GlassCard>
    </div>
  );
};

export default Resources;
