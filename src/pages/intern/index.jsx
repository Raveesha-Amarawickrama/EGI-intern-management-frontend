import { useState, useEffect, useCallback, useRef } from "react";
import { taskAPI, userAPI } from "../../utils/api";
import { StatusBadge, Avatar, Toast } from "../../components/shared/index.jsx";
import TaskModal from "../../components/shared/TaskModal.jsx";
import SubTaskList from "../../components/shared/SubTaskList.jsx";
import TaskTimer from "../../components/shared/TaskTimer.jsx";
import WeeklyHoursCard from "../../components/shared/WeeklyHoursCard.jsx";
import { computeStats, formatMinutes, statusSelectClass, getWeekKey } from "../../utils/helpers";
import { useAuth } from "../../hooks/useAuth";
import {
  CheckCircleIcon,
  ClipboardIcon,
  ClockIcon,
  TrendingUpIcon,
} from "../../components/shared/Icons.jsx";

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

// ─── FIX 1: Render text with clickable links ──────────────────────────────────
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

function LeaveBadge({ reason }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
      background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a",
    }}>
      🌴 Leave Day{reason ? ` — ${reason}` : ""}
    </span>
  );
}

function WeekendSelector({ weekendDates, setWeekendDates }) {
  const weekends = getUpcomingWeekends(8);
  const toggle = (val) =>
    setWeekendDates(prev =>
      prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]
    );

  return (
    <div style={{
      marginTop: 12, padding: "14px 16px", borderRadius: 10,
      background: "#fffbeb", border: "1px solid #fde68a",
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>
        📅 Mark Weekend Days
      </div>
      <p style={{ fontSize: 11, color: "#b45309", marginBottom: 10 }}>
        Select upcoming Saturdays/Sundays to mark as separate leave entries.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {weekends.map(w => (
          <button
            key={w.value}
            type="button"
            onClick={() => toggle(w.value)}
            style={{
              padding: "4px 11px", borderRadius: 99, fontSize: 11, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit", transition: "all .12s",
              border: "1px solid",
              borderColor: weekendDates.includes(w.value) ? "#f59e0b" : "#fde68a",
              background: weekendDates.includes(w.value)
                ? (w.isSat ? "#fcd34d" : "#fde68a")
                : "#fff",
              color: weekendDates.includes(w.value) ? "#78350f" : "#92400e",
            }}
          >
            {weekendDates.includes(w.value) ? "✓ " : ""}{w.label}
            <span style={{ fontSize: 10, marginLeft: 4, opacity: .7 }}>
              {w.isSat ? "Sat" : "Sun"}
            </span>
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
  if (filterMode === "date" && filterDate) {
    return tasks.filter(t => t.date === filterDate);
  }
  if (filterMode === "week") {
    const { start, end } = weekKeyToRange(filterWeek);
    return tasks.filter(t => t.date >= start && t.date <= end);
  }
  return tasks;
}

// ─── WorkTimeInput ────────────────────────────────────────────────────────────
function WorkTimeInput({ taskId, initialValue, onSave }) {
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState(parseInt(initialValue) || 0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!editing) {
      setLocalVal(parseInt(initialValue) || 0);
    }
  }, [initialValue, editing]);

  const commit = () => {
    const raw = inputRef.current ? inputRef.current.value : "";
    const val = parseInt(raw) || 0;
    setLocalVal(val);
    setEditing(false);
    onSave(taskId, val);
  };

  if (!editing) {
    const mins = localVal;
    return (
      <div
        onClick={() => setEditing(true)}
        title="Click to edit (enter total minutes)"
        style={{
          display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer",
          padding: "3px 9px", borderRadius: 7, border: "1px dashed #d1d5db",
          background: "#f9fafb", minWidth: 70,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: mins > 0 ? "#166534" : "#9ca3af" }}>
          {mins > 0 ? formatMinutes(mins) : "—"}
        </span>
        <span style={{ fontSize: 10, color: "#9ca3af" }}>✏️</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <input
        ref={inputRef}
        type="number"
        min="0"
        defaultValue={localVal || ""}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        autoFocus
        placeholder="mins"
        style={{
          width: 80, padding: "4px 7px", borderRadius: 7,
          border: "1px solid var(--green-400)",
          fontSize: 13, fontFamily: "inherit", outline: "none",
        }}
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
            padding: "5px 12px", borderRadius: 8, border: "1px solid",
            fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
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
    padding: "5px 11px", borderRadius: 7, border: "1px solid",
    fontSize: 12, fontWeight: 600, cursor: disabled ? "default" : "pointer",
    fontFamily: "inherit", transition: "all .12s",
    borderColor: active ? "var(--green-600)" : "#e5e7eb",
    background: active ? "#dcfce7" : disabled ? "#f9fafb" : "#fff",
    color: active ? "#166534" : disabled ? "#d1d5db" : "#374151",
  });
  return (
    <div style={{
      display: "flex", justifyContent: "center", alignItems: "center", gap: 5,
      padding: "14px 24px", borderTop: "1px solid var(--gray-100)", flexWrap: "wrap",
    }}>
      <button style={btnStyle(false, page === 1)} disabled={page === 1}
        onClick={() => onPage(page - 1)}>← Prev</button>
      {visible.map((n, i) =>
        n === "..." ? (
          <span key={`ellipsis-${i}`} style={{ padding: "5px 4px", fontSize: 12, color: "#9ca3af" }}>…</span>
        ) : (
          <button key={n} style={btnStyle(n === page, false)} onClick={() => onPage(n)}>{n}</button>
        )
      )}
      <button style={btnStyle(false, page === totalPages)} disabled={page === totalPages}
        onClick={() => onPage(page + 1)}>Next →</button>
      <span style={{ fontSize: 11, color: "var(--gray-400)", marginLeft: 6 }}>
        Page {page} of {totalPages}
      </span>
    </div>
  );
}

// ─── FIX 2: Confirm Dialog Component ─────────────────────────────────────────
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
          
        </div>
      </div>
    </div>
  );
}

// ─── useConfirm hook ──────────────────────────────────────────────────────────
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

// ─── InternDashboard ──────────────────────────────────────────────────────────
export function InternDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    taskAPI.getAll({ internId: user._id || user.id })
      .then(d => {
        const myId = String(user._id || user.id || "");
        const mine = (d.tasks || []).filter(
          t => String(t.assignedTo?._id || t.assignedTo) === myId
        );
        setTasks(mine);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  const nonLeaveTasks = tasks.filter(t => !t.isLeave);
  const leaveDays = tasks.filter(t => t.isLeave);
  const { total, done, inProgress, hold } = computeStats(nonLeaveTasks);

const getWeekBounds = () => {
    // Week = Sunday → Saturday. Kept the { mon, sun } shape so the rest
    // of the component (d >= mon && d <= sun) needs no other changes.
    const now = new Date();
    const mon = new Date(now); mon.setDate(now.getDate() - now.getDay()); mon.setHours(0, 0, 0, 0);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23, 59, 59, 999);
    return { mon, sun };
  };
  const { mon, sun } = getWeekBounds();
  const thisWeekTasks = nonLeaveTasks.filter(t => {
    if (!t.date) return false;
    const d = new Date(t.date);
    return d >= mon && d <= sun;
  });

  if (loading) return <div style={{ padding: 60, textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }} /></div>;

  return (
    <div className="animate-fadeUp">
      <OverdueRowStyles />

      {/* ── Top Greeting Banner ── */}
      <div className="egi-greeting-banner">
        <div className="egi-greeting-left">
          <div className="egi-greeting-salutation">Good Morning,</div>
          <div className="egi-greeting-name">
            {user?.name || "Intern"}
            <span style={{ fontSize: 22 }}>🍃</span>
          </div>
          <div className="egi-greeting-sub">
            Here's an overview of your internship tasks and progress.
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
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
              <path d="M16 38C12 28 18 16 36 10C36 24 28 36 16 38Z" fill="#0f6240"/>
              <path d="M16 38C9 30 9 22 14 17C20 20 20 28 16 38Z" fill="#16a34a"/>
              <path d="M16 38C18 30 24 21 36 10" stroke="#a7f3d0" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
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

      <div className="alert alert-warning mb-20" style={{ borderRadius: 12 }}>
        ⚡ The internship requires at least <strong>&nbsp;8 hours/day</strong>.
      </div>

      {/* ── 4 Stat Cards ── */}
      <div className="egi-stat-card-row">
        <div className="egi-stat-card">
          <div className="egi-stat-card-header">
            <div className="egi-stat-icon-bubble" style={{ background: "#dcfce7", color: "#15803d" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <span className="egi-stat-arrow">→</span>
          </div>
          <div className="egi-stat-value">{done}</div>
          <div className="egi-stat-title">Completed Tasks</div>
          <div className="egi-stat-subtitle" style={{ color: "#16a34a", fontWeight: 700 }}>↑ Keep it up!</div>
          <svg className="egi-stat-wave-bg" viewBox="0 0 100 100" fill="#22c55e">
            <path d="M0 100 Q 35 50 65 75 T 100 30 L 100 100 Z" />
          </svg>
        </div>

        <div className="egi-stat-card">
          <div className="egi-stat-card-header">
            <div className="egi-stat-icon-bubble" style={{ background: "#dbeafe", color: "#2563eb" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <span className="egi-stat-arrow">→</span>
          </div>
          <div className="egi-stat-value">{inProgress}</div>
          <div className="egi-stat-title">In Progress</div>
          <div className="egi-stat-subtitle">Active tasks</div>
          <svg className="egi-stat-wave-bg" viewBox="0 0 100 100" fill="#3b82f6">
            <path d="M0 100 Q 45 60 75 80 T 100 35 L 100 100 Z" />
          </svg>
        </div>

        <div className="egi-stat-card">
          <div className="egi-stat-card-header">
            <div className="egi-stat-icon-bubble" style={{ background: "#fef3c7", color: "#b45309" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
              </svg>
            </div>
            <span className="egi-stat-arrow">→</span>
          </div>
          <div className="egi-stat-value">{hold}</div>
          <div className="egi-stat-title">On Hold</div>
          <div className="egi-stat-subtitle" style={{ color: "#b45309" }}>Needs action</div>
          <svg className="egi-stat-wave-bg" viewBox="0 0 100 100" fill="#f59e0b">
            <path d="M0 100 Q 30 55 60 70 T 100 40 L 100 100 Z" />
          </svg>
        </div>

        <div className="egi-stat-card">
          <div className="egi-stat-card-header">
            <div className="egi-stat-icon-bubble" style={{ background: "#fee2e2", color: "#dc2626" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <span className="egi-stat-arrow">→</span>
          </div>
          <div className="egi-stat-value">{leaveDays.length}</div>
          <div className="egi-stat-title">Leave Days</div>
          <div className="egi-stat-subtitle">Approved</div>
          <svg className="egi-stat-wave-bg" viewBox="0 0 100 100" fill="#ef4444">
            <path d="M0 100 Q 40 60 70 80 T 100 20 L 100 100 Z" />
          </svg>
        </div>
      </div>

      <div className="grid-2 mb-24">
        <WeeklyHoursCard tasks={thisWeekTasks} noTarget />
      </div>
      {leaveDays.filter(t => { const d = new Date(t.date); return d >= mon && d <= sun; }).length > 0 && (
        <div className="alert alert-info mb-20">
          🌴 You have <strong>{leaveDays.filter(t => { const d = new Date(t.date); return d >= mon && d <= sun; }).length} leave day(s)</strong> this week.
        </div>
      )}
      <div className="card">
        <div className="card-header"><div className="card-title">🕐 Recent Tasks</div></div>
        <div className="table-wrap">
          {tasks.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📭</div><h3>No tasks yet</h3></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th><th>Department</th><th>Task</th><th>Status</th>
                  <th>Sub-tasks</th><th>Work Time</th><th>Checked By</th>
                </tr>
              </thead>
              <tbody>
                {tasks.slice(0, 8).map(t => (
                  <tr key={t._id || t.id} className={overdueRowClass(t)}>
                    <td className="text-sm text-gray">{t.date}</td>
                    <td>{t.isLeave ? "—" : <span className="tag">{t.project}</span>}</td>
                    {/* FIX 1: clickable links */}
                    <td className="text-sm" style={{ maxWidth: 220 }}>
                      {t.isLeave ? <LeaveBadge reason={t.leaveReason} /> : <TextWithLinks text={t.task} />}
                    </td>
                    <td>{t.isLeave ? "—" : <StatusBadge status={t.status} />}</td>
                    <td>
                      {t.isLeave ? "—" : (t.subTasks || []).length > 0
                        ? <span style={{ fontSize: 11, fontWeight: 700, background: "#eff6ff", color: "#1d4ed8", padding: "2px 8px", borderRadius: 99, border: "1px solid #bfdbfe" }}>
                          {(t.subTasks || []).length} sub-tasks
                        </span>
                        : <span style={{ fontSize: 12, color: "#d1d5db" }}>—</span>}
                    </td>
                    <td className="text-sm text-bold">{t.isLeave ? "—" : (parseInt(t.totalMinutes) > 0 ? formatMinutes(t.totalMinutes) : "—")}</td>
                    <td>
                      {t.isLeave ? "—" : t.adminCheckedUsers?.length > 0
                        ? t.adminCheckedUsers.map(sv => (
                          <span key={sv.username} style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                            background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0",
                            whiteSpace: "nowrap", marginRight: 3,
                          }}>✓ {sv.name}</span>
                        ))
                        : <span style={{ fontSize: 12, color: "var(--gray-400)" }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MyTasksPage (Intern) ─────────────────────────────────────────────────────
export function MyTasksPage() {
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

  // FIX 2: use confirm hook
  const { confirm, ConfirmComponent } = useConfirm();

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
      if (editTask) {
        const d = await taskAPI.update(editTask._id || editTask.id, form);
        setTasks(ts => ts.map(t => (t._id || t.id) === (editTask._id || editTask.id) ? d.task : t));
        setToast({ msg: "Task updated!", type: "success" });
      } else {
        await taskAPI.create({ ...form, assignedTo: user._id });
        setToast({ msg: "Task created!", type: "success" });
        if (form.isLeave && weekendDates.length > 0) {
          await Promise.all(
            weekendDates.map(date =>
              taskAPI.create({ ...form, date, assignedTo: user._id, isLeave: true })
            )
          );
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
    setTasks(prev => prev.map(t => (t._id || t.id) === id ? { ...t, status: newStatus } : t));
    try {
      const d = await taskAPI.updateStatus(id, newStatus);
      setTasks(prev => prev.map(t => (t._id || t.id) === id ? d.task : t));
    } catch (e) {
      setToast({ msg: e.message, type: "error" });
      load();
    }
  };

  const handleWorkTimeChange = async (id, minutes) => {
    const mins = typeof minutes === "number" ? minutes : (parseInt(minutes) || 0);
    setTasks(prev => prev.map(t => (t._id || t.id) === id ? { ...t, totalMinutes: mins } : t));
    try {
      const d = await taskAPI.update(id, { totalMinutes: mins });
      setTasks(prev => prev.map(t => (t._id || t.id) === id ? d.task : t));
    } catch (e) {
      setToast({ msg: e.message, type: "error" });
      load();
    }
  };

  const handleTaskUpdated = (updated) => {
    setTasks(ts => ts.map(t => (t._id || t.id) === (updated._id || updated.id) ? updated : t));
  };

  const leaveDays = tasks.filter(t => t.isLeave).length;

  if (!user) return <div style={{ padding: 60, textAlign: "center" }}><div className="spinner" /></div>;

  return (
    <div className="animate-fadeUp">
      <OverdueRowStyles />
      {/* FIX 2: Confirm dialog */}
      {ConfirmComponent}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {showModal && (
        <TaskModal
          task={editTask}
          currentUser={user}
          onClose={() => { setShowModal(false); setEditTask(null); setWeekendDates([]); }}
          onSave={handleSave}
          loading={saving}
          extraContent={!editTask && <WeekendSelector weekendDates={weekendDates} setWeekendDates={setWeekendDates} />}
        />
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <ClipboardIcon size={18} color="var(--egi-green)" /> My Tasks
            {leaveDays > 0 && (
              <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
                {leaveDays} leave day{leaveDays > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <button className="btn btn-primary" onClick={() => { setEditTask(null); setWeekendDates([]); setShowModal(true); }}>+ New Task</button>
        </div>

        <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--gray-100)" }}>
          <div className="filters" style={{ flexWrap: "wrap", gap: 10 }}>
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-input" placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="All">All Status</option>
              {["To Do", "In Progress", "Done", "Hold"].map(s => <option key={s}>{s}</option>)}
            </select>
            <DateWeekFilter filterMode={filterMode} setFilterMode={setFilterMode}
              filterDate={filterDate} setFilterDate={setFilterDate}
              filterWeek={filterWeek} setFilterWeek={setFilterWeek}
              weekOptions={weekOptions} />
            <span className="text-sm text-gray" style={{ marginLeft: "auto" }}>{totalRecords} records</span>
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: 40, textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No tasks found</h3>
              <p>{filterMode !== "all" ? "No tasks match the selected date/week." : "Create your first task above."}</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th><th>Department</th><th>Assigned By</th>
                  <th>Task / Sub-tasks</th><th>Status</th><th>Timer</th>
                  <th>Total Work Time</th><th>Checked By</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t._id || t.id} className={overdueRowClass(t)}>
                    <td className="text-sm text-gray">{t.date}</td>
                    <td>{t.isLeave ? "—" : <span className="tag">{t.project}</span>}</td>
                    <td className="text-sm">{t.assignedBy}</td>
                    {/* FIX 1: clickable links in task description */}
                    <td className="text-sm" style={{ maxWidth: 220 }}>
                      {t.isLeave
                        ? <LeaveBadge reason={t.leaveReason} />
                        : <><div style={{ marginBottom: 4 }}><TextWithLinks text={t.task} /></div><SubTaskList task={t} currentUser={user} onTaskUpdated={handleTaskUpdated} /></>
                      }
                    </td>
                    <td>
                      {t.isLeave ? "—" : (
                        <select className={`status-select ${statusSelectClass(t.status)}`} value={t.status}
                          onChange={e => handleStatus(t._id || t.id, e.target.value)}>
                          {["To Do", "In Progress", "Done", "Hold"].map(s => <option key={s}>{s}</option>)}
                        </select>
                      )}
                    </td>
                    <td>{t.isLeave ? "—" : <TaskTimer task={t} onTaskUpdated={handleTaskUpdated} />}</td>
                    <td>
                      {t.isLeave ? "—" : (
                        <WorkTimeInput taskId={t._id || t.id} initialValue={t.totalMinutes || 0} onSave={handleWorkTimeChange} />
                      )}
                    </td>
                    <td>
                      {t.isLeave ? "—" : t.adminCheckedUsers?.length > 0
                        ? t.adminCheckedUsers.map(sv => (
                          <span key={sv.username} style={{
                            display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px",
                            borderRadius: 99, fontSize: 11, fontWeight: 700, background: "#dcfce7",
                            color: "#166534", border: "1px solid #bbf7d0", whiteSpace: "nowrap", marginRight: 3,
                          }}>✓ {sv.name}</span>
                        ))
                        : <span style={{ fontSize: 12, color: "var(--gray-400)" }}>—</span>}
                    </td>
                    <td>
                      <div className="flex gap-6">
                        {!t.isLeave && (
                          <button className="btn btn-secondary btn-sm btn-icon"
                            onClick={() => { setEditTask(t); setShowModal(true); }}>✏️</button>
                        )}
                     
                      
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

// ─── ProfilePage ──────────────────────────────────────────────────────────────
export function ProfilePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user?._id) return;
    userAPI.getStats(user._id).then(d => setStats(d.stats)).catch(() => {});
  }, [user?._id]);

  if (!user) return <div style={{ padding: 60, textAlign: "center" }}><div className="spinner" /></div>;

  return (
    <div className="animate-fadeUp">
      <div className="card mb-24">
        <div className="card-body">
          <div className="profile-header">
            <Avatar initials={user.avatar} color={user.avatarColor} size="xl" />
            <div>
              <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: 24, fontWeight: 800, color: "var(--green-900)" }}>{user.name}</h2>
              <p style={{ fontSize: 13, color: "var(--green-600)", fontWeight: 600, marginTop: 4 }}>{user.position}</p>
              <p style={{ fontSize: 13, color: "var(--gray-500)", marginTop: 2 }}>{user.department}</p>
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <span className="chip">🌿 Eco Green International</span>
                <span className="chip">👨‍💻 Intern Trainee</span>
              </div>
            </div>
          </div>
          <div className="profile-info-grid">
            {[
              ["Email Address", user.email],
              ["Contact Number", user.contact || "–"],
              ["Start Date", user.startDate || "–"],
              ["End Date", user.endDate || "–"],
              ["Position", user.position || "–"],
              ["Department", user.department || "–"],
            ].map(([l, v]) => (
              <div key={l} className="profile-info-item"><label>{l}</label><p>{v}</p></div>
            ))}
          </div>
        </div>
      </div>
      {stats && (
        <div className="grid-4">
          {[
            [<CheckCircleIcon size={22} color="#166534" />, "Completed", stats.done, "stat-green"],
            [<ClipboardIcon size={22} color="#1d4ed8" />, "Total Tasks", stats.total, "stat-blue"],
            [<ClockIcon size={22} color="#b45309" />, "Hours Logged", formatMinutes(stats.totalMins), "stat-gold"],
            [<TrendingUpIcon size={22} color="#7c3aed" />, "Completion", stats.pct + "%", "stat-purple"],
          ].map(([icon, label, val, cls]) => (
            <div key={label} className={`stat-card ${cls}`}>
              <div className="stat-icon">{icon}</div>
              <div className="stat-value">{val}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}