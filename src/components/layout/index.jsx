import { useAuth } from "../../hooks/useAuth";
import { Avatar } from "../shared/index.jsx";
import RenewalNotificationBell from "../shared/RenewalNotificationBell.jsx";
import egiLogo from "../../assets/logo.png";

// ── SVG Icons ────────────────────────────────────────────────────────────────
const icons = {
  dashboard:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  tasks:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  mytasks:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  interns:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  supervisors: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  projects:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>,
 
  schedule:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  social:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  content:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/></svg>,
  files:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>,
  profile:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  signout:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  // ── diary icon (book/pen) ────────────────────────────────────────────────
  diary:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/><line x1="12" y1="6" x2="16" y2="6"/><line x1="12" y1="10" x2="16" y2="10"/><line x1="12" y1="14" x2="14" y2="14"/></svg>,
  // ── NEW: renewals icon (refresh/clock) ──────────────────────────────────
  renewals:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 11-3-6.7"/><polyline points="21 3 21 9 15 9"/></svg>,
};

// ── Nav Data ─────────────────────────────────────────────────────────────────
const INTERN_NAV = [
    { key: "diary",     label: "My Diary"     }, 
  { key: "dashboard", label: "Dashboard"    },
  { key: "mytasks",   label: "My Tasks"     },

  { key: "schedule",  label: "Schedule"     },
  { key: "social",    label: "Social Media" },
  { key: "files",     label: "Files"        },

  { key: "profile",   label: "My Profile"   },
];

const SUPERVISOR_NAV_SENIOR = [
    { key: "diary",       label: "My Diary"      }, 
  { key: "dashboard",   label: "Dashboard"     },
  { key: "tasks",       label: "All Tasks"     },
  { key: "mytasks",     label: "My Tasks"      },
    { key: "profile",     label: "My Profile"    },   
  { key: "interns",     label: "Interns"       },
  { key: "supervisors", label: "Supervisors"   },
  { key: "projects",    label: "Projects"      },
  
  { key: "schedule",    label: "Schedule"      },
  { key: "social",      label: "Post Approval" },
  { key: "content",     label: "Content Cal."  },
  { key: "files",       label: "Files"         },
  // ── NEW: renewals nav item (senior) ────────────────────────────────────
  { key: "renewals",    label: "Renewals"      },

];

const SUPERVISOR_NAV_JUNIOR = [
  { key: "diary",     label: "My Diary"      }, 
  { key: "dashboard", label: "Dashboard"     },
  { key: "tasks",     label: "All Tasks"     },
  { key: "mytasks",   label: "My Tasks"      },
    { key: "profile",     label: "My Profile"    },   
  { key: "interns",   label: "Interns"       },
  { key: "projects",  label: "Projects"      },
 
  { key: "schedule",  label: "Schedule"      },
  { key: "social",    label: "Post Approval" },
  { key: "content",   label: "Content Cal."  },
  { key: "files",     label: "Files"         },
  
];

