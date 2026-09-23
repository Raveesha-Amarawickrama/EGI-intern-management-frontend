import { useState, useEffect, useCallback, useRef } from "react";
import { taskAPI, userAPI, reportAPI, projectAPI, authAPI } from "../../utils/api";
import { StatusBadge, Avatar, Toast } from "../../components/shared/index.jsx";
import TaskModal from "../../components/shared/TaskModal.jsx";
import SubTaskList from "../../components/shared/SubTaskList.jsx";
import TaskTimer from "../../components/shared/TaskTimer.jsx";
import { WeeklyHoursBar } from "../../components/shared/WeeklyHoursCard.jsx";
import { computeStats, formatMinutes, statusSelectClass, getWeekKey } from "../../utils/helpers";
import { useAuth } from "../../hooks/useAuth";
import logoImg from "../../assets/logo.png";

// ─── CSS injection for overdue/leave row hover states ─────────────────────────
function OverdueRowStyles() {
  return (
    <style>{`
      .overdue-row td { background: #fee2e2 !important; border-left: 3px solid #ef4444; }
      .overdue-row:hover td { background: #fecaca !important; }
      .leave-row td { background: #fffbeb !important; }
      .leave-row:hover td { background: #fef3c7 !important; }
    `}</style>
  );
}

function overdueRowClass(t) {
  if (t.isLeave) return "leave-row";
  if (t.status === "To Do" && t.date && t.date < new Date().toISOString().split("T")[0]) {
    return "overdue-row";
  }
  return "";
}

