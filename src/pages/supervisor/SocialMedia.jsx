// pages/supervisor/SocialMedia.jsx
import { useState, useEffect } from "react";
import { useSocial } from "../../hooks/useSocial";
import SocialContentModal from "../../components/shared/SocialContentModal";
import PerformanceModal from "../../components/shared/PerformanceModal";
import api from "../../utils/api";

const PLATFORMS = ["Instagram", "Facebook", "Twitter", "LinkedIn", "TikTok", "YouTube", "Other"];
const STATUSES = ["Planned", "Posted", "Missed", "Reviewed"];

const statusColors = {
  Planned: { bg: "#E8F4FF", text: "#1565C0", dot: "#2196F3" },
  Posted: { bg: "#E8F5E9", text: "#2E7D32", dot: "#4CAF50" },
  Missed: { bg: "#FFEBEE", text: "#C62828", dot: "#F44336" },
 "Reviewed": { bg: "#FFF8E1", text: "#F57F17", dot: "#FFC107" },
};

const platformIcons = {
  Instagram: "📸",
  Facebook: "👤",
  Twitter: "🐦",
  LinkedIn: "💼",
  TikTok: "🎵",
  YouTube: "▶️",
  Other: "🌐",
};

export default function SupervisorSocialMedia() {
  const {
    contents,
    stats,
    loading,
    fetchContents,
    createContent,
    deleteContent,
    markAsPosted,
  } = useSocial();

  const [users, setUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    api.get("/users?role=intern").then((r) => setUsers(r.data.data || []));
  }, []);

  const handleFilter = () => {
    fetchContents({ status: filterStatus, platform: filterPlatform });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this content?")) {
      await deleteContent(id);
    }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#F8FAFC", minHeight: "100vh", padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.5px" }}>
            📱 Social Media Tracker
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: 14 }}>
            Content monitoring & performance dashboard
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            background: "#2563EB", color: "#fff", border: "none", borderRadius: 10,
            padding: "10px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          + Assign Content
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#E2E8F0", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {["overview", "content"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer",
              fontWeight: 600, fontSize: 13, textTransform: "capitalize",
              background: activeTab === tab ? "#fff" : "transparent",
              color: activeTab === tab ? "#0F172A" : "#64748B",
              boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.15s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && stats && (
        <>
          {/* Stats Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
            {[
              { label: "Total Content", value: stats.overview.total, color: "#2563EB", bg: "#EFF6FF" },
              { label: "Planned", value: stats.overview.planned, color: "#0891B2", bg: "#ECFEFF" },
              { label: "Posted", value: stats.overview.posted, color: "#16A34A", bg: "#F0FDF4" },
              { label: "Missed", value: stats.overview.missed, color: "#DC2626", bg: "#FEF2F2" },
              { label: "Reviewed", value: stats.overview.reviewed, color: "#D97706", bg: "#FFFBEB" },
            ].map((s) => (
              <div key={s.label} style={{
                background: "#fff", borderRadius: 14, padding: "20px 24px",
                border: `1px solid ${s.bg}`, boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 13, color: "#64748B", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Platform Breakdown */}
          {stats.platformBreakdown?.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #E2E8F0", marginBottom: 24 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Platform Breakdown</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {stats.platformBreakdown.map((p) => (
                  <div key={p._id} style={{
                    background: "#F8FAFC", borderRadius: 10, padding: "12px 16px",
                    border: "1px solid #E2E8F0", minWidth: 120,
                  }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{platformIcons[p._id] || "🌐"}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>{p._id}</div>
                    <div style={{ fontSize: 12, color: "#64748B" }}>{p.count} total · {p.missed} missed</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Performers */}
          {stats.topPerformers?.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #E2E8F0" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#0F172A" }}>🏆 Top Performers (Last 30 Days)</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {stats.topPerformers.map((item, i) => (
                  <div key={item._id} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                    background: i === 0 ? "#FFFBEB" : "#F8FAFC", borderRadius: 10,
                    border: `1px solid ${i === 0 ? "#FDE68A" : "#E2E8F0"}`,
                  }}>
                    <span style={{ fontSize: 18, width: 28 }}>{["🥇", "🥈", "🥉", "4️⃣", "5️⃣"][i]}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#0F172A" }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: "#64748B" }}>
                        {platformIcons[item.platform]} {item.platform} · by {item.assignedTo?.name}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: "#2563EB" }}>
                        {item.metrics?.performanceScore?.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748B" }}>score</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Content Tab */}
      {activeTab === "content" && (
        <>
          {/* Filters */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={selectStyle}
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              style={selectStyle}
            >
              <option value="">All Platforms</option>
              {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
            </select>
            <button onClick={handleFilter} style={filterBtnStyle}>Apply Filters</button>
            <button onClick={() => { setFilterStatus(""); setFilterPlatform(""); fetchContents(); }}
              style={{ ...filterBtnStyle, background: "#F1F5F9", color: "#64748B" }}>
              Clear
            </button>
          </div>

          {/* Content Table */}
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#64748B" }}>Loading...</div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC" }}>
                    {["Title", "Platform", "Assigned To", "Planned Date", "Status", "Performance", "Actions"].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contents.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>No content found</td></tr>
                  ) : contents.map((item) => {
                    const sc = statusColors[item.status] || statusColors.Planned;
                    return (
                      <tr key={item._id} style={{ borderTop: "1px solid #F1F5F9" }}>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 14 }}>{item.title}</div>
                          {item.postUrl && (
                            <a href={item.postUrl} target="_blank" rel="noreferrer"
                              style={{ fontSize: 11, color: "#2563EB" }}>View Post ↗</a>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: 16 }}>{platformIcons[item.platform]}</span>{" "}
                          <span style={{ fontSize: 13, color: "#475569" }}>{item.platform}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: 13, color: "#475569" }}>{item.assignedTo?.name || "—"}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: 13, color: "#475569" }}>
                            {new Date(item.plannedPostDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            background: sc.bg, color: sc.text, padding: "4px 10px",
                            borderRadius: 20, fontSize: 12, fontWeight: 600,
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, display: "inline-block" }} />
                            {item.status}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {item.metrics ? (
                            <div style={{ fontSize: 12 }}>
                              <div style={{ color: "#2563EB", fontWeight: 700 }}>
                                {item.metrics.performanceScore?.toLocaleString()} pts
                              </div>
                              <div style={{ color: "#64748B" }}>
                                {item.metrics.engagementRate}% eng.
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: "#94A3B8" }}>No data</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", gap: 6 }}>
                            {item.status === "Reviewed" && (
                              <button
                                onClick={() => setShowPerformanceModal(item)}
                                style={actionBtnStyle("#EFF6FF", "#2563EB")}
                              >📊 View</button>
                            )}
                            <button
                              onClick={() => handleDelete(item._id)}
                              style={actionBtnStyle("#FEF2F2", "#DC2626")}
                            >🗑</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showCreateModal && (
        <SocialContentModal
          users={users}
          onClose={() => setShowCreateModal(false)}
          onSubmit={async (data) => {
            await createContent(data);
            setShowCreateModal(false);
          }}
        />
      )}
      {showPerformanceModal && (
        <PerformanceModal
          content={showPerformanceModal}
          readOnly
          onClose={() => setShowPerformanceModal(null)}
        />
      )}
    </div>
  );
}

// Style helpers
const selectStyle = {
  padding: "9px 14px", borderRadius: 9, border: "1.5px solid #E2E8F0",
  fontSize: 13, color: "#475569", background: "#fff", cursor: "pointer",
};
const filterBtnStyle = {
  padding: "9px 18px", borderRadius: 9, border: "none", background: "#2563EB",
  color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer",
};
const thStyle = {
  padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600,
  color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px",
};
const tdStyle = { padding: "14px 16px", verticalAlign: "middle" };
const actionBtnStyle = (bg, color) => ({
  background: bg, color, border: "none", borderRadius: 7, padding: "5px 10px",
  fontSize: 12, fontWeight: 600, cursor: "pointer",
});