// ── Sidebar ──────────────────────────────────────────────────────────────────
export function Sidebar({ page, setPage }) {
  const { user, logout, isSenior, isJunior } = useAuth();

  const nav = user?.role === "intern"
    ? INTERN_NAV
    : isSenior
    ? SUPERVISOR_NAV_SENIOR
    : SUPERVISOR_NAV_JUNIOR;

  const levelLabel = isSenior
    ? "Senior Supervisor"
    : isJunior
    ? "Junior Supervisor"
    : user?.role === "supervisor"
    ? "Supervisor"
    : "Intern";

  const levelDot = isSenior
    ? "#f59e0b"
    : isJunior
    ? "#f97316"
    : user?.role === "supervisor"
    ? "#10b981"
    : "#6ee7b7";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

        .egi-sidebar { font-family: 'DM Sans', sans-serif; }

        .egi-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 10px;
          cursor: pointer;
          color: rgba(255,255,255,0.72);
          font-size: 13.5px;
          font-weight: 500;
          transition: all 0.15s ease;
          user-select: none;
          position: relative;
          margin-bottom: 2px;
          border: 1px solid transparent;
        }
        .egi-nav-item:hover {
          color: #ffffff;
          background: rgba(255,255,255,0.06);
        }
        .egi-nav-item.active {
          color: #ffffff;
          background: #0f6240;
          border-color: rgba(255,255,255,0.12);
          box-shadow: 0 4px 14px rgba(0,0,0,0.18);
          font-weight: 650;
        }
        .egi-nav-item.active .nav-icon { color: #ffffff; opacity: 1; }
        .egi-nav-item .nav-icon {
          width: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          opacity: 0.75;
          transition: opacity 0.15s;
        }
        .egi-nav-item:hover .nav-icon { opacity: 1; }

        .egi-nav-scroll::-webkit-scrollbar { width: 3px; }
        .egi-nav-scroll::-webkit-scrollbar-track { background: transparent; }
        .egi-nav-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }

        .egi-signout-btn {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.04);
          color: #f1f5f9;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          transition: all 0.15s ease;
        }
        .egi-signout-btn:hover {
          background: rgba(239,68,68,0.15);
          border-color: rgba(239,68,68,0.35);
          color: #fca5a5;
        }
      `}</style>

      <nav className="egi-sidebar" style={{
        width: 260,
        background: "linear-gradient(180deg, #072a1d 0%, #041910 100%)",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0, left: 0,
        zIndex: 100,
        borderRight: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "2px 0 16px rgba(0,0,0,0.12)",
      }}>

        {/* Brand */}
        <div style={{ padding: "24px 22px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 42, height: 42,
              borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <img src={egiLogo} alt="EGI Logo"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 15, color: "#ffffff", letterSpacing: 1.2, lineHeight: 1.15 }}>
                ECO GREEN
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9.5, color: "rgba(255,255,255,0.6)", letterSpacing: 2, textTransform: "uppercase", marginTop: 2 }}>
                INTERNATIONAL
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="egi-nav-scroll" style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
          {nav.map((item) => {
            const isDiary = item.key === "diary";

            return (
              <div
                key={item.key}
                className={`egi-nav-item${page === item.key ? " active" : ""}`}
                onClick={() => setPage(item.key)}
              >
                <span className="nav-icon">{icons[item.key] || icons.files}</span>
                <span>{item.label}</span>

                {/* "PRIVATE" badge shown on Diary */}
                {isDiary && (
                  <span style={{
                    marginLeft: "auto",
                    fontSize: 8.5, fontWeight: 800,
                    padding: "2px 7px", borderRadius: 99,
                    background: "#453408",
                    color: "#f5c84c",
                    border: "1px solid #785a12",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    flexShrink: 0,
                  }}>PRIVATE</span>
                )}
              </div>
            );
          })}
        </div>

        {/* User Profile Card & Signout Footer */}
        <div style={{ padding: "14px 14px 18px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 12,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            marginBottom: 10,
          }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <Avatar initials={user?.name?.charAt(0) || "U"} color={user?.avatarColor || "#10b981"} size="sm" src={user?.profilePicture} />
              <span style={{
                position: "absolute", bottom: -1, right: -1,
                width: 8, height: 8, borderRadius: "50%",
                background: levelDot,
                border: "2px solid #072a1d",
              }} />
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, fontWeight: 700, color: "#ffffff",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>{user?.name || "User"}</div>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9, color: "rgba(255,255,255,0.5)",
                letterSpacing: 0.6, marginTop: 1,
              }}>{levelLabel.toUpperCase()}</div>
            </div>
            <button
              onClick={() => setPage("profile")}
              title="Settings & Profile"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(255,255,255,0.45)", padding: 4, display: "flex", alignItems: "center",
                transition: "color 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = "#ffffff"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>

          <button className="egi-signout-btn" onClick={logout}>
            {icons.signout}
            Log Out
          </button>
        </div>
      </nav>
    </>
  );
}

// ── Topbar ────────────────────────────────────────────────────────────────────
export function Topbar({ page }) {
  const { user, isSenior } = useAuth();

  const now = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const roleText = user?.role === "intern"
    ? "Intern"
    : isSenior
    ? "Senior Supervisor"
    : "Supervisor";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        .egi-topbar { font-family: 'DM Sans', sans-serif; }
        .egi-topbar-search-input {
          width: 340px;
          height: 38px;
          padding: 0 16px 0 38px;
          border-radius: 999px;
          border: 1px solid #e1ece5;
          background: #f1f5f3;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #1e293b;
          outline: none;
          transition: all 0.15s ease;
        }
        .egi-topbar-search-input:focus {
          background: #ffffff;
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.12);
        }
      `}</style>

      <header className="egi-topbar" style={{
        background: "#ffffff",
        borderBottom: "1px solid #e8f0ec",
        padding: "0 32px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
      }}>

        {/* Left: Global Search Capsule */}
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <svg style={{ position: "absolute", left: 13, pointerEvents: "none", color: "#64748b" }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="egi-topbar-search-input"
            placeholder="Search interns, tasks, or projects..."
          />
        </div>

        {/* Right: Notifications, Date & User Profile */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Notification Bell */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isSenior ? (
              <RenewalNotificationBell />
            ) : (
              <button
                title="Notifications"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  position: "relative", color: "#475569", display: "flex", alignItems: "center",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <span style={{
                  position: "absolute", top: -1, right: -1, width: 7, height: 7,
                  borderRadius: "50%", background: "#ef4444", border: "1.5px solid #fff",
                }} />
              </button>
            )}
          </div>

          {/* Date Badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "6px 12px", borderRadius: 8,
            background: "#f4f8f5", border: "1px solid #e2ece6",
            fontSize: 12, fontWeight: 500, color: "#3e564a",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>{now}</span>
          </div>

          <div style={{ width: 1, height: 26, background: "#e2e8f0" }} />

          {/* User Info */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar initials={user?.name?.charAt(0)} color={user?.avatarColor || "#10b981"} size="sm" src={user?.profilePicture} />
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: "#0f281e", lineHeight: 1.15 }}>
                {user?.name || "User"}
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#5a7568", marginTop: 2 }}>
                {roleText}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}