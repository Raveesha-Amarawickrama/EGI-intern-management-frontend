import { useAuth } from "../../hooks/useAuth";
import { Avatar } from "../shared/index.jsx";
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
  // ── NEW: diary icon (book/pen) ──────────────────────────────────────────
  diary:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/><line x1="12" y1="6" x2="16" y2="6"/><line x1="12" y1="10" x2="16" y2="10"/><line x1="12" y1="14" x2="14" y2="14"/></svg>,
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

const META = {
  diary:       { title: "My Diary",          sub: "Personal journal — your private space"  }, 
  dashboard:   { title: "Dashboard",        sub: "Overview of EGI internship activity"    },
  mytasks:     { title: "My Tasks",          sub: "View, create and manage your own tasks" },
  profile:     { title: "My Profile",        sub: "Your personal information and stats"    },
  tasks:       { title: "All Tasks",         sub: "Manage and supervise all tasks"         },
  interns:     { title: "Interns",           sub: "Active intern profiles and performance" },
  supervisors: { title: "Supervisors",       sub: "Manage supervisor accounts"             },
  projects:    { title: "Projects",          sub: "Project overview and progress tracking" },
 
  schedule:    { title: "Schedule",          sub: "Meetings and calendar"                  },
  social:      { title: "Post Approval",     sub: "Review and approve social media drafts" },
  content:     { title: "Content Calendar",  sub: "Published content overview"             },
  files:       { title: "Files",             sub: "Upload, share and manage documents"     },
  
};

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
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        .egi-sidebar { font-family: 'DM Sans', sans-serif; }

        .egi-nav-item {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 9px 14px;
          border-radius: 8px;
          cursor: pointer;
          color: rgba(255,255,255,0.45);
          font-size: 13px;
          font-weight: 500;
          transition: all 0.15s ease;
          user-select: none;
          position: relative;
          margin-bottom: 1px;
          border: 1px solid transparent;
        }
        .egi-nav-item:hover {
          color: rgba(255,255,255,0.85);
          background: rgba(255,255,255,0.05);
        }
        .egi-nav-item.active {
          color: #10b981;
          background: rgba(16,185,129,0.1);
          border-color: rgba(16,185,129,0.2);
          font-weight: 600;
        }
        .egi-nav-item.active .nav-icon { color: #10b981; }
        .egi-nav-item .nav-icon {
          width: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          opacity: 0.7;
          transition: opacity 0.15s;
        }
        .egi-nav-item:hover .nav-icon,
        .egi-nav-item.active .nav-icon { opacity: 1; }

        /* diary item gets a subtle amber tint when not active */
        .egi-nav-item.diary-item:not(.active) {
          color: rgba(251,191,36,0.55);
        }
        .egi-nav-item.diary-item:not(.active):hover {
          color: rgba(251,191,36,0.9);
          background: rgba(251,191,36,0.06);
        }

        .egi-section-label {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          font-weight: 500;
          color: rgba(255,255,255,0.2);
          letter-spacing: 1.5px;
          text-transform: uppercase;
          padding: 16px 14px 8px;
        }
        .egi-signout-btn {
          width: 100%;
          padding: 9px 14px;
          border-radius: 8px;
          border: 1px solid rgba(239,68,68,0.2);
          background: rgba(239,68,68,0.06);
          color: rgba(239,68,68,0.7);
          font-family: 'DM Sans', sans-serif;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.15s ease;
          letter-spacing: 0.2px;
        }
        .egi-signout-btn:hover {
          background: rgba(239,68,68,0.14);
          border-color: rgba(239,68,68,0.4);
          color: #fca5a5;
        }
        .egi-nav-scroll::-webkit-scrollbar { width: 3px; }
        .egi-nav-scroll::-webkit-scrollbar-track { background: transparent; }
        .egi-nav-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }

        /* diary nav separator line */
        .egi-nav-divider {
          height: 1px;
          background: rgba(255,255,255,0.05);
          margin: 8px 14px;
        }
      `}</style>

      <nav className="egi-sidebar" style={{
        width: 248,
        background: "#0b1a13",
        backgroundImage: "radial-gradient(ellipse at top left, rgba(16,185,129,0.06) 0%, transparent 60%)",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0, left: 0,
        zIndex: 100,
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}>

        {/* Brand */}
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40,
              background: "linear-gradient(135deg, #10b981, #059669)",
              borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 14px rgba(16,185,129,0.35)",
              flexShrink: 0,
            }}>
              <img src={egiLogo} alt="EGI"
                style={{ width: "75%", height: "75%", objectFit: "contain", filter: "brightness(0) invert(1)" }}
                onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
              />
              <span style={{ display: "none", color: "white", fontWeight: 800, fontSize: 14 }}>E</span>
            </div>
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13, color: "white", letterSpacing: 0.3 }}>
                Eco Green
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 1, textTransform: "uppercase", marginTop: 1 }}>
                International
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="egi-nav-scroll" style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
          <div className="egi-section-label">Navigation</div>

          {nav.map((item, idx) => {
            const isDiary = item.key === "diary";
            // Insert a divider line just before the diary item
            const prevItem = nav[idx - 1];
            const showDivider = isDiary && prevItem;

            return (
              <div key={item.key}>
                {showDivider && <div className="egi-nav-divider" />}
                <div
                  className={`egi-nav-item${page === item.key ? " active" : ""}${isDiary ? " diary-item" : ""}`}
                  onClick={() => setPage(item.key)}
                >
                  <span className="nav-icon">{icons[item.key] || icons.files}</span>
                  {item.label}

                  {/* "Private" pill shown only on diary when not active */}
                  {isDiary && page !== item.key && (
                    <span style={{
                      marginLeft: "auto",
                      fontSize: 8, fontWeight: 700,
                      padding: "1px 6px", borderRadius: 99,
                      background: "rgba(251,191,36,0.12)",
                      color: "rgba(251,191,36,0.6)",
                      border: "1px solid rgba(251,191,36,0.18)",
                      letterSpacing: "0.4px",
                      textTransform: "uppercase",
                      flexShrink: 0,
                    }}>Private</span>
                  )}

                  {page === item.key && (
                    <span style={{
                      marginLeft: "auto", width: 6, height: 6,
                      borderRadius: "50%", background: "#10b981",
                      flexShrink: 0,
                    }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* User footer */}
        <div style={{ padding: "14px 12px 18px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 10,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            marginBottom: 10,
          }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <Avatar initials={user?.name?.charAt(0) || "U"} color={user?.avatarColor || "#10b981"} size="sm" />
              <span style={{
                position: "absolute", bottom: 0, right: 0,
                width: 8, height: 8, borderRadius: "50%",
                background: levelDot,
                border: "2px solid #0b1a13",
              }} />
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12.5, fontWeight: 600, color: "white",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>{user?.name || "User"}</div>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9.5, color: "rgba(255,255,255,0.3)",
                letterSpacing: 0.5, marginTop: 1,
              }}>{levelLabel.toUpperCase()}</div>
            </div>
          </div>

          <button className="egi-signout-btn" onClick={logout}>
            {icons.signout}
            Sign Out
          </button>
        </div>
      </nav>
    </>
  );
}

// ── Topbar ────────────────────────────────────────────────────────────────────
export function Topbar({ page }) {
  const { user, isSenior, isJunior } = useAuth();
  const meta = META[page] || { title: page.charAt(0).toUpperCase() + page.slice(1), sub: "" };

  const now = new Date().toLocaleDateString("en-GB", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const badge = isSenior
    ? { label: "Senior Supervisor", bg: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "rgba(245,158,11,0.25)" }
    : isJunior
    ? { label: "Junior Supervisor", bg: "rgba(249,115,22,0.12)", color: "#f97316", border: "rgba(249,115,22,0.25)" }
    : user?.role === "supervisor"
    ? { label: "Supervisor",        bg: "rgba(16,185,129,0.12)", color: "#10b981", border: "rgba(16,185,129,0.25)" }
    : { label: "Intern",            bg: "rgba(99,102,241,0.12)", color: "#818cf8", border: "rgba(99,102,241,0.25)" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        .egi-topbar { font-family: 'DM Sans', sans-serif; }
        .egi-topbar-date {
          font-family: 'DM Mono', monospace;
          font-size: 10.5px;
          color: #94a3b8;
          font-weight: 500;
          letter-spacing: 0.3px;
        }
      `}</style>

      <header className="egi-topbar" style={{
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e8edf3",
        padding: "0 36px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.03)",
      }}>

        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 3, height: 22,
            background: page === "diary"
              ? "linear-gradient(180deg, #f59e0b, #d97706)"   // amber for diary
              : "linear-gradient(180deg, #10b981, #059669)",
            borderRadius: 2, flexShrink: 0,
          }} />
          <div>
            <h2 style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 17, fontWeight: 800,
              color: "#0f172a", margin: 0, letterSpacing: "-0.3px",
            }}>
              {page === "diary" ? "📓 " : ""}{meta.title}
            </h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11.5, color: "#94a3b8",
              margin: 0, marginTop: 1, fontWeight: 400,
            }}>{meta.sub}</p>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div className="egi-topbar-date">{now}</div>
          <div style={{ width: 1, height: 28, background: "#e2e8f0" }} />
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10, fontWeight: 500,
            padding: "4px 12px", borderRadius: 20,
            background: badge.bg, color: badge.color,
            border: `1px solid ${badge.border}`,
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}>{badge.label}</span>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#1e293b", lineHeight: 1.2 }}>
                {user?.name}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#94a3b8", marginTop: 1 }}>
                {user?.position || badge.label}
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <Avatar initials={user?.name?.charAt(0)} color={user?.avatarColor || "#10b981"} size="sm" />
              <span style={{
                position: "absolute", bottom: 0, right: 0,
                width: 8, height: 8, borderRadius: "50%",
                background: "#10b981", border: "2px solid white",
              }} />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}