import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Scale,
  MessageSquare,
  AlertTriangle,
  Shield,
  Ban,
  RotateCcw,
  FileWarning,
  LayoutDashboard,
  BookOpen,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  getPendingLawyers,
  updateLawyerStatus,
} from "../../store/slices/lawyerSlice";
import { adminAPI, articlesAPI } from "../../services/api";
import { ARTICLE_CATEGORIES } from "../../constants/articleCategories";
import GlassCard from "../common/GlassCard";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "pending", label: "Pending Lawyers", icon: Clock },
  { id: "users", label: "All Users", icon: Users },
  { id: "lawyers", label: "All Lawyers", icon: Scale },
  { id: "reports", label: "Reports", icon: FileWarning },
  { id: "articles", label: "Articles", icon: BookOpen },
];

const AdminPanel = () => {
  const dispatch = useDispatch();
  const { pendingLawyers, loading: pendingLoading } = useSelector(
    (state) => state.lawyer
  );
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [allLawyers, setAllLawyers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [reportFilter, setReportFilter] = useState(""); // '' | 'pending' | 'resolved' | 'dismissed'
  const [allArticles, setAllArticles] = useState([]);
  const [articleModal, setArticleModal] = useState(null); // null | 'create' | { id, article }

  const loadStats = async () => {
    try {
      const res = await adminAPI.getStats();
      setStats(res.data.stats);
    } catch (e) {
      console.error(e);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAllUsers();
      setAllUsers(res.data.users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadLawyers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAllLawyers();
      setAllLawyers(res.data.lawyers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const params = reportFilter ? { status: reportFilter } : {};
      const res = await adminAPI.getReports(params);
      setReports(res.data.reports || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadArticles = async () => {
    setLoading(true);
    try {
      const res = await articlesAPI.getArticles();
      setAllArticles(res.data.articles || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    dispatch(getPendingLawyers());
  }, [dispatch]);

  useEffect(() => {
    if (activeTab === "users") loadUsers();
    if (activeTab === "lawyers") loadLawyers();
    if (activeTab === "reports") loadReports();
    if (activeTab === "articles") loadArticles();
  }, [activeTab, reportFilter]);

  const handleApprove = async (lawyerId) => {
    if (!window.confirm("Approve this lawyer?")) return;
    await dispatch(updateLawyerStatus({ lawyerId, status: "approved" }));
    dispatch(getPendingLawyers());
    loadStats();
  };

  const handleReject = async (lawyerId) => {
    const reason = rejectionReasons[lawyerId] || "";
    if (!window.confirm("Reject this lawyer?")) return;
    await dispatch(
      updateLawyerStatus({
        lawyerId,
        status: "rejected",
        rejectionReason: reason,
      })
    );
    setRejectionReasons((prev) => ({ ...prev, [lawyerId]: undefined }));
    dispatch(getPendingLawyers());
    loadStats();
  };

  const handleUserStatus = async (userId, isSuspended) => {
    if (!window.confirm(isSuspended ? "Suspend this user?" : "Activate this user?")) return;
    try {
      await adminAPI.updateUserStatus(userId, isSuspended);
      loadUsers();
      loadStats();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to update user");
    }
  };

  const handleLawyerSuspension = async (lawyerId, isSuspended) => {
    if (!window.confirm(isSuspended ? "Suspend this lawyer?" : "Activate this lawyer?")) return;
    try {
      await adminAPI.updateLawyerSuspension(lawyerId, isSuspended);
      loadLawyers();
      dispatch(getPendingLawyers());
      loadStats();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to update lawyer");
    }
  };

  const handleResolveReport = async (reportId, action, adminNotes) => {
    try {
      await adminAPI.resolveReport(reportId, action, adminNotes);
      loadReports();
      loadStats();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to process report");
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Shield size={28} color="#a855f7" />
          Admin Dashboard
        </h2>
        <p style={{ color: "var(--text-muted)" }}>
          Manage users, lawyers, and reports
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "1.5rem",
          borderBottom: "1px solid var(--border-color)",
          paddingBottom: "1rem",
        }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                background: activeTab === tab.id ? "rgba(168, 85, 247, 0.2)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${activeTab === tab.id ? "#a855f7" : "var(--border-color)"}`,
                borderRadius: "10px",
                color: activeTab === tab.id ? "#e879f9" : "var(--text-muted)",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && (
        <>
          {stats && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: "1rem",
                marginBottom: "2rem",
              }}
            >
              <StatCard
                icon={Users}
                label="Total Users"
                value={stats.totalUsers}
                color="#3b82f6"
              />
              <StatCard
                icon={Scale}
                label="Total Lawyers"
                value={stats.totalLawyers}
                color="#a855f7"
              />
              <StatCard
                icon={Clock}
                label="Pending Lawyers"
                value={stats.pendingLawyers}
                color="#f59e0b"
              />
              <StatCard
                icon={CheckCircle}
                label="Approved Lawyers"
                value={stats.approvedLawyers}
                color="#22c55e"
              />
              <StatCard
                icon={MessageSquare}
                label="Consultations"
                value={stats.totalConsultations}
                color="#06b6d4"
              />
              <StatCard
                icon={FileWarning}
                label="Pending Reports"
                value={stats.pendingReports}
                color="#ef4444"
              />
              <StatCard
                icon={Ban}
                label="Suspended Users"
                value={stats.suspendedUsers}
                color="#6b7280"
              />
              <StatCard
                icon={Ban}
                label="Suspended Lawyers"
                value={stats.suspendedLawyers}
                color="#6b7280"
              />
            </div>
          )}
          <GlassCard>
            <p style={{ color: "var(--text-muted)", marginBottom: "0.5rem" }}>
              Use the tabs above to manage pending lawyer approvals, all users, all lawyers, and user/lawyer reports.
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              You can suspend or activate users and lawyers. Resolve or dismiss reports from the Reports tab.
            </p>
          </GlassCard>
        </>
      )}

      {activeTab === "pending" && (
        <PendingLawyersTab
          pendingLawyers={pendingLawyers}
          loading={pendingLoading}
          rejectionReasons={rejectionReasons}
          setRejectionReasons={setRejectionReasons}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {activeTab === "users" && (
        <AllUsersTab
          users={allUsers}
          loading={loading}
          onStatusChange={handleUserStatus}
        />
      )}

      {activeTab === "lawyers" && (
        <AllLawyersTab
          lawyers={allLawyers}
          loading={loading}
          onSuspensionChange={handleLawyerSuspension}
          onApprove={handleApprove}
          onReject={handleReject}
          rejectionReasons={rejectionReasons}
          setRejectionReasons={setRejectionReasons}
        />
      )}

      {activeTab === "reports" && (
        <ReportsTab
          reports={reports}
          loading={loading}
          reportFilter={reportFilter}
          setReportFilter={setReportFilter}
          onResolve={handleResolveReport}
          onRefresh={loadReports}
        />
      )}

      {activeTab === "articles" && (
        <ArticlesTab
          articles={allArticles}
          loading={loading}
          onRefresh={loadArticles}
          onAdd={() => setArticleModal("create")}
          onEdit={(article) => setArticleModal({ id: article._id, article })}
          onDelete={async (id) => {
            if (!window.confirm("Delete this article?")) return;
            try {
              await articlesAPI.deleteArticle(id);
              loadArticles();
            } catch (e) {
              alert(e.response?.data?.message || "Failed to delete");
            }
          }}
        />
      )}

      {articleModal && (
        <ArticleModal
          mode={articleModal === "create" ? "create" : "edit"}
          initial={articleModal !== "create" ? articleModal.article : null}
          onClose={() => setArticleModal(null)}
          onSuccess={() => {
            setArticleModal(null);
            loadArticles();
          }}
        />
      )}
    </div>
  );
};

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <GlassCard style={{ padding: "1rem", textAlign: "center" }}>
      <Icon size={28} color={color} style={{ marginBottom: "0.5rem" }} />
      <div style={{ fontSize: "1.5rem", fontWeight: "700", color }}>{value}</div>
      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{label}</div>
    </GlassCard>
  );
}

function PendingLawyersTab({
  pendingLawyers,
  loading,
  rejectionReasons,
  setRejectionReasons,
  onApprove,
  onReject,
}) {
  if (loading) return <div className="page-container center-content">Loading...</div>;
  if (pendingLawyers.length === 0) {
    return (
      <GlassCard style={{ textAlign: "center", padding: "3rem" }}>
        <Clock size={48} style={{ margin: "0 auto 1rem", color: "var(--text-muted)" }} />
        <p style={{ color: "var(--text-muted)" }}>No pending lawyer registrations.</p>
      </GlassCard>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {pendingLawyers.map((lawyer) => (
        <GlassCard key={lawyer._id || lawyer.id} style={{ padding: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <h3 style={{ marginBottom: "0.5rem" }}>{lawyer.name}</h3>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Email: {lawyer.email}</p>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Phone: {lawyer.phone}</p>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Bar: {lawyer.barNumber}</p>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>{lawyer.experience} yrs • {lawyer.city && `${lawyer.city}, `}{lawyer.state}</p>
              {lawyer.specialization?.length > 0 && (
                <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {lawyer.specialization.map((s, i) => (
                    <span key={i} style={{ fontSize: "0.75rem", padding: "4px 8px", background: "rgba(168, 85, 247, 0.2)", borderRadius: "4px", color: "#a855f7" }}>{s}</span>
                  ))}
                </div>
              )}
            </div>
            <span style={{ padding: "4px 12px", borderRadius: "12px", fontSize: "0.75rem", background: "rgba(251, 191, 36, 0.2)", color: "#fbbf24", height: "fit-content" }}>Pending</span>
          </div>
          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>Rejection reason (optional):</label>
            <textarea
              value={rejectionReasons[lawyer._id || lawyer.id] || ""}
              onChange={(e) => setRejectionReasons((prev) => ({ ...prev, [lawyer._id || lawyer.id]: e.target.value }))}
              placeholder="Reason for rejection..."
              style={{ width: "100%", padding: "8px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "inherit", fontSize: "0.9rem", minHeight: "60px", resize: "vertical" }}
            />
            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button onClick={() => onReject(lawyer._id || lawyer.id)} style={{ padding: "10px 20px", background: "rgba(239, 68, 68, 0.2)", border: "1px solid #ef4444", borderRadius: "8px", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem" }}>
                <XCircle size={18} /> Reject
              </button>
              <button onClick={() => onApprove(lawyer._id || lawyer.id)} style={{ padding: "10px 20px", background: "rgba(34, 197, 94, 0.2)", border: "1px solid #22c55e", borderRadius: "8px", color: "#22c55e", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem" }}>
                <CheckCircle size={18} /> Approve
              </button>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function AllUsersTab({ users, loading, onStatusChange }) {
  if (loading) return <div className="page-container center-content">Loading users...</div>;
  const nonAdmin = users.filter((u) => u.role !== "admin");
  if (nonAdmin.length === 0) {
    return (
      <GlassCard style={{ textAlign: "center", padding: "3rem" }}>
        <Users size={48} style={{ margin: "0 auto 1rem", color: "var(--text-muted)" }} />
        <p style={{ color: "var(--text-muted)" }}>No users found.</p>
      </GlassCard>
    );
  }
  return (
    <GlassCard style={{ overflow: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
            <th style={{ padding: "12px 8px" }}>Name</th>
            <th style={{ padding: "12px 8px" }}>Email</th>
            <th style={{ padding: "12px 8px" }}>Phone</th>
            <th style={{ padding: "12px 8px" }}>State</th>
            <th style={{ padding: "12px 8px" }}>Status</th>
            <th style={{ padding: "12px 8px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {nonAdmin.map((u) => (
            <tr key={u._id || u.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
              <td style={{ padding: "12px 8px" }}>{u.name}</td>
              <td style={{ padding: "12px 8px", color: "var(--text-muted)" }}>{u.email}</td>
              <td style={{ padding: "12px 8px", color: "var(--text-muted)" }}>{u.phone}</td>
              <td style={{ padding: "12px 8px", color: "var(--text-muted)" }}>{u.state}</td>
              <td style={{ padding: "12px 8px" }}>
                {u.isSuspended ? (
                  <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", background: "rgba(239, 68, 68, 0.2)", color: "#ef4444" }}>Suspended</span>
                ) : (
                  <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", background: "rgba(34, 197, 94, 0.2)", color: "#22c55e" }}>Active</span>
                )}
              </td>
              <td style={{ padding: "12px 8px" }}>
                {u.isSuspended ? (
                  <button onClick={() => onStatusChange(u._id || u.id, false)} style={{ padding: "6px 14px", background: "rgba(34, 197, 94, 0.2)", border: "1px solid #22c55e", borderRadius: "8px", color: "#22c55e", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
                    <RotateCcw size={14} /> Activate
                  </button>
                ) : (
                  <button onClick={() => onStatusChange(u._id || u.id, true)} style={{ padding: "6px 14px", background: "rgba(239, 68, 68, 0.2)", border: "1px solid #ef4444", borderRadius: "8px", color: "#ef4444", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Ban size={14} /> Suspend
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </GlassCard>
  );
}

function AllLawyersTab({
  lawyers,
  loading,
  onSuspensionChange,
  onApprove,
  onReject,
  rejectionReasons,
  setRejectionReasons,
}) {
  if (loading) return <div className="page-container center-content">Loading lawyers...</div>;
  if (lawyers.length === 0) {
    return (
      <GlassCard style={{ textAlign: "center", padding: "3rem" }}>
        <Scale size={48} style={{ margin: "0 auto 1rem", color: "var(--text-muted)" }} />
        <p style={{ color: "var(--text-muted)" }}>No lawyers found.</p>
      </GlassCard>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {lawyers.map((lawyer) => (
        <GlassCard key={lawyer._id || lawyer.id} style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
            <div>
              <h3 style={{ marginBottom: "0.25rem" }}>{lawyer.name}</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{lawyer.email} • Bar: {lawyer.barNumber}</p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{lawyer.state}{lawyer.city ? `, ${lawyer.city}` : ""}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "12px",
                  fontSize: "0.75rem",
                  background: lawyer.status === "approved" ? "rgba(34, 197, 94, 0.2)" : lawyer.status === "pending" ? "rgba(251, 191, 36, 0.2)" : "rgba(239, 68, 68, 0.2)",
                  color: lawyer.status === "approved" ? "#22c55e" : lawyer.status === "pending" ? "#fbbf24" : "#ef4444",
                }}
              >
                {lawyer.status}
              </span>
              {lawyer.isSuspended && (
                <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", background: "rgba(107, 114, 128, 0.2)", color: "#6b7280" }}>Suspended</span>
              )}
            </div>
          </div>
          <div style={{ marginTop: "1rem", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {lawyer.status === "pending" && (
              <>
                <textarea
                  placeholder="Rejection reason..."
                  value={rejectionReasons[lawyer._id || lawyer.id] || ""}
                  onChange={(e) => setRejectionReasons((prev) => ({ ...prev, [lawyer._id || lawyer.id]: e.target.value }))}
                  style={{ flex: "1 1 200px", minWidth: "150px", padding: "8px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "inherit", fontSize: "0.85rem", minHeight: "40px", resize: "vertical" }}
                />
                <button onClick={() => onReject(lawyer._id || lawyer.id)} style={{ padding: "8px 16px", background: "rgba(239, 68, 68, 0.2)", border: "1px solid #ef4444", borderRadius: "8px", color: "#ef4444", cursor: "pointer", fontSize: "0.85rem" }}>Reject</button>
                <button onClick={() => onApprove(lawyer._id || lawyer.id)} style={{ padding: "8px 16px", background: "rgba(34, 197, 94, 0.2)", border: "1px solid #22c55e", borderRadius: "8px", color: "#22c55e", cursor: "pointer", fontSize: "0.85rem" }}>Approve</button>
              </>
            )}
            {lawyer.status === "approved" && (
              lawyer.isSuspended ? (
                <button onClick={() => onSuspensionChange(lawyer._id || lawyer.id, false)} style={{ padding: "8px 16px", background: "rgba(34, 197, 94, 0.2)", border: "1px solid #22c55e", borderRadius: "8px", color: "#22c55e", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
                  <RotateCcw size={14} /> Activate
                </button>
              ) : (
                <button onClick={() => onSuspensionChange(lawyer._id || lawyer.id, true)} style={{ padding: "8px 16px", background: "rgba(239, 68, 68, 0.2)", border: "1px solid #ef4444", borderRadius: "8px", color: "#ef4444", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Ban size={14} /> Suspend
                </button>
              )
            )}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function ReportsTab({ reports, loading, reportFilter, setReportFilter, onResolve, onRefresh }) {
  const [resolvingId, setResolvingId] = useState(null);
  const [notes, setNotes] = useState({});

  if (loading) return <div className="page-container center-content">Loading reports...</div>;

  return (
    <>
      <div style={{ display: "flex", gap: "8px", marginBottom: "1rem", flexWrap: "wrap" }}>
        <button onClick={() => setReportFilter("")} style={{ padding: "8px 16px", background: !reportFilter ? "rgba(168, 85, 247, 0.2)" : "rgba(255,255,255,0.05)", border: `1px solid ${!reportFilter ? "#a855f7" : "var(--border-color)"}`, borderRadius: "8px", color: !reportFilter ? "#a855f7" : "var(--text-muted)", cursor: "pointer", fontSize: "0.9rem" }}>All</button>
        <button onClick={() => setReportFilter("pending")} style={{ padding: "8px 16px", background: reportFilter === "pending" ? "rgba(251, 191, 36, 0.2)" : "rgba(255,255,255,0.05)", border: `1px solid ${reportFilter === "pending" ? "#fbbf24" : "var(--border-color)"}`, borderRadius: "8px", color: reportFilter === "pending" ? "#fbbf24" : "var(--text-muted)", cursor: "pointer", fontSize: "0.9rem" }}>Pending</button>
        <button onClick={() => setReportFilter("resolved")} style={{ padding: "8px 16px", background: reportFilter === "resolved" ? "rgba(34, 197, 94, 0.2)" : "rgba(255,255,255,0.05)", border: `1px solid ${reportFilter === "resolved" ? "#22c55e" : "var(--border-color)"}`, borderRadius: "8px", color: reportFilter === "resolved" ? "#22c55e" : "var(--text-muted)", cursor: "pointer", fontSize: "0.9rem" }}>Resolved</button>
        <button onClick={() => setReportFilter("dismissed")} style={{ padding: "8px 16px", background: reportFilter === "dismissed" ? "rgba(107, 114, 128, 0.2)" : "rgba(255,255,255,0.05)", border: `1px solid ${reportFilter === "dismissed" ? "#6b7280" : "var(--border-color)"}`, borderRadius: "8px", color: reportFilter === "dismissed" ? "#9ca3af" : "var(--text-muted)", cursor: "pointer", fontSize: "0.9rem" }}>Dismissed</button>
        <button onClick={onRefresh} style={{ padding: "8px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.9rem", marginLeft: "auto" }}>Refresh</button>
      </div>
      {reports.length === 0 ? (
        <GlassCard style={{ textAlign: "center", padding: "3rem" }}>
          <FileWarning size={48} style={{ margin: "0 auto 1rem", color: "var(--text-muted)" }} />
          <p style={{ color: "var(--text-muted)" }}>No reports found.</p>
        </GlassCard>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {reports.map((r) => (
            <GlassCard key={r._id} style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", background: r.reportType === "lawyer" ? "rgba(168, 85, 247, 0.2)" : "rgba(59, 130, 246, 0.2)", color: r.reportType === "lawyer" ? "#a855f7" : "#3b82f6" }}>{r.reportType}</span>
                <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", background: r.status === "pending" ? "rgba(251, 191, 36, 0.2)" : r.status === "resolved" ? "rgba(34, 197, 94, 0.2)" : "rgba(107, 114, 128, 0.2)", color: r.status === "pending" ? "#fbbf24" : r.status === "resolved" ? "#22c55e" : "#6b7280" }}>{r.status}</span>
              </div>
              <p style={{ fontWeight: "600", marginBottom: "0.25rem" }}>Reason: {r.reason}</p>
              {r.description && <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>{r.description}</p>}
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Reported by: {r.reportedBy?.name} ({r.reportedBy?.email})
                {r.reportType === "lawyer" && r.reportedLawyer && ` • Against: ${r.reportedLawyer.name} (Bar: ${r.reportedLawyer.barNumber})`}
                {r.reportType === "user" && r.reportedUser && ` • Against: ${r.reportedUser.name} (${r.reportedUser.email})`}
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>{new Date(r.createdAt).toLocaleString()}</p>
              {r.adminNotes && <p style={{ fontSize: "0.85rem", marginTop: "0.5rem", fontStyle: "italic", color: "var(--text-muted)" }}>Admin notes: {r.adminNotes}</p>}
              {r.status === "pending" && (
                <div style={{ marginTop: "1rem", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Admin notes (optional)"
                    value={notes[r._id] || ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [r._id]: e.target.value }))}
                    style={{ flex: "1 1 200px", minWidth: "150px", padding: "8px 12px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "inherit", fontSize: "0.9rem" }}
                  />
                  <button
                    disabled={resolvingId === r._id}
                    onClick={async () => {
                      setResolvingId(r._id);
                      await onResolve(r._id, "dismissed", notes[r._id]);
                      setResolvingId(null);
                    }}
                    style={{ padding: "8px 16px", background: "rgba(107, 114, 128, 0.2)", border: "1px solid #6b7280", borderRadius: "8px", color: "#9ca3af", cursor: "pointer", fontSize: "0.85rem" }}
                  >
                    Dismiss
                  </button>
                  <button
                    disabled={resolvingId === r._id}
                    onClick={async () => {
                      setResolvingId(r._id);
                      await onResolve(r._id, "resolved", notes[r._id]);
                      setResolvingId(null);
                    }}
                    style={{ padding: "8px 16px", background: "rgba(34, 197, 94, 0.2)", border: "1px solid #22c55e", borderRadius: "8px", color: "#22c55e", cursor: "pointer", fontSize: "0.85rem" }}
                  >
                    Resolve
                  </button>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </>
  );
}

function ArticlesTab({ articles, loading, onRefresh, onAdd, onEdit, onDelete }) {
  if (loading) return <div className="page-container center-content">Loading articles...</div>;
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Manage Legal Guide articles (Know Your Rights). These appear on the public Legal Guide page.
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onRefresh} style={{ padding: "8px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.9rem" }}>Refresh</button>
          <button onClick={onAdd} style={{ padding: "8px 16px", background: "rgba(168, 85, 247, 0.2)", border: "1px solid #a855f7", borderRadius: "8px", color: "#a855f7", cursor: "pointer", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <Plus size={18} /> Add Article
          </button>
        </div>
      </div>
      {articles.length === 0 ? (
        <GlassCard style={{ textAlign: "center", padding: "3rem" }}>
          <BookOpen size={48} style={{ margin: "0 auto 1rem", color: "var(--text-muted)" }} />
          <p style={{ color: "var(--text-muted)" }}>No articles yet. Add one to show on the Legal Guide page.</p>
          <button onClick={onAdd} style={{ marginTop: "1rem", padding: "10px 20px", background: "rgba(168, 85, 247, 0.2)", border: "1px solid #a855f7", borderRadius: "8px", color: "#a855f7", cursor: "pointer" }}>Add Article</button>
        </GlassCard>
      ) : (
        <GlassCard style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
                <th style={{ padding: "12px 8px" }}>Title</th>
                <th style={{ padding: "12px 8px" }}>Category</th>
                <th style={{ padding: "12px 8px" }}>Slug</th>
                <th style={{ padding: "12px 8px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((art) => (
                <tr key={art._id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "12px 8px" }}>{art.title}</td>
                  <td style={{ padding: "12px 8px", color: "var(--text-muted)" }}>{art.category}</td>
                  <td style={{ padding: "12px 8px", color: "var(--text-muted)", fontSize: "0.85rem" }}>{art.slug}</td>
                  <td style={{ padding: "12px 8px" }}>
                    <button onClick={() => onEdit(art)} style={{ padding: "6px 12px", marginRight: "8px", background: "rgba(59, 130, 246, 0.2)", border: "1px solid #3b82f6", borderRadius: "8px", color: "#3b82f6", cursor: "pointer", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <Pencil size={14} /> Edit
                    </button>
                    <button onClick={() => onDelete(art._id)} style={{ padding: "6px 12px", background: "rgba(239, 68, 68, 0.2)", border: "1px solid #ef4444", borderRadius: "8px", color: "#ef4444", cursor: "pointer", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}
    </>
  );
}

function ArticleModal({ mode, initial, onClose, onSuccess }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [category, setCategory] = useState(initial?.category || ARTICLE_CATEGORIES[0]);
  const [excerpt, setExcerpt] = useState(initial?.excerpt || "");
  const [content, setContent] = useState(initial?.content || "");
  const [language, setLanguage] = useState(initial?.language || "en");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!content.trim()) {
      setError("Content is required");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "create") {
        await articlesAPI.createArticle({ title: title.trim(), slug: slug.trim() || undefined, category: category.trim(), excerpt: excerpt.trim(), content: content.trim(), language: language.trim() });
      } else {
        await articlesAPI.updateArticle(initial._id, { title: title.trim(), slug: slug.trim() || undefined, category: category.trim(), excerpt: excerpt.trim(), content: content.trim(), language: language.trim() });
      }
      onSuccess();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <GlassCard style={{ maxWidth: "600px", width: "100%", maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3>{mode === "create" ? "Add Article" : "Edit Article"}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.5rem" }}>×</button>
        </div>
        {error && <p style={{ color: "#ef4444", fontSize: "0.9rem", marginBottom: "1rem" }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Article title" required style={{ width: "100%", padding: "10px 12px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "inherit", marginBottom: "1rem", fontSize: "1rem" }} />
          <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Slug (optional – auto from title if empty)</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="url-friendly-slug" style={{ width: "100%", padding: "10px 12px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "inherit", marginBottom: "1rem", fontSize: "0.9rem" }} />
          <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Category *</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%", padding: "10px 12px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "inherit", marginBottom: "1rem", cursor: "pointer" }}>
            {[...(category && !ARTICLE_CATEGORIES.includes(category) ? [category] : []), ...ARTICLE_CATEGORIES].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Excerpt (optional)</label>
          <input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Short summary" style={{ width: "100%", padding: "10px 12px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "inherit", marginBottom: "1rem", fontSize: "0.9rem" }} />
          <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Content *</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Full article content (plain text)" required style={{ width: "100%", padding: "12px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "inherit", minHeight: "200px", resize: "vertical", fontFamily: "inherit", marginBottom: "1rem" }} />
          <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>Language</label>
          <input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="en" style={{ width: "100%", padding: "10px 12px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "inherit", marginBottom: "1rem", fontSize: "0.9rem" }} />
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={{ padding: "10px 20px", background: "rgba(107, 114, 128, 0.2)", border: "1px solid #6b7280", borderRadius: "8px", color: "#6b7280", cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={submitting} style={{ padding: "10px 20px", background: "rgba(168, 85, 247, 0.2)", border: "1px solid #a855f7", borderRadius: "8px", color: "#a855f7", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>{submitting ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

export default AdminPanel;