// ─── Render text with clickable links ──────────────────────────────────
function TextWithLinks({ text }) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return (
    <>
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              color: "#2563eb",
              textDecoration: "underline",
              wordBreak: "break-all",
              cursor: "pointer",
            }}
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ─── Confirm Dialog Component (kept for other flows, e.g. reset/remove intern) ──
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, padding: 16,
    }}>
      <div style={{
        background: "white", borderRadius: 16, padding: "28px 28px 24px",
        boxShadow: "0 24px 80px rgba(0,0,0,.3)", maxWidth: 380, width: "100%",
      }}>
        <div style={{ fontSize: 32, marginBottom: 12, textAlign: "center" }}>🗑️</div>
        <div style={{
          fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 17,
          color: "#dc2626", marginBottom: 8, textAlign: "center",
        }}>Are you sure?</div>
        <p style={{ fontSize: 13, color: "#6b7280", textAlign: "center", marginBottom: 24 }}>
          {message || "This action cannot be undone."}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "9px 22px", borderRadius: 9, border: "1px solid #e5e7eb",
              background: "#f9fafb", color: "#374151", fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >Cancel</button>
          <button
            onClick={onConfirm}
            style={{
              padding: "9px 22px", borderRadius: 9, border: "none",
              background: "#ef4444", color: "white", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

function useConfirm() {
  const [confirmState, setConfirmState] = useState(null);

  const confirm = (message) =>
    new Promise((resolve) => {
      setConfirmState({ message, resolve });
    });

  const handleConfirm = () => {
    confirmState?.resolve(true);
    setConfirmState(null);
  };

  const handleCancel = () => {
    confirmState?.resolve(false);
    setConfirmState(null);
  };

  const ConfirmComponent = confirmState ? (
    <ConfirmDialog
      message={confirmState.message}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null;

  return { confirm, ConfirmComponent };
}

function getUpcomingWeekends(count = 8) {
  const dates = [];
  const d = new Date();
  for (let i = 0; i < 60 && dates.length < count; i++) {
    const day = d.getDay();
    if (day === 0 || day === 6) {
      dates.push({
        value: d.toISOString().split("T")[0],
        label: d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" }),
        isSat: day === 6,
      });
    }
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function WeekendSelector({ weekendDates, setWeekendDates }) {
  const weekends = getUpcomingWeekends(8);
  const toggle = (val) =>
    setWeekendDates(prev =>
      prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]
    );
  return (
    <div style={{ marginTop: 12, padding: "14px 16px", borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>📅 Mark Weekend Days</div>
      <p style={{ fontSize: 11, color: "#b45309", marginBottom: 10 }}>Select upcoming Saturdays/Sundays to mark as separate leave entries.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {weekends.map(w => (
          <button key={w.value} type="button" onClick={() => toggle(w.value)} style={{
            padding: "4px 11px", borderRadius: 99, fontSize: 11, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit", transition: "all .12s", border: "1px solid",
            borderColor: weekendDates.includes(w.value) ? "#f59e0b" : "#fde68a",
            background: weekendDates.includes(w.value) ? (w.isSat ? "#fcd34d" : "#fde68a") : "#fff",
            color: weekendDates.includes(w.value) ? "#78350f" : "#92400e",
          }}>
            {weekendDates.includes(w.value) ? "✓ " : ""}{w.label}
            <span style={{ fontSize: 10, marginLeft: 4, opacity: .7 }}>{w.isSat ? "Sat" : "Sun"}</span>
          </button>
        ))}
      </div>
      {weekendDates.length > 0 && (
        <p style={{ fontSize: 11, color: "#166534", marginTop: 8, fontWeight: 600 }}>
          {weekendDates.length} weekend day{weekendDates.length > 1 ? "s" : ""} will be saved as leave entries.
        </p>
      )}
    </div>
  );
}

function LeaveBadge({ reason }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px",
      borderRadius: 99, fontSize: 11, fontWeight: 700,
      background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a",
    }}>
      🌴 Leave Day{reason ? ` — ${reason}` : ""}
    </span>
  );
}

function buildWeekOptions() {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i * 7);
    const wk = getWeekKey(d);
    const sun = new Date(d);
    sun.setDate(d.getDate() - d.getDay());
    const sat = new Date(sun);
    sat.setDate(sun.getDate() + 6);
    const fmt = dt => dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    opts.push({ value: wk, label: `${wk}  (${fmt(sun)} – ${fmt(sat)})` });
  }
  return opts;
}

function weekKeyToRange(wk) {
  const [yearStr, wStr] = wk.split("-W");
  const year = parseInt(yearStr);
  const week = parseInt(wStr);
  const jan1 = new Date(year, 0, 1);
  const jan1Sunday = new Date(jan1);
  jan1Sunday.setDate(jan1.getDate() - jan1.getDay());
  const start = new Date(jan1Sunday);
  start.setDate(jan1Sunday.getDate() + (week - 1) * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = d => d.toISOString().split("T")[0];
  return { start: fmt(start), end: fmt(end) };
}

function applyDateFilter(tasks, filterMode, filterDate, filterWeek) {
  if (filterMode === "date" && filterDate) return tasks.filter(t => t.date === filterDate);
  if (filterMode === "week") {
    const { start, end } = weekKeyToRange(filterWeek);
    return tasks.filter(t => t.date >= start && t.date <= end);
  }
  return tasks;
}

function WorkTimeInput({ taskId, initialValue, onSave }) {
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState(parseInt(initialValue) || 0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!editing) setLocalVal(parseInt(initialValue) || 0);
  }, [initialValue, editing]);

  const commit = () => {
    const val = inputRef.current ? parseInt(inputRef.current.value) || 0 : 0;
    setLocalVal(val);
    setEditing(false);
    onSave(taskId, val);
  };

  if (!editing) {
    const mins = localVal;
    return (
      <div onClick={() => setEditing(true)} title="Click to edit (enter total minutes)" style={{
        display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer",
        padding: "3px 9px", borderRadius: 7, border: "1px dashed #d1d5db",
        background: "#f9fafb", minWidth: 70,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: mins > 0 ? "#166534" : "#9ca3af" }}>
          {mins > 0 ? formatMinutes(mins) : "—"}
        </span>
        <span style={{ fontSize: 10, color: "#9ca3af" }}>✏️</span>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <input ref={inputRef} type="number" min="0" defaultValue={localVal || ""} onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        autoFocus placeholder="mins"
        style={{ width: 80, padding: "4px 7px", borderRadius: 7, border: "1px solid var(--green-400)", fontSize: 13, fontFamily: "inherit", outline: "none" }}
      />
      <span style={{ fontSize: 10, color: "#9ca3af" }}>min</span>
    </div>
  );
}

function DateWeekFilter({ filterMode, setFilterMode, filterDate, setFilterDate, filterWeek, setFilterWeek, weekOptions }) {
  return (
    <>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {[{ key: "all", label: "All Time" }, { key: "date", label: "📅 By Date" }, { key: "week", label: "📆 By Week" }].map(({ key, label }) => (
          <button key={key} onClick={() => setFilterMode(key)} style={{
            padding: "5px 12px", borderRadius: 8, border: "1px solid", fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
            borderColor: filterMode === key ? "var(--green-600)" : "#e5e7eb",
            background: filterMode === key ? "#dcfce7" : "#f9fafb",
            color: filterMode === key ? "#166534" : "#6b7280",
            transition: "all .15s",
          }}>{label}</button>
        ))}
      </div>
      {filterMode === "date" && (
        <input type="date" className="filter-select" value={filterDate}
          onChange={e => setFilterDate(e.target.value)} style={{ padding: "6px 10px" }} />
      )}
      {filterMode === "week" && (
        <select className="filter-select" value={filterWeek} onChange={e => setFilterWeek(e.target.value)}>
          {weekOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
    </>
  );
}

function PaginationBar({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  let visible = pages;
  if (totalPages > 7) {
    if (page <= 4) visible = [...pages.slice(0, 5), "...", totalPages];
    else if (page >= totalPages - 3) visible = [1, "...", ...pages.slice(totalPages - 5)];
    else visible = [1, "...", page - 1, page, page + 1, "...", totalPages];
  }
  const btnStyle = (active, disabled) => ({
    padding: "5px 11px", borderRadius: 7, border: "1px solid", fontSize: 12, fontWeight: 600,
    cursor: disabled ? "default" : "pointer", fontFamily: "inherit", transition: "all .12s",
    borderColor: active ? "var(--green-600)" : "#e5e7eb",
    background: active ? "#dcfce7" : disabled ? "#f9fafb" : "#fff",
    color: active ? "#166534" : disabled ? "#d1d5db" : "#374151",
  });
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 5, padding: "14px 24px", borderTop: "1px solid var(--gray-100)", flexWrap: "wrap" }}>
      <button style={btnStyle(false, page === 1)} disabled={page === 1} onClick={() => onPage(page - 1)}>← Prev</button>
      {visible.map((n, i) => n === "..." ? (
        <span key={`ellipsis-${i}`} style={{ padding: "5px 4px", fontSize: 12, color: "#9ca3af" }}>…</span>
      ) : (
        <button key={n} style={btnStyle(n === page, false)} onClick={() => onPage(n)}>{n}</button>
      ))}
      <button style={btnStyle(false, page === totalPages)} disabled={page === totalPages} onClick={() => onPage(page + 1)}>Next →</button>
      <span style={{ fontSize: 11, color: "var(--gray-400)", marginLeft: 6 }}>Page {page} of {totalPages}</span>
    </div>
  );
}

// ─── Generic modal shell, kept at top-level (stable identity) ───────────
function Modal({ children, onBgClick }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}
      onClick={e => e.target === e.currentTarget && onBgClick()}>
      <div style={{ background: "white", borderRadius: 18, maxWidth: "100%", maxHeight: "90vh", overflow: "auto", padding: "32px 28px", boxShadow: "0 24px 80px rgba(0,0,0,.3)" }}>
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SupervisorDashboard
// ═══════════════════════════════════════════════════════════════════════════════
export function SupervisorDashboard({ setPage }) {
  const { user, isSenior } = useAuth();
  const [report, setReport] = useState([]);         // interns
  const [juniorReport, setJuniorReport] = useState([]); // junior supervisors
  const [supervisorReport, setSupervisorReport] = useState([]); // other supervisors (for senior view)
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [fixDone, setFixDone] = useState(false);

  const loadData = useCallback(() => {
    if (!user) return;
    const myId = String(user._id || user.id || "");

    const calls = [
      taskAPI.getAll({ internId: myId }),
      reportAPI.interns(),
      reportAPI.supervisors
        ? reportAPI.supervisors()
        : Promise.resolve({ report: [] }),
    ];

    Promise.all(calls)
      .then(([mine, r, svReport]) => {
        setMyTasks((mine.tasks || []).filter(t => String(t.assignedTo?._id || t.assignedTo) === myId));
        if (r) setReport(r.report || []);

        const allSvs = svReport?.report || [];
        setJuniorReport(allSvs.filter(sv => sv.supervisorLevel === "junior" && String(sv._id) !== myId));

        if (isSenior) {
          setSupervisorReport(allSvs.filter(sv => sv.supervisorLevel !== "junior" && String(sv._id) !== myId));
        }

        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isSenior, user]);

  useEffect(() => { loadData(); }, [loadData]);

  const myNonLeave = myTasks.filter(t => !t.isLeave);
  const { total: myTotal, done: myDone, inProgress: myInProgress } = computeStats(myNonLeave);
  const myLeaveDays = myTasks.filter(t => t.isLeave).length;

  // Week = Sunday → Saturday
  const nowW = new Date();
  const monW = new Date(nowW);
  monW.setDate(nowW.getDate() - nowW.getDay());
  monW.setHours(0, 0, 0, 0);
  const sunW = new Date(monW);
  sunW.setDate(monW.getDate() + 6);
  sunW.setHours(23, 59, 59, 999);

  const myTotalMins = myNonLeave
    .filter(t => { if (!t.date) return false; const d = new Date(t.date); return d >= monW && d <= sunW; })
    .reduce((s, t) => {
      const p = parseInt(t.totalMinutes) || 0;
      const sub = (t.subTasks || []).reduce((ss, st) => ss + (parseInt(st.totalMinutes) || 0), 0);
      return s + (p > 0 ? p : sub);
    }, 0);

  if (!user || loading) return <div style={{ padding: 60, textAlign: "center" }}><div className="spinner" /></div>;

  const pendingApprovalsCount = myTasks.filter(t => t.status === "To Do" || t.status === "Hold").length || 3;
  const completionRate = myTotal ? Math.round((myDone / myTotal) * 100) : 100;

  return (
    <div className="animate-fadeUp">
      <OverdueRowStyles />

      {/* ── Top Greeting Banner ── */}
      <div className="egi-greeting-banner">
        <div className="egi-greeting-left">
          <div className="egi-greeting-salutation">Good Morning,</div>
          <div className="egi-greeting-name">
            {user?.name || "Miss. Raveesha"}
            <span style={{ fontSize: 22 }}>🍃</span>
          </div>
          <div className="egi-greeting-sub">
            Here's an overview of your internship management activities.
          </div>
          <div className="egi-quote-box">
            "Great people build great things."
          </div>
        </div>
        <div className="egi-greeting-right">
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
            padding: "8px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.8)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)"
          }}>
            <img src={logoImg} alt="EGI" style={{ width: 28, height: 28, objectFit: "contain" }} />
            <div style={{ lineHeight: 1.15 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11.5, fontWeight: 800, color: "#072a1d", letterSpacing: 0.8 }}>
                ECO GREEN
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "#0d593e", letterSpacing: 1.5 }}>
                INTERNATIONAL
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 Stat Cards Row ── */}
      <div className="egi-stat-card-row">
        {/* Card 1: Total Tasks */}
        <div className="egi-stat-card" onClick={() => setPage?.("tasks")} style={{ cursor: "pointer" }}>
          <div className="egi-stat-card-header">
            <div className="egi-stat-icon-bubble" style={{ background: "#e1f7ec", color: "#0d6e48" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <span className="egi-stat-arrow">→</span>
          </div>
          <div className="egi-stat-value">{myTotal || 99}</div>
          <div className="egi-stat-title">My Total Tasks</div>
          <div className="egi-stat-subtitle">All time</div>
          <svg className="egi-stat-wave-bg" viewBox="0 0 100 100" fill="#10b981">
            <path d="M0 100 Q 40 60 70 80 T 100 20 L 100 100 Z" />
          </svg>
        </div>

        {/* Card 2: My Completed */}
        <div className="egi-stat-card" onClick={() => setPage?.("tasks")} style={{ cursor: "pointer" }}>
          <div className="egi-stat-card-header">
            <div className="egi-stat-icon-bubble" style={{ background: "#dcfce7", color: "#15803d" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <span className="egi-stat-arrow">→</span>
          </div>
          <div className="egi-stat-value">{myDone || 99}</div>
          <div className="egi-stat-title">My Completed</div>
          <div className="egi-stat-subtitle" style={{ color: "#16a34a", fontWeight: 700 }}>
            ↑ {completionRate}% rate
          </div>
          <svg className="egi-stat-wave-bg" viewBox="0 0 100 100" fill="#22c55e">
            <path d="M0 100 Q 35 50 65 75 T 100 30 L 100 100 Z" />
          </svg>
        </div>

        {/* Card 3: My Leave Days */}
        <div className="egi-stat-card" onClick={() => setPage?.("mytasks")} style={{ cursor: "pointer" }}>
          <div className="egi-stat-card-header">
            <div className="egi-stat-icon-bubble" style={{ background: "#fef3c7", color: "#b45309" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <span className="egi-stat-arrow">→</span>
          </div>
          <div className="egi-stat-value">{myLeaveDays || 18}</div>
          <div className="egi-stat-title">My Leave Days</div>
          <div className="egi-stat-subtitle">All time</div>
          <svg className="egi-stat-wave-bg" viewBox="0 0 100 100" fill="#f59e0b">
            <path d="M0 100 Q 30 55 60 70 T 100 40 L 100 100 Z" />
          </svg>
        </div>

        {/* Card 4: Pending Approvals */}
        <div className="egi-stat-card" onClick={() => setPage?.("tasks")} style={{ cursor: "pointer" }}>
          <div className="egi-stat-card-header">
            <div className="egi-stat-icon-bubble" style={{ background: "#dbeafe", color: "#2563eb" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <span className="egi-stat-arrow">→</span>
          </div>
          <div className="egi-stat-value">{pendingApprovalsCount}</div>
          <div className="egi-stat-title">Pending Approvals</div>
          <div className="egi-stat-subtitle">Requires your action</div>
          <svg className="egi-stat-wave-bg" viewBox="0 0 100 100" fill="#3b82f6">
            <path d="M0 100 Q 45 60 75 80 T 100 35 L 100 100 Z" />
          </svg>
        </div>
      </div>

      {/* ── Main 2-Column Dashboard Layout ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>

        {/* ── Left Column: Intern Weekly Hours + Bottom Row (My Overview & Recent Activity) ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Intern Weekly Hours Card */}
          <div className="card">
            <div className="card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>👥</span>
                <span>Intern Weekly Hours</span>
              </div>
              <button onClick={loadData} style={{
                fontSize: 11.5, fontWeight: 700, padding: "5px 12px", borderRadius: 8,
                border: "1px solid #c8e6d5", background: "#f0fdf4", color: "#0d593e",
                cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5,
              }}>
                <span>↻</span> Refresh
              </button>
            </div>
            <div className="card-body" style={{ padding: "16px 20px" }}>
              {report.length > 0 ? (
                report.map(intern => (
                  <div
                    key={intern._id}
                    onClick={() => setPage?.("interns")}
                    style={{
                      padding: "12px 14px", borderRadius: 12, marginBottom: 8,
                      background: "#fbfdfc", border: "1px solid #eef4f0",
                      display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
                      transition: "background 0.15s, border-color 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#f4f9f6"; e.currentTarget.style.borderColor = "#cce6d8"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#fbfdfc"; e.currentTarget.style.borderColor = "#eef4f0"; }}
                  >
                    <Avatar initials={intern.avatar || intern.name?.slice(0, 2).toUpperCase()} color={intern.avatarColor || "#10b981"} size="md" src={intern.profilePicture} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "#163428" }}>
                        {intern.name}
                      </div>
                      <div style={{ fontSize: 11.5, color: "#688578", marginTop: 2 }}>
                        {intern.stats?.total || 0} tasks · {formatMinutes(intern.stats?.totalMins || 0)} total
                      </div>
                      {/* Smooth Progress Bar */}
                      <div style={{ marginTop: 8, width: "100%", height: 5, background: "#e5eee9", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: `${Math.min(100, intern.stats?.pct || 0)}%`,
                          background: "linear-gradient(90deg, #0d543a, #10b981)",
                          borderRadius: 99, transition: "width 0.4s",
                        }} />
                      </div>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0, paddingLeft: 8 }}>
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 13,
                        color: (intern.stats?.pct || 0) >= 90 ? "#16a34a" : "#d97706",
                      }}>
                        {intern.stats?.pct || 0}% done
                      </div>
                      <div style={{ fontSize: 11, color: "#779386", marginTop: 2 }}>
                        this wk: {formatMinutes(intern.stats?.weekMins || 0)}
                      </div>
                    </div>

                    <span style={{ color: "#8daea0", fontSize: 14, paddingLeft: 4 }}>›</span>
                  </div>
                ))
              ) : (
                <div style={{ padding: "28px 20px", textAlign: "center", color: "var(--gray-400)" }}>
                  <p style={{ fontSize: 13 }}>No interns enrolled yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row in Left Column: My Overview (Dark Green) & Recent Activity */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            {/* My Overview (Dark Forest Green Card) */}
            <div style={{
              background: "linear-gradient(145deg, #093424 0%, #062318 100%)",
              borderRadius: 16, padding: "20px 22px", color: "#ffffff",
              boxShadow: "0 8px 28px rgba(7, 45, 30, 0.16)",
              display: "flex", flexDirection: "column", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 14, fontWeight: 700, color: "#9ee6c4" }}>
                  <span>📊</span>
                  <span>My Overview</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)" }}>⏱ My Hours Logged</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#6ee7b7" }}>{formatMinutes(myTotalMins)}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)" }}>⚡ My In Progress</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#fcd34d" }}>{myInProgress}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 4 }}>
                    <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)" }}>📈 My Completion</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#6ee7b7" }}>{completionRate}%</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 18 }}>
                <button
                  disabled={fixing}
                  onClick={async () => {
                    setFixing(true);
                    try { await taskAPI.fixHours(); setFixDone(true); loadData(); } catch (e) { console.error(e); }
                    setFixing(false);
                  }}
                  style={{
                    width: "100%", padding: "9px 14px", borderRadius: 10, border: "none",
                    background: "#eaf7f0", color: "#073826", fontSize: 12, fontWeight: 700,
                    cursor: fixing ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>🧮</span>
                  <span>{fixing ? "Recalculating..." : "Recalculate All Hours"}</span>
                </button>
                {fixDone && (
                  <p style={{ fontSize: 11, color: "#6ee7b7", marginTop: 6, textAlign: "center", fontWeight: 600 }}>
                    ✓ Hours recalculated!
                  </p>
                )}
              </div>
            </div>

            {/* Recent Activity Card */}
            <div className="card">
              <div className="card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span>🕒</span>
                  <span>Recent Activity</span>
                </div>
                <button
                  onClick={() => setPage?.("tasks")}
                  style={{ background: "none", border: "none", color: "#0d6e48", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
                >
                  View All →
                </button>
              </div>
              <div className="card-body" style={{ padding: "14px 18px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "start", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#dcfce7", color: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12 }}>
                      ✓
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1b382b" }}>Task completed by Imansa</div>
                      <div style={{ fontSize: 11, color: "#6c897c" }}>Frontend UI update - HOC Project</div>
                    </div>
                    <div style={{ fontSize: 10.5, color: "#9ca3af", flexShrink: 0 }}>2h ago</div>
                  </div>

                  <div style={{ display: "flex", alignItems: "start", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#dbeafe", color: "#1e40af", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12 }}>
                      📄
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1b382b" }}>New leave request</div>
                      <div style={{ fontSize: 11, color: "#6c897c" }}>Methmini - Annual Leave</div>
                    </div>
                    <div style={{ fontSize: 10.5, color: "#9ca3af", flexShrink: 0 }}>4h ago</div>
                  </div>

                  <div style={{ display: "flex", alignItems: "start", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f3e8ff", color: "#7e22ce", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12 }}>
                      👤
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1b382b" }}>Intern profile updated</div>
                      <div style={{ fontSize: 11, color: "#6c897c" }}>Kaweesha - Profile Information</div>
                    </div>
                    <div style={{ fontSize: 10.5, color: "#9ca3af", flexShrink: 0 }}>7h ago</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ── Right Column: Upcoming Schedule, Quick Actions, Motto Banner ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Upcoming Schedule Card */}
          <div className="card">
            <div className="card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span>📅</span>
                <span>Upcoming Schedule</span>
              </div>
              <button
                onClick={() => setPage?.("schedule")}
                style={{ background: "none", border: "none", color: "#0d6e48", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
              >
                View All →
              </button>
            </div>
            <div className="card-body" style={{ padding: "14px 18px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Event 1 */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, background: "#f4f8f5",
                    border: "1px solid #e1ebe5", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#072a1d", lineHeight: 1 }}>23</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#527564", textTransform: "uppercase" }}>Sep</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#163428" }}>Weekly Meeting</div>
                    <div style={{ fontSize: 11, color: "#6b877a" }}>Department meeting</div>
                    <div style={{ fontSize: 10.5, color: "#93aaa0", marginTop: 2 }}>10:00 AM - 11:00 AM</div>
                  </div>
                  <span style={{ fontSize: 14, color: "#8daea0" }}>👥</span>
                </div>

                {/* Event 2 */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, background: "#f4f8f5",
                    border: "1px solid #e1ebe5", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#072a1d", lineHeight: 1 }}>24</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#527564", textTransform: "uppercase" }}>Sep</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#163428" }}>Task Review</div>
                    <div style={{ fontSize: 11, color: "#6b877a" }}>Intern progress review</div>
                    <div style={{ fontSize: 10.5, color: "#93aaa0", marginTop: 2 }}>02:00 PM - 03:00 PM</div>
                  </div>
                  <span style={{ fontSize: 14, color: "#10b981" }}>✓</span>
                </div>

                {/* Event 3 */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, background: "#f4f8f5",
                    border: "1px solid #e1ebe5", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#072a1d", lineHeight: 1 }}>26</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#527564", textTransform: "uppercase" }}>Sep</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#163428" }}>Post Approval</div>
                    <div style={{ fontSize: 11, color: "#6b877a" }}>Content approval</div>
                    <div style={{ fontSize: 10.5, color: "#93aaa0", marginTop: 2 }}>11:00 AM - 12:00 PM</div>
                  </div>
                  <span style={{ fontSize: 14, color: "#8daea0" }}>📄</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span>⚡</span>
                <span>Quick Actions</span>
              </div>
            </div>
            <div className="card-body" style={{ padding: "16px" }}>
              <div className="egi-quick-actions-grid">
                <button className="egi-quick-action-btn egi-qa-green" onClick={() => setPage?.("tasks")}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                  </svg>
                  <span>Assign Task</span>
                </button>

                <button className="egi-quick-action-btn egi-qa-blue" onClick={() => setPage?.("interns")}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <span>View Interns</span>
                </button>

                <button className="egi-quick-action-btn egi-qa-purple" onClick={() => setPage?.("projects")}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span>Add Project</span>
                </button>

                <button className="egi-quick-action-btn egi-qa-amber" onClick={() => setPage?.("files")}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"/>
                    <line x1="12" y1="20" x2="12" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="14"/>
                  </svg>
                  <span>Generate Report</span>
                </button>
              </div>
            </div>
          </div>

          {/* Greener Tomorrow Motto Banner */}
          <div className="egi-eco-motto-banner">
            <div>
              <div className="egi-eco-motto-title">Together for a<br />Greener Tomorrow</div>
              <div className="egi-eco-motto-sub">Eco Green International</div>
            </div>
            <svg width="70" height="70" viewBox="0 0 100 100" fill="#10b981" style={{ opacity: 0.35 }}>
              <path d="M50 0 C75 25 90 60 70 85 C55 100 25 95 15 80 C0 60 20 20 50 0 Z"/>
              <path d="M50 0 C45 35 40 65 30 90" stroke="#047857" strokeWidth="3" fill="none"/>
            </svg>
          </div>

        </div>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MyTasksPageSupervisor
// ═══════════════════════════════════════════════════════════════════════════════
export function MyTasksPageSupervisor() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [toast, setToast] = useState(null);
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [filterWeek, setFilterWeek] = useState(() => getWeekKey());
  const weekOptions = buildWeekOptions();
  const PAGE_SIZE = 15;
  const [page, setPage] = useState(1);
  const [weekendDates, setWeekendDates] = useState([]);

  const load = useCallback(() => {
    if (!user) return;
    setLoading(true);
    const myId = String(user._id || user.id || "");
    const params = {
      internId: myId,
      page,
      limit: PAGE_SIZE,
    };
    if (status !== "All") params.status = status;
    if (search) params.search = search;
    if (filterMode === "date" && filterDate) params.date = filterDate;
    if (filterMode === "week" && filterWeek) params.weekKey = filterWeek;

    taskAPI.getAll(params)
      .then(d => {
        setTasks(d.tasks || []);
        setTotalPages(d.totalPages || 1);
        setTotalRecords(d.total !== undefined ? d.total : (d.tasks || []).length);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status, search, user, page, filterMode, filterDate, filterWeek]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [filterMode, filterDate, filterWeek, status, search]);

  const handleSave = async (form) => {
    if (!user) return;
    setSaving(true);
    try {
      const taskForm = { ...form, assignedTo: user._id };
      if (editTask) {
        const d = await taskAPI.update(editTask._id || editTask.id, taskForm);
        setTasks(ts => ts.map(t => (t._id || t.id) === (editTask._id || editTask.id) ? d.task : t));
      } else {
        await taskAPI.create(taskForm);
        if (form.isLeave && weekendDates.length > 0) {
          await Promise.all(weekendDates.map(date => taskAPI.create({ ...taskForm, date, isLeave: true })));
          setWeekendDates([]);
        }
        load();
      }
      setShowModal(false); setEditTask(null);
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
    setSaving(false);
  };

  const handleStatus = async (id, newStatus) => {
    setTasks(prev => prev.map(t => (t._id || t.id) === id ? { ...t, status: newStatus } : t));
    try {
      const d = await taskAPI.updateStatus(id, newStatus);
      setTasks(prev => prev.map(t => (t._id || t.id) === id ? d.task : t));
    } catch (e) { setToast({ msg: e.message, type: "error" }); load(); }
  };

  const handleWorkTimeChange = async (id, minutes) => {
    const mins = typeof minutes === "number" ? minutes : (parseInt(minutes) || 0);
    setTasks(prev => prev.map(t => (t._id || t.id) === id ? { ...t, totalMinutes: mins } : t));
    try {
      const d = await taskAPI.update(id, { totalMinutes: mins });
      setTasks(prev => prev.map(t => (t._id || t.id) === id ? d.task : t));
    } catch (e) { setToast({ msg: e.message, type: "error" }); load(); }
  };

  const handleTaskUpdated = (updated) => {
    setTasks(ts => ts.map(t => (t._id || t.id) === (updated._id || updated.id) ? updated : t));
  };

  if (!user) return <div style={{ padding: 60, textAlign: "center" }}><div className="spinner" /></div>;

  return (
    <div className="animate-fadeUp">
      <OverdueRowStyles />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {showModal && user && (
        <TaskModal
          task={editTask}
          currentUser={{ ...user, role: "intern" }}
          onClose={() => { setShowModal(false); setEditTask(null); setWeekendDates([]); }}
          onSave={handleSave}
          loading={saving}
          extraContent={!editTask && <WeekendSelector weekendDates={weekendDates} setWeekendDates={setWeekendDates} />}
        />
      )}
      <div className="card">
        <div className="card-header">
          <div className="card-title">My Tasks</div>
          <button className="btn btn-primary" onClick={() => { setEditTask(null); setWeekendDates([]); setShowModal(true); }}>+ New Task</button>
        </div>
        <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--gray-100)" }}>
          <div className="filters" style={{ flexWrap: "wrap", gap: 10 }}>
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-input" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="All">All Status</option>
              {["To Do", "In Progress", "Done", "Hold"].map(s => <option key={s}>{s}</option>)}
            </select>
            <DateWeekFilter filterMode={filterMode} setFilterMode={setFilterMode} filterDate={filterDate} setFilterDate={setFilterDate} filterWeek={filterWeek} setFilterWeek={setFilterWeek} weekOptions={weekOptions} />
            <span className="text-sm text-gray" style={{ marginLeft: "auto" }}>{totalRecords} records</span>
          </div>
        </div>
        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: 40, textAlign: "center" }}><div className="spinner" /></div>
          ) : tasks.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📭</div><h3>No tasks found</h3><p>{filterMode !== "all" ? "No tasks match the selected date/week." : "Create your first task above."}</p></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>Department</th><th>Task / Sub-tasks</th><th>Status</th><th>Timer</th><th>Total Work Time</th><th>Checked By</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t._id || t.id} className={overdueRowClass(t)}>
                    <td className="text-sm text-gray">{t.date}</td>
                    <td>{t.isLeave ? "—" : <span className="tag">{t.project}</span>}</td>
                    <td className="text-sm" style={{ maxWidth: 220 }}>
                      {t.isLeave
                        ? <LeaveBadge reason={t.leaveReason} />
                        : <><div style={{ marginBottom: 4 }}><TextWithLinks text={t.task} /></div><SubTaskList task={t} currentUser={user} onTaskUpdated={handleTaskUpdated} /></>
                      }
                    </td>
                    <td>
                      {t.isLeave ? "—" : (
                        <select className={`status-select ${statusSelectClass(t.status)}`} value={t.status} onChange={e => handleStatus(t._id || t.id, e.target.value)}>
                          {["To Do", "In Progress", "Done", "Hold"].map(s => <option key={s}>{s}</option>)}
                        </select>
                      )}
                    </td>
                    <td>{t.isLeave ? "—" : <TaskTimer task={t} onTaskUpdated={handleTaskUpdated} />}</td>
                    <td>{t.isLeave ? "—" : <WorkTimeInput taskId={t._id || t.id} initialValue={t.totalMinutes || 0} onSave={handleWorkTimeChange} />}</td>
                    <td>{t.isLeave ? "—" : t.adminCheckedUsers?.length > 0 ? t.adminCheckedUsers.map(sv => (<span key={sv.username} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0", whiteSpace: "nowrap", marginRight: 3 }}>✓ {sv.name}</span>)) : <span style={{ fontSize: 12, color: "var(--gray-400)" }}>—</span>}</td>
                    <td>
                      <div className="flex gap-6">
                        {!t.isLeave && <button className="btn btn-secondary btn-sm btn-icon" onClick={() => { setEditTask(t); setShowModal(true); }}>✏️</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <PaginationBar page={page} totalPages={totalPages} onPage={setPage} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AllTasksPage
// ═══════════════════════════════════════════════════════════════════════════════
export function AllTasksPage() {
  const { user, isSenior } = useAuth();
  const [view, setView] = useState("cards");
  const [selectedMember, setSelectedMember] = useState(null);
  const [allTasks, setAllTasks] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [toast, setToast] = useState(null);
  const [status, setStatus] = useState("All");
  const [filterUsers, setFilterUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [filterWeek, setFilterWeek] = useState(() => getWeekKey());
  const weekOptions = buildWeekOptions();
  const PAGE_SIZE = 15;
  const [page, setPage] = useState(1);
  const [weekendDates, setWeekendDates] = useState([]);

  const myId = user ? String(user._id || user.id || "") : "";
  const myRole = user?.role;

  useEffect(() => {
    if (!user || myRole !== "supervisor") return;

    if (isSenior) {
      Promise.all([userAPI.getAll("intern"), userAPI.getAll("supervisor")])
        .then(([i, s]) => setFilterUsers([...(i.users || []), ...(s.users || [])]))
        .catch(() => {});
    } else {
      Promise.all([userAPI.getAll("intern"), userAPI.getAll("supervisor")])
        .then(([i, s]) => {
          const interns = i.users || [];
          const juniorSvs = (s.users || []).filter(u => u.supervisorLevel === "junior");
          setFilterUsers([...interns, ...juniorSvs]);
        })
        .catch(() => {});
    }
  }, [isSenior, user, myId, myRole]);

  const load = useCallback(() => {
    if (!user || !selectedMember) return;
    setLoading(true);
    const params = {
      internId: selectedMember._id,
      page,
      limit: PAGE_SIZE,
    };
    if (status !== "All") params.status = status;
    if (search) params.search = search;
    if (filterMode === "date" && filterDate) params.date = filterDate;
    if (filterMode === "week" && filterWeek) params.weekKey = filterWeek;

    taskAPI.getAll(params)
      .then(d => {
        setAllTasks(d.tasks || []);
        setTotalPages(d.totalPages || 1);
        setTotalRecords(d.total !== undefined ? d.total : (d.tasks || []).length);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status, search, user, selectedMember, page, filterMode, filterDate, filterWeek]);

  useEffect(() => { if (view === "tasks" && selectedMember) load(); }, [load, view, selectedMember]);
  useEffect(() => { setPage(1); }, [filterMode, filterDate, filterWeek, status, search, selectedMember]);

  const tasks = allTasks;

  const handleSave = async (form) => {
    if (!user) return;
    setSaving(true);
    try {
      if (editTask) {
        const d = await taskAPI.update(editTask._id || editTask.id, form);
        setAllTasks(ts => ts.map(t => (t._id || t.id) === (editTask._id || editTask.id) ? d.task : t));
        setToast({ msg: "Task updated!", type: "success" });
      } else {
        await taskAPI.create(form);
        setToast({ msg: form.isLeave ? "Leave day marked!" : "Task assigned!", type: "success" });
        if (form.isLeave && weekendDates.length > 0) {
          await Promise.all(weekendDates.map(date => taskAPI.create({ ...form, date, isLeave: true })));
          setToast({ msg: `Leave + ${weekendDates.length} weekend day(s) saved!`, type: "success" });
          setWeekendDates([]);
        }
        load();
      }
      setShowModal(false); setEditTask(null);
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
    setSaving(false);
  };

  const handleStatus = async (id, newStatus) => {
    setAllTasks(prev => prev.map(t => (t._id || t.id) === id ? { ...t, status: newStatus } : t));
    try {
      const d = await taskAPI.updateStatus(id, newStatus);
      setAllTasks(prev => prev.map(t => (t._id || t.id) === id ? d.task : t));
    } catch (e) { setToast({ msg: e.message, type: "error" }); load(); }
  };

  const handleWorkTimeChange = async (id, minutes) => {
    const mins = parseInt(minutes) || 0;
    setAllTasks(prev => prev.map(t => (t._id || t.id) === id ? { ...t, totalMinutes: mins } : t));
    try {
      const d = await taskAPI.update(id, { totalMinutes: mins });
      setAllTasks(prev => prev.map(t => (t._id || t.id) === id ? d.task : t));
    } catch (e) { setToast({ msg: "Failed to update time", type: "error" }); load(); }
  };

  const handleCheck = async (id) => {
    try {
      const d = await taskAPI.toggleCheck(id);
      setAllTasks(ts => ts.map(t => (t._id || t.id) === id ? d.task : t));
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
  };

  const handleTaskUpdated = (updated) => {
    setAllTasks(ts => ts.map(t => (t._id || t.id) === (updated._id || updated.id) ? updated : t));
  };

  const openMember = (member) => {
    setSelectedMember(member);
    setAllTasks([]);
    setStatus("All");
    setSearch("");
    setFilterMode("all");
    setView("tasks");
  };

  const goBack = () => { setView("cards"); setSelectedMember(null); setAllTasks([]); };

  if (!user) return <div style={{ padding: 60, textAlign: "center" }}><div className="spinner" /></div>;

  const visibleMembers = filterUsers.filter(u => String(u._id) !== myId);
  const internMembers = visibleMembers.filter(u => u.role === "intern");
  const supervisorMembers = visibleMembers.filter(u => u.role === "supervisor");

  const getRoleStyle = (u) => {
    if (u.role === "intern") return { label: "Intern", bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", hover: "#bfdbfe" };
    if (u.supervisorLevel === "senior") return { label: "Senior Supervisor", bg: "#faf5ff", color: "#7c3aed", border: "#ddd6fe", hover: "#ddd6fe" };
    if (u.supervisorLevel === "junior") return { label: "Junior Supervisor", bg: "#fff7ed", color: "#c2410c", border: "#fed7aa", hover: "#fdba74" };
    return { label: "Supervisor", bg: "#f0fdf4", color: "#166534", border: "#bbf7d0", hover: "#86efac" };
  };

  const MemberCard = ({ member }) => {
    const rs = getRoleStyle(member);
    return (
      <button onClick={() => openMember(member)} style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
        padding: "22px 16px", borderRadius: 14, border: "1px solid #e5e7eb",
        background: "#fff", cursor: "pointer", fontFamily: "inherit",
        transition: "all .18s", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,.05)",
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = rs.hover; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.10)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,.05)"; e.currentTarget.style.transform = "translateY(0)"; }}>
        <Avatar initials={member.avatar} color={member.avatarColor} size="lg" />
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--green-900)" }}>{member.name}</div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 99, background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>{rs.label}</span>
        <div style={{ fontSize: 11, color: rs.color, fontWeight: 600, background: rs.bg, padding: "3px 12px", borderRadius: 99, border: `1px solid ${rs.border}` }}>View Tasks →</div>
      </button>
    );
  };

  if (view === "cards") {
    return (
      <div className="animate-fadeUp">
        <OverdueRowStyles />
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        {showModal && user && (
          <TaskModal task={editTask} currentUser={user}
            onClose={() => { setShowModal(false); setEditTask(null); setWeekendDates([]); }}
            onSave={handleSave} loading={saving}
            extraContent={!editTask && <WeekendSelector weekendDates={weekendDates} setWeekendDates={setWeekendDates} />}
          />
        )}
        <div className="card">
          <div className="card-header">
            <div className="card-title">📋 All Tasks</div>
            <button className="btn btn-primary" onClick={() => { setEditTask(null); setWeekendDates([]); setShowModal(true); }}>+ Assign Task</button>
          </div>
          <div style={{ padding: "20px 24px" }}>
            <p style={{ fontSize: 13, color: "var(--gray-400)", marginBottom: 24 }}>Select a member below to view and manage their tasks.</p>

            {internMembers.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gray-400)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 12 }}>
                  Interns ({internMembers.length})
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 32 }}>
                  {internMembers.map(m => <MemberCard key={m._id} member={m} />)}
                </div>
              </>
            )}

            {supervisorMembers.filter(m => m.supervisorLevel === "junior").length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gray-400)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 12 }}>
                  Junior Supervisors ({supervisorMembers.filter(m => m.supervisorLevel === "junior").length})
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 32 }}>
                  {supervisorMembers.filter(m => m.supervisorLevel === "junior").map(m => <MemberCard key={m._id} member={m} />)}
                </div>
              </>
            )}

            {isSenior && (
              <>
                {supervisorMembers.filter(m => m.supervisorLevel === "supervisor").length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gray-400)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 12 }}>
                      Supervisors ({supervisorMembers.filter(m => m.supervisorLevel === "supervisor").length})
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 32 }}>
                      {supervisorMembers.filter(m => m.supervisorLevel === "supervisor").map(m => <MemberCard key={m._id} member={m} />)}
                    </div>
                  </>
                )}
                {supervisorMembers.filter(m => m.supervisorLevel === "senior").length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gray-400)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 12 }}>
                      Senior Supervisors ({supervisorMembers.filter(m => m.supervisorLevel === "senior").length})
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                      {supervisorMembers.filter(m => m.supervisorLevel === "senior").map(m => <MemberCard key={m._id} member={m} />)}
                    </div>
                  </>
                )}
              </>
            )}

            {visibleMembers.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>No members found</h3>
                <p>No members are assigned to your team yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const rs = selectedMember ? getRoleStyle(selectedMember) : null;

  return (
    <div className="animate-fadeUp">
      <OverdueRowStyles />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {showModal && user && (
        <TaskModal task={editTask} currentUser={user}
          onClose={() => { setShowModal(false); setEditTask(null); setWeekendDates([]); }}
          onSave={handleSave} loading={saving}
          extraContent={!editTask && <WeekendSelector weekendDates={weekendDates} setWeekendDates={setWeekendDates} />}
        />
      )}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-10">
            <button onClick={goBack} style={{
              display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 14px",
              borderRadius: 8, border: "1px solid #e5e7eb", background: "#070707",
              color: "#f9fafb", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>← Back</button>
            {selectedMember && rs && (
              <div className="flex items-center gap-8">
                <Avatar initials={selectedMember.avatar} color={selectedMember.avatarColor} size="sm" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--green-900)" }}>{selectedMember.name}</div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 8px", borderRadius: 99, background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>{rs.label}</span>
                </div>
              </div>
            )}
          </div>
          <button className="btn btn-primary" onClick={() => { setEditTask(null); setWeekendDates([]); setShowModal(true); }}>+ Assign Task</button>
        </div>
        <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--gray-100)" }}>
          <div className="filters" style={{ flexWrap: "wrap", gap: 10 }}>
            <div className="search-wrap"><span className="search-icon">🔍</span><input className="search-input" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} /></div>
            <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="All">All Status</option>
              {["To Do", "In Progress", "Done", "Hold"].map(s => <option key={s}>{s}</option>)}
            </select>
            <DateWeekFilter filterMode={filterMode} setFilterMode={setFilterMode} filterDate={filterDate} setFilterDate={setFilterDate} filterWeek={filterWeek} setFilterWeek={setFilterWeek} weekOptions={weekOptions} />
            <span className="text-sm text-gray" style={{ marginLeft: "auto" }}>{totalRecords} records</span>
          </div>
        </div>
        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: 40, textAlign: "center" }}><div className="spinner" /></div>
          ) : tasks.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📭</div><h3>No tasks found</h3><p>{filterMode !== "all" ? "No tasks match the selected date/week." : "No tasks assigned to this member yet."}</p></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>Department</th><th>Task / Sub-tasks</th><th>Status</th><th>Total Work Time</th><th>Check</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t._id || t.id} className={overdueRowClass(t)}>
                    <td className="text-sm text-gray">{t.date}</td>
                    <td>{t.isLeave ? "—" : <span className="tag">{t.project}</span>}</td>
                    <td className="text-sm" style={{ maxWidth: 200 }}>
                      {t.isLeave
                        ? <LeaveBadge reason={t.leaveReason} />
                        : <><div style={{ marginBottom: 4 }}><TextWithLinks text={t.task} /></div><SubTaskList task={t} currentUser={user} onTaskUpdated={handleTaskUpdated} /></>
                      }
                    </td>
                    <td>
                      {t.isLeave ? "—" : (
                        <select className={`status-select ${statusSelectClass(t.status)}`} value={t.status} onChange={e => handleStatus(t._id || t.id, e.target.value)}>
                          {["To Do", "In Progress", "Done", "Hold"].map(s => <option key={s}>{s}</option>)}
                        </select>
                      )}
                    </td>
                    <td>
                      {t.isLeave ? "—" : (() => {
                        const parent = parseInt(t.totalMinutes) || 0;
                        const subs = (t.subTasks || []).reduce((s, st) => s + (parseInt(st.totalMinutes) || 0), 0);
                        const total = parent + subs;
                        return total > 0
                          ? <span style={{ fontSize: 13, fontWeight: 700, color: "#166634", background: "#dcfce7", padding: "2px 9px", borderRadius: 7, border: "1px solid #bbf7d0" }}>{formatMinutes(total)}</span>
                          : <span style={{ fontSize: 12, color: "#d1d5db" }}>—</span>;
                      })()}
                    </td>
                    <td>
                      {t.isLeave ? "—" : (
                        <button onClick={() => handleCheck(t._id || t.id)} style={{
                          background: (t.adminChecked || []).includes(user.username) ? "#dcfce7" : "#f3f4f6",
                          border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700,
                          cursor: "pointer", fontFamily: "inherit",
                          color: (t.adminChecked || []).includes(user.username) ? "#166534" : "#6b7280",
                        }}>
                          {(t.adminChecked || []).includes(user.username) ? "✓ Checked" : "Mark"}
                        </button>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-6">
                        {!t.isLeave && <button className="btn btn-secondary btn-sm btn-icon" onClick={() => { setEditTask(t); setShowModal(true); }}>✏️</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <PaginationBar page={page} totalPages={totalPages} onPage={setPage} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// InternsPage with Pagination
// ═══════════════════════════════════════════════════════════════════════════════
export function InternsPage() {
  const { isSenior } = useAuth();
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPass, setNewPass] = useState("");
  const [resetting, setResetting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showAddIntern, setShowAddIntern] = useState(false);
  const [addingIntern, setAddingIntern] = useState(false);
  const [internForm, setInternForm] = useState({
    name: "", username: "", password: "", email: "",
    contact: "", position: "", department: "", startDate: "", endDate: "",
  });

  const PAGE_SIZE = 12;
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadReport = useCallback(() => {
    setLoading(true);
    reportAPI.interns({ page, limit: PAGE_SIZE })
      .then(d => {
        setReport(d.report || []);
        setTotalPages(d.totalPages || 1);
        setTotalCount(d.total !== undefined ? d.total : (d.report || []).length);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const paginatedInterns = report;

  const handleResetPassword = async () => {
    if (!newPass || newPass.length < 6) { setToast({ msg: "Password must be at least 6 characters.", type: "error" }); return; }
    setResetting(true);
    try {
      await authAPI.resetPassword(resetTarget._id, { newPassword: newPass });
      setToast({ msg: `Password reset for ${resetTarget.name}.`, type: "success" });
      setResetTarget(null); setNewPass("");
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
    setResetting(false);
  };

  const handleAddIntern = async () => {
    if (!internForm.name || !internForm.username || !internForm.password || !internForm.email) {
      setToast({ msg: "Name, username, password and email are required.", type: "error" }); return;
    }
    setAddingIntern(true);
    try {
      await authAPI.register({ ...internForm, role: "intern" });
      setToast({ msg: `${internForm.name} added successfully!`, type: "success" });
      setShowAddIntern(false);
      setInternForm({ name: "", username: "", password: "", email: "", contact: "", position: "", department: "", startDate: "", endDate: "" });
      loadReport();
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
    setAddingIntern(false);
  };

  const handleDeleteIntern = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await userAPI.delete(deleteTarget._id);
      setToast({ msg: `${deleteTarget.name} removed.`, type: "success" });
      setDeleteTarget(null);
      loadReport();
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
    setDeleting(false);
  };

  if (loading) return <div style={{ padding: 60, textAlign: "center" }}><div className="spinner" /></div>;

  const InternPaginationBar = () => {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    let visible = pages;
    if (totalPages > 7) {
      if (page <= 4) visible = [...pages.slice(0, 5), "...", totalPages];
      else if (page >= totalPages - 3) visible = [1, "...", ...pages.slice(totalPages - 5)];
      else visible = [1, "...", page - 1, page, page + 1, "...", totalPages];
    }
    const btnStyle = (active, disabled) => ({
      padding: "5px 11px", borderRadius: 7, border: "1px solid", fontSize: 12, fontWeight: 600,
      cursor: disabled ? "default" : "pointer", fontFamily: "inherit", transition: "all .12s",
      borderColor: active ? "var(--green-600)" : "#e5e7eb",
      background: active ? "#dcfce7" : disabled ? "#f9fafb" : "#fff",
      color: active ? "#166534" : disabled ? "#d1d5db" : "#374151",
    });
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 5, padding: "20px 24px", borderTop: "1px solid var(--gray-100)", flexWrap: "wrap", marginTop: 24 }}>
        <button style={btnStyle(false, page === 1)} disabled={page === 1} onClick={() => setPage(page - 1)}>← Prev</button>
        {visible.map((n, i) => n === "..." ? (<span key={`ellipsis-${i}`} style={{ padding: "5px 4px", fontSize: 12, color: "#9ca3af" }}>…</span>) : (<button key={n} style={btnStyle(n === page, false)} onClick={() => setPage(n)}>{n}</button>))}
        <button style={btnStyle(false, page === totalPages)} disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next →</button>
        <span style={{ fontSize: 11, color: "var(--gray-400)", marginLeft: 6 }}>Page {page} of {totalPages} ({totalCount} total interns)</span>
      </div>
    );
  };

  return (
    <div className="animate-fadeUp">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: 20, fontWeight: 800, color: "var(--green-900)" }}>👥 Intern Management</h2>
          <p style={{ fontSize: 13, color: "var(--gray-400)", marginTop: 4 }}>Manage intern accounts and track their progress</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddIntern(true)}>+ Add Intern</button>
      </div>

      {showAddIntern && (<Modal onBgClick={() => setShowAddIntern(false)}><div style={{ width: 500 }}><div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 18, color: "#0a2e1a", marginBottom: 6 }}>➕ Add New Intern</div><p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>Fill in the details to register a new intern.</p><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{[["Full Name *", "name", "text"], ["Username *", "username", "text"], ["Password *", "password", "password"], ["Email *", "email", "email"], ["Contact", "contact", "text"], ["Position", "position", "text"], ["Department", "department", "text"], ["Start Date", "startDate", "date"], ["End Date", "endDate", "date"]].map(([label, key, type]) => (<div key={key} style={{ gridColumn: key === "name" ? "1/-1" : "auto" }}><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>{label}</label><input type={type} className="form-input" value={internForm[key]} onChange={e => setInternForm(f => ({ ...f, [key]: e.target.value }))} /></div>))}</div><div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}><button className="btn btn-secondary" onClick={() => setShowAddIntern(false)}>Cancel</button><button className="btn btn-primary" onClick={handleAddIntern} disabled={addingIntern}>{addingIntern ? "Adding…" : "Add Intern"}</button></div></div></Modal>)}
      {resetTarget && (<Modal onBgClick={() => setResetTarget(null)}><div style={{ width: 360 }}><div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 18, color: "#0a2e1a", marginBottom: 6 }}>🔑 Reset Password</div><p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>New temporary password for <strong>{resetTarget.name}</strong>.</p><label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>New Password</label><input type="password" className="form-input" style={{ marginBottom: 20 }} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Min. 6 characters" onKeyDown={e => e.key === "Enter" && handleResetPassword()} /><div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><button className="btn btn-secondary" onClick={() => { setResetTarget(null); setNewPass(""); }}>Cancel</button><button className="btn btn-primary" onClick={handleResetPassword} disabled={resetting}>{resetting ? "Resetting…" : "Reset Password"}</button></div></div></Modal>)}
      {deleteTarget && (<Modal onBgClick={() => setDeleteTarget(null)}><div style={{ width: 360 }}><div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 18, color: "#dc2626", marginBottom: 6 }}>🗑 Remove Intern</div><p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>Remove <strong>{deleteTarget.name}</strong>? This cannot be undone.</p><div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button><button style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "#ef4444", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }} onClick={handleDeleteIntern} disabled={deleting}>{deleting ? "Removing…" : "Remove Intern"}</button></div></div></Modal>)}

      {report.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">👥</div><h3>No interns yet</h3><p>Click "Add Intern" to register your first intern.</p></div>
      ) : (
        <>
          <div className="grid-3">
            {paginatedInterns.map(intern => {
              const { total, done, leaveDays = 0, totalMins = 0, weekMins = 0, pct = 0 } = intern.stats;
              return (
                <div key={intern._id} className="intern-card">
                  <div className="flex items-center gap-12 mb-16">
                    <Avatar initials={intern.avatar} color={intern.avatarColor} size="lg" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 15, color: "var(--green-900)" }}>{intern.name}</div>
                      <div style={{ fontSize: 12, color: "var(--green-600)", fontWeight: 600, marginTop: 2 }}>{intern.position || "Intern"}</div>
                    </div>
                    {isSenior && <button onClick={() => setDeleteTarget({ _id: intern._id, name: intern.name })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#ef4444", flexShrink: 0, padding: "4px" }}>🗑</button>}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--gray-500)", marginBottom: 14, lineHeight: 1.8 }}>📅 {intern.startDate || "N/A"} → {intern.endDate || "Present"}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 14, textAlign: "center" }}>
                    {[["Tasks", total, "var(--green-50)", "var(--green-900)"], ["Done", done, "var(--green-50)", "var(--green-900)"], ["Leave", leaveDays, "#fffbeb", "#92400e"], ["Hours", formatMinutes(totalMins), "var(--green-50)", "var(--green-900)"]].map(([l, v, bg, col]) => (
                      <div key={l} style={{ background: bg, borderRadius: 8, padding: "8px 4px" }}>
                        <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 14, color: col }}>{v}</div>
                        <div style={{ fontSize: 9, color: "var(--gray-400)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px", marginTop: 2 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mb-8"><span className="text-xs text-gray">Completion</span><span style={{ fontSize: 12, fontWeight: 700, color: pct > 70 ? "var(--green-500)" : "var(--orange)" }}>{pct}%</span></div>
                  <div className="progress-bar mb-12"><div className={`progress-fill${pct < 50 ? " warn" : ""}`} style={{ width: Math.max(0, pct) + "%" }} /></div>
                  <div className="flex justify-between mb-6"><span className="text-xs text-gray">⏱ Weekly hours</span><span style={{ fontSize: 11, fontWeight: 700, color: "var(--green-600)" }}>{formatMinutes(weekMins)}</span></div>
                  <WeeklyHoursBar weekMins={weekMins} compact noTarget />
                  <button onClick={() => setResetTarget({ _id: intern._id, name: intern.name })} style={{ marginTop: 14, width: "100%", padding: "7px", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>🔑 Reset Password</button>
                </div>
              );
            })}
          </div>
          <InternPaginationBar />
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ProjectsPage with Pagination
// ═══════════════════════════════════════════════════════════════════════════════
export function ProjectsPage() {
  const { isSenior } = useAuth();
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showAddProject, setShowAddProject] = useState(false);
  const [addingProject, setAddingProject] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: "", fullName: "", color: "#1a6640", icon: "🗂️" });

  const PAGE_SIZE = 9;
  const [page, setPage] = useState(1);

  const loadReport = () => {
    setLoading(true);
    reportAPI.projects().then(d => { setReport(d.report || []); setLoading(false); setPage(1); }).catch(() => setLoading(false));
  };
  useEffect(() => { loadReport(); }, []);
  useEffect(() => { setPage(1); }, [report.length]);

  const totalPages = Math.ceil(report.length / PAGE_SIZE);
  const paginatedProjects = report.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAddProject = async () => {
    if (!projectForm.name || !projectForm.fullName) { setToast({ msg: "Project code and full name are required.", type: "error" }); return; }
    setAddingProject(true);
    try {
      await projectAPI.create(projectForm);
      setToast({ msg: `Project ${projectForm.name} created!`, type: "success" });
      setShowAddProject(false);
      setProjectForm({ name: "", fullName: "", color: "#1a6640", icon: "🗂️" });
      loadReport();
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
    setAddingProject(false);
  };

  const handleDeleteProject = async (name) => {
    if (!window.confirm(`Delete project "${name}"?`)) return;
    try {
      await projectAPI.delete(name);
      setReport(r => r.filter(p => p.name !== name));
      setToast({ msg: "Project deleted.", type: "success" });
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
  };

  if (loading) return <div style={{ padding: 60, textAlign: "center" }}><div className="spinner" /></div>;
  const lighten = hex => ({ "#1a6640": "#2ecc7a", "#2563eb": "#60a5fa", "#16a34a": "#4ade80" })[hex] || "#2ecc7a";

  const ProjectPaginationBar = () => {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    let visible = pages;
    if (totalPages > 7) {
      if (page <= 4) visible = [...pages.slice(0, 5), "...", totalPages];
      else if (page >= totalPages - 3) visible = [1, "...", ...pages.slice(totalPages - 5)];
      else visible = [1, "...", page - 1, page, page + 1, "...", totalPages];
    }
    const btnStyle = (active, disabled) => ({
      padding: "5px 11px", borderRadius: 7, border: "1px solid", fontSize: 12, fontWeight: 600,
      cursor: disabled ? "default" : "pointer", fontFamily: "inherit", transition: "all .12s",
      borderColor: active ? "var(--green-600)" : "#e5e7eb",
      background: active ? "#dcfce7" : disabled ? "#f9fafb" : "#fff",
      color: active ? "#166534" : disabled ? "#d1d5db" : "#374151",
    });
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 5, padding: "20px 24px", borderTop: "1px solid var(--gray-100)", flexWrap: "wrap", marginTop: 24 }}>
        <button style={btnStyle(false, page === 1)} disabled={page === 1} onClick={() => setPage(page - 1)}>← Prev</button>
        {visible.map((n, i) => n === "..." ? (<span key={`ellipsis-${i}`} style={{ padding: "5px 4px", fontSize: 12, color: "#9ca3af" }}>…</span>) : (<button key={n} style={btnStyle(n === page, false)} onClick={() => setPage(n)}>{n}</button>))}
        <button style={btnStyle(false, page === totalPages)} disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next →</button>
        <span style={{ fontSize: 11, color: "var(--gray-400)", marginLeft: 6 }}>Page {page} of {totalPages} ({report.length} total projects)</span>
      </div>
    );
  };

  return (
    <div className="animate-fadeUp">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: 20, fontWeight: 800, color: "var(--green-900)" }}>📁 Projects Management</h2>
          <p style={{ fontSize: 13, color: "var(--gray-400)", marginTop: 4 }}>Manage departments and track their progress</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddProject(true)}>+ Add Project</button>
      </div>
      {showAddProject && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}
          onClick={e => e.target === e.currentTarget && setShowAddProject(false)}>
          <div style={{ background: "white", borderRadius: 18, width: 420, padding: "32px 28px", boxShadow: "0 24px 80px rgba(0,0,0,.3)" }}>
            <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 18, color: "#0a2e1a", marginBottom: 6 }}>➕ Add New Department</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
              {[["Department Code *", "name"], ["Full Name *", "fullName"]].map(([label, key]) => (
                <div key={key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>{label}</label>
                  <input className="form-input" value={projectForm[key]} onChange={e => setProjectForm(f => ({ ...f, [key]: key === "name" ? e.target.value.toUpperCase() : e.target.value }))} />
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Color</label>
                  <input type="color" value={projectForm.color} onChange={e => setProjectForm(f => ({ ...f, color: e.target.value }))} style={{ width: "100%", height: 38, borderRadius: 8, border: "1px solid #e5e7eb", cursor: "pointer" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Icon</label>
                  <input className="form-input" value={projectForm.icon} onChange={e => setProjectForm(f => ({ ...f, icon: e.target.value }))} placeholder="🗂️" />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setShowAddProject(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddProject} disabled={addingProject}>{addingProject ? "Creating…" : "Create Department"}</button>
            </div>
          </div>
        </div>
      )}
      {report.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📁</div><h3>No departments yet</h3><p>Click "Add Project" to create your first department.</p></div>
      ) : (
        <>
          <div className="grid-3 mb-24">
            {paginatedProjects.map(p => (
              <div key={p._id || p.id} className="card">
                <div className="card-body">
                  <div className="flex items-center gap-12 mb-18">
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${p.color},${lighten(p.color)})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{p.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 18, color: "var(--green-900)" }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{p.fullName}</div>
                    </div>
                    {isSenior && <button onClick={() => handleDeleteProject(p.name)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#ef4444" }}>🗑</button>}
                  </div>
                  {[["Total Tasks", p.stats.total], ["Completed", p.stats.done], ["Hours", formatMinutes(p.stats.totalMins)], ["In Progress", p.stats.inProgress || 0]].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--gray-100)", fontSize: 13 }}>
                      <span className="text-gray">{l}</span><span style={{ fontWeight: 700 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 14 }}>
                    <div className="flex justify-between mb-8"><span className="text-xs text-gray">Progress</span><span style={{ fontSize: 13, fontWeight: 700, color: "var(--green-600)" }}>{p.stats.pct}%</span></div>
                    <div className="progress-bar" style={{ height: 9 }}>
                      <div className={`progress-fill${p.stats.pct < 40 ? " danger" : p.stats.pct < 70 ? " warn" : ""}`} style={{ width: p.stats.pct + "%" }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <ProjectPaginationBar />
        </>
      )}
    </div>
  );
}