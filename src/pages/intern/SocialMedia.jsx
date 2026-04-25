// pages/intern/SocialMedia.jsx
import { useState } from "react";
import { useSocial } from "../../hooks/useSocial";
import PerformanceModal from "../../components/shared/PerformanceModal";

const statusColors = {
  Planned: { bg: "#E8F4FF", text: "#1565C0", dot: "#2196F3" },
  Posted: { bg: "#E8F5E9", text: "#2E7D32", dot: "#4CAF50" },
  Missed: { bg: "#FFEBEE", text: "#C62828", dot: "#F44336" },
  "Reviewed": { bg: "#FFF8E1", text: "#F57F17", dot: "#FFC107" },

};

const platformIcons = {
  Instagram: "📸", Facebook: "👤", Twitter: "🐦",
  LinkedIn: "💼", TikTok: "🎵", YouTube: "▶️", Other: "🌐",
};

export default function InternSocialMedia() {
  const { contents, stats, loading, markAsPosted, submitPerformance } = useSocial();

  const [activeTab, setActiveTab] = useState("all");
  const [showPostModal, setShowPostModal] = useState(null);
  const [showPerformanceModal, setShowPerformanceModal] = useState(null);
  const [postUrl, setPostUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredContents = contents.filter((c) => {
    if (activeTab === "all") return true;
    if (activeTab === "due") return c.status === "Planned";
    if (activeTab === "posted") return c.status === "Posted";
    if (activeTab === "missed") return c.status === "Missed";
    if (activeTab === "review") return c.status === "Reviewed";
    return true;
  });

  const handleMarkPosted = async () => {
    if (!showPostModal) return;
    setSubmitting(true);
    try {
      await markAsPosted(showPostModal._id, postUrl);
      setShowPostModal(null);
      setPostUrl("");
    } finally {
      setSubmitting(false);
    }
  };

  // Check if 7+ days since posting and no metrics
  const needsMetrics = (item) => {
    if (item.status !== "Posted" || item.metrics) return false;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return item.actualPostDate && new Date(item.actualPostDate) <= sevenDaysAgo;
  };

  const isOverdue = (item) => {
    return item.status === "Planned" && new Date(item.plannedPostDate) < new Date();
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#F8FAFC", minHeight: "100vh", padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.5px" }}>
          📱 My Content Tasks
        </h1>
        <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: 14 }}>
          Manage your assigned social media posts
        </p>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Total", value: stats.overview.total, color: "#2563EB" },
            { label: "Planned", value: stats.overview.planned, color: "#0891B2" },
            { label: "Posted", value: stats.overview.posted, color: "#16A34A" },
            { label: "Missed", value: stats.overview.missed, color: "#DC2626" },
          ].map((s) => (
            <div key={s.label} style={{
              background: "#fff", borderRadius: 12, padding: "16px 20px",
              border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 2, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { key: "all", label: "All" },
          { key: "due", label: "🔵 Planned" },
          { key: "posted", label: "🟢 Posted" },
          { key: "missed", label: "🔴 Missed" },
          { key: "review", label: "🟡 Review" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "1.5px solid",
              borderColor: activeTab === tab.key ? "#2563EB" : "#E2E8F0",
              background: activeTab === tab.key ? "#EFF6FF" : "#fff",
              color: activeTab === tab.key ? "#2563EB" : "#64748B",
              fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Cards */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#64748B" }}>Loading your content...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredContents.length === 0 ? (
            <div style={{
              textAlign: "center", padding: 60, background: "#fff",
              borderRadius: 16, border: "1px solid #E2E8F0", color: "#94A3B8",
            }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
              <div style={{ fontWeight: 600 }}>No content here</div>
            </div>
          ) : filteredContents.map((item) => {
            const sc = statusColors[item.status] || statusColors.Planned;
            const overdue = isOverdue(item);
            const metricsNeeded = needsMetrics(item);

            return (
              <div key={item._id} style={{
                background: "#fff", borderRadius: 14, padding: "18px 20px",
                border: `1.5px solid ${overdue || metricsNeeded ? "#FDE68A" : "#E2E8F0"}`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    {/* Alerts */}
                    {overdue && (
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        background: "#FEF3C7", color: "#92400E", borderRadius: 6,
                        padding: "3px 10px", fontSize: 11, fontWeight: 600, marginBottom: 8,
                      }}>
                        ⚠️ Overdue — mark as posted or it will be marked missed
                      </div>
                    )}
                    {metricsNeeded && (
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        background: "#DBEAFE", color: "#1E40AF", borderRadius: 6,
                        padding: "3px 10px", fontSize: 11, fontWeight: 600, marginBottom: 8,
                      }}>
                        📊 7 days passed — please add performance data
                      </div>
                    )}

                    <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
                      {item.title}
                    </h3>

                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, color: "#475569" }}>
                        {platformIcons[item.platform]} {item.platform}
                      </span>
                      <span style={{ fontSize: 13, color: "#475569" }}>
                        📅 {new Date(item.plannedPostDate).toLocaleDateString()}
                      </span>
                      {item.actualPostDate && (
                        <span style={{ fontSize: 13, color: "#16A34A" }}>
                          ✅ Posted {new Date(item.actualPostDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Metrics Summary */}
                    {item.metrics && (
                      <div style={{
                        marginTop: 12, display: "flex", gap: 16, flexWrap: "wrap",
                        padding: "10px 14px", background: "#F0FDF4", borderRadius: 8,
                      }}>
                        {[
                          { label: "Views", value: item.metrics.views?.toLocaleString() },
                          { label: "Likes", value: item.metrics.likes?.toLocaleString() },
                          { label: "Comments", value: item.metrics.comments },
                          { label: "Shares", value: item.metrics.shares },
                          { label: "Eng. Rate", value: `${item.metrics.engagementRate}%` },
                          { label: "Score", value: item.metrics.performanceScore?.toLocaleString() },
                        ].map((m) => (
                          <div key={m.label} style={{ textAlign: "center" }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>{m.value}</div>
                            <div style={{ fontSize: 11, color: "#64748B" }}>{m.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Side */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      background: sc.bg, color: sc.text, padding: "5px 12px",
                      borderRadius: 20, fontSize: 12, fontWeight: 700,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, display: "inline-block" }} />
                      {item.status}
                    </span>

                    <div style={{ display: "flex", gap: 8 }}>
                      {item.status === "Planned" && (
                        <button
                          onClick={() => setShowPostModal(item)}
                          style={actionBtnPrimary}
                        >
                          ✅ Mark Posted
                        </button>
                      )}
                      {metricsNeeded && (
                        <button
                          onClick={() => setShowPerformanceModal(item)}
                          style={{ ...actionBtnPrimary, background: "#10B981" }}
                        >
                          📊 Add Metrics
                        </button>
                      )}
                      {item.postUrl && (
                        <a href={item.postUrl} target="_blank" rel="noreferrer"
                          style={{ ...actionBtnSecondary, textDecoration: "none" }}>
                          🔗 View
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mark Posted Modal */}
      {showPostModal && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
              ✅ Mark as Posted
            </h2>
            <p style={{ margin: "0 0 20px", color: "#64748B", fontSize: 14 }}>
              Confirming post: <strong>{showPostModal.title}</strong>
            </p>
            <label style={labelStyle}>Post URL (optional)</label>
            <input
              type="url"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              placeholder="https://instagram.com/p/..."
              style={inputStyle}
            />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setShowPostModal(null)} style={cancelBtn}>Cancel</button>
              <button onClick={handleMarkPosted} disabled={submitting} style={submitBtn}>
                {submitting ? "Saving..." : "Confirm Posted"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Performance Modal */}
      {showPerformanceModal && (
        <PerformanceModal
          content={showPerformanceModal}
          onClose={() => setShowPerformanceModal(null)}
          onSubmit={async (metrics) => {
            await submitPerformance(showPerformanceModal._id, metrics);
            setShowPerformanceModal(null);
          }}
        />
      )}
    </div>
  );
}

const actionBtnPrimary = {
  background: "#2563EB", color: "#fff", border: "none", borderRadius: 8,
  padding: "8px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer",
};
const actionBtnSecondary = {
  background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 8,
  padding: "8px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "inline-block",
};
const modalOverlay = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
};
const modalBox = {
  background: "#fff", borderRadius: 18, padding: "28px 32px",
  width: "100%", maxWidth: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
};
const labelStyle = { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 };
const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 9, border: "1.5px solid #E2E8F0",
  fontSize: 14, color: "#0F172A", boxSizing: "border-box",
};
const cancelBtn = {
  padding: "10px 20px", borderRadius: 9, border: "1.5px solid #E2E8F0",
  background: "#fff", color: "#64748B", fontWeight: 600, fontSize: 14, cursor: "pointer",
};
const submitBtn = {
  padding: "10px 24px", borderRadius: 9, border: "none",
  background: "#2563EB", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer",
};