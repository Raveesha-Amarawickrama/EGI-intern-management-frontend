import { useState, useEffect, useCallback, useRef } from "react";
import { taskAPI, userAPI, reportAPI, projectAPI, authAPI } from "../../utils/api";
import { StatusBadge, Avatar, Toast } from "../../components/shared/index.jsx";
import TaskModal from "../../components/shared/TaskModal.jsx";
import SubTaskList from "../../components/shared/SubTaskList.jsx";
import TaskTimer from "../../components/shared/TaskTimer.jsx";
import { WeeklyHoursBar } from "../../components/shared/WeeklyHoursCard.jsx";
import { computeStats, formatMinutes, statusSelectClass, getWeekKey } from "../../utils/helpers";
import { useAuth } from "../../hooks/useAuth";

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
    const mon = new Date(d);
    mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const fmt = dt => dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    opts.push({ value: wk, label: `${wk}  (${fmt(mon)} – ${fmt(sun)})` });
  }
  return opts;
}

function weekKeyToRange(wk) {
  const [yearStr, wStr] = wk.split("-W");
  const year = parseInt(yearStr);
  const week = parseInt(wStr);
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7;
  const week1Mon = new Date(jan4);
  week1Mon.setDate(jan4.getDate() - (jan4Day - 1));
  const mon = new Date(week1Mon);
  mon.setDate(week1Mon.getDate() + (week - 1) * 7);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = d => d.toISOString().split("T")[0];
  return { start: fmt(mon), end: fmt(sun) };
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
export function SupervisorDashboard() {
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

  const nowW = new Date();
  const monW = new Date(nowW);
  monW.setDate(nowW.getDate() - ((nowW.getDay() + 6) % 7));
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

  const WeeklyHoursRow = ({ person, roleLabel, roleBg, roleColor, roleBorder }) => (
    <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #f1f5f9" }}>
      <div className="flex items-center gap-10 mb-8">
        <Avatar initials={person.avatar} color={person.avatarColor} size="sm" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{person.name}</div>
          <div style={{ fontSize: 11, color: "var(--gray-400)", display: "flex", alignItems: "center", gap: 5 }}>
            {roleLabel && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 99,
                background: roleBg, color: roleColor, border: `1px solid ${roleBorder}`,
              }}>{roleLabel}</span>
            )}
            · {person.stats?.total || 0} tasks · {formatMinutes(person.stats?.totalMins || 0)} total
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 13,
            color: (person.stats?.pct || 0) > 70 ? "var(--green-500)" : "var(--orange)",
          }}>
            {person.stats?.pct || 0}% done
          </div>
          <div style={{ fontSize: 11, color: "var(--gray-400)" }}>
            this wk: {formatMinutes(person.stats?.weekMins || 0)}
          </div>
        </div>
      </div>
      <WeeklyHoursBar weekMins={person.stats?.weekMins || 0} compact noTarget />
    </div>
  );

  return (
    <div className="animate-fadeUp">
      <OverdueRowStyles />
      <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          ["📋", "My Total Tasks", myTotal, "stat-blue", "neutral"],
          ["✅", "My Completed", myDone, "stat-gold", "up"],
          ["🏖️", "My Leave Days", myLeaveDays, "stat-red", "neutral"],
        ].map(([icon, label, val, cls, chg]) => (
          <div key={label} className={`stat-card ${cls}`} style={{ flex: "0 1 260px", minWidth: 200 }}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-value">{val}</div>
            <div className="stat-label">{label}</div>
            <div className={`stat-change ${chg}`}>
              {chg === "up" ? `↑ ${myTotal ? Math.round(myDone / myTotal * 100) : 0}% rate` : "All time"}
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2 mb-24">
        <div className="card">
          <div className="card-header">
            <div className="card-title">👥 Intern Weekly Hours</div>
            <button onClick={loadData} style={{
              fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 7,
              border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#166534",
              cursor: "pointer", fontFamily: "inherit",
            }}>↻ Refresh</button>
          </div>
          <div className="card-body">
            {report.length > 0 ? report.map(intern => (
              <div key={intern._id} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #f1f5f9" }}>
                <div className="flex items-center gap-10 mb-8">
                  <Avatar initials={intern.avatar} color={intern.avatarColor} size="sm" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{intern.name.split(" ")[0]}</div>
                    <div style={{ fontSize: 11, color: "var(--gray-400)" }}>
                      {intern.stats.total} tasks · {formatMinutes(intern.stats.totalMins || 0)} total
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 13,
                      color: intern.stats.pct > 70 ? "var(--green-500)" : "var(--orange)",
                    }}>
                      {intern.stats.pct}% done
                    </div>
                    <div style={{ fontSize: 11, color: "var(--gray-400)" }}>
                      this wk: {formatMinutes(intern.stats.weekMins || 0)}
                    </div>
                  </div>
                </div>
                <WeeklyHoursBar weekMins={intern.stats.weekMins || 0} compact noTarget />
              </div>
            )) : (
              <p style={{ color: "var(--gray-400)", fontSize: 13 }}>No interns yet.</p>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {juniorReport.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">🟠 Junior Supervisor Weekly Hours</div>
              </div>
              <div className="card-body">
                {juniorReport.map(sv => (
                  <WeeklyHoursRow
                    key={sv._id}
                    person={sv}
                    roleLabel="Junior Supervisor"
                    roleBg="#fff7ed"
                    roleColor="#c2410c"
                    roleBorder="#fed7aa"
                  />
                ))}
              </div>
            </div>
          )}

          {isSenior && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">🧑‍💼 Supervisor Weekly Hours</div>
              </div>
              <div className="card-body">
                {supervisorReport.length > 0
                  ? supervisorReport.map(sv => {
                    const isSeniorSv = sv.supervisorLevel === "senior";
                    return (
                      <WeeklyHoursRow
                        key={sv._id}
                        person={sv}
                        roleLabel={isSeniorSv ? "Senior Supervisor" : "Supervisor"}
                        roleBg={isSeniorSv ? "#faf5ff" : "#f0fdf4"}
                        roleColor={isSeniorSv ? "#7c3aed" : "#166534"}
                        roleBorder={isSeniorSv ? "#ddd6fe" : "#bbf7d0"}
                      />
                    );
                  })
                  : <p style={{ color: "var(--gray-400)", fontSize: 13 }}>No other supervisors yet.</p>
                }
              </div>
            </div>
          )}

          {!isSenior && (
            <div>
              <div className="week-summary mb-16">
                <h3>📊 My Overview</h3>
                {[
                  ["My Hours Logged", formatMinutes(myTotalMins), "good"],
                  ["My In Progress", myInProgress, "warn"],
                  ["My Completion", `${myTotal ? Math.round(myDone / myTotal * 100) : 0}%`, "good"],
                ].map(([l, v, c]) => (
                  <div key={l} className="week-stat">
                    <span className="week-stat-label">{l}</span>
                    <span className={`week-stat-val ${c}`}>{v}</span>
                  </div>
                ))}
              </div>
              {!fixDone && (
                <button onClick={async () => {
                  setFixing(true);
                  try { await taskAPI.fixHours(); setFixDone(true); loadData(); } catch (e) { console.error(e); }
                  setFixing(false);
                }} style={{
                  marginTop: 12, width: "100%", padding: "8px", borderRadius: 8,
                  border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#166534",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}>
                  {fixing ? "⏳ Recalculating hours…" : "⚙ Recalculate All Hours"}
                </button>
              )}
              {fixDone && <p style={{ fontSize: 11, color: "#16a34a", marginTop: 8, textAlign: "center" }}>✓ Hours recalculated!</p>}
            </div>
          )}
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
  const [allTasks, setAllTasks] = useState([]);
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
    const params = {};
    if (status !== "All") params.status = status;
    if (search) params.search = search;
    taskAPI.getAll(params)
      .then(d => {
        const mine = (d.tasks || []).filter(
          t => String(t.assignedTo?._id || t.assignedTo) === String(user._id || user.id)
        );
        setAllTasks(mine);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status, search, user]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [filterMode, filterDate, filterWeek, status, search]);

  const filteredTasks = applyDateFilter(allTasks, filterMode, filterDate, filterWeek);
  const totalPages = Math.ceil(filteredTasks.length / PAGE_SIZE);
  const tasks = filteredTasks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSave = async (form) => {
    if (!user) return;
    setSaving(true);
    try {
      const taskForm = { ...form, assignedTo: user._id };
      if (editTask) {
        const d = await taskAPI.update(editTask._id || editTask.id, taskForm);
        setAllTasks(ts => ts.map(t => (t._id || t.id) === (editTask._id || editTask.id) ? d.task : t));
      } else {
        const d = await taskAPI.create(taskForm);
        setAllTasks(ts => [d.task, ...ts]);
        if (form.isLeave && weekendDates.length > 0) {
          await Promise.all(weekendDates.map(date => taskAPI.create({ ...taskForm, date, isLeave: true })));
          setWeekendDates([]);
          load();
        }
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
    const mins = typeof minutes === "number" ? minutes : (parseInt(minutes) || 0);
    setAllTasks(prev => prev.map(t => (t._id || t.id) === id ? { ...t, totalMinutes: mins } : t));
    try {
      const d = await taskAPI.update(id, { totalMinutes: mins });
      setAllTasks(prev => prev.map(t => (t._id || t.id) === id ? d.task : t));
    } catch (e) { setToast({ msg: e.message, type: "error" }); load(); }
  };

  const handleTaskUpdated = (updated) => {
    setAllTasks(ts => ts.map(t => (t._id || t.id) === (updated._id || updated.id) ? updated : t));
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
            <span className="text-sm text-gray" style={{ marginLeft: "auto" }}>{filteredTasks.length} records</span>
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
    const params = { internId: selectedMember._id };
    if (status !== "All") params.status = status;
    if (search) params.search = search;
    taskAPI.getAll(params)
      .then(d => {
        const all = d.tasks || [];
        const visible = all.filter(t => {
          const assigneeId = String(t.assignedTo?._id || t.assignedTo || "");
          return assigneeId !== myId;
        });
        setAllTasks(visible);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status, search, user, selectedMember, myId]);

  useEffect(() => { if (view === "tasks" && selectedMember) load(); }, [load, view, selectedMember]);
  useEffect(() => { setPage(1); }, [filterMode, filterDate, filterWeek, status, search, selectedMember]);

  const filteredTasks = applyDateFilter(allTasks, filterMode, filterDate, filterWeek);
  const totalPages = Math.ceil(filteredTasks.length / PAGE_SIZE);
  const tasks = filteredTasks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSave = async (form) => {
    if (!user) return;
    setSaving(true);
    try {
      if (editTask) {
        const d = await taskAPI.update(editTask._id || editTask.id, form);
        setAllTasks(ts => ts.map(t => (t._id || t.id) === (editTask._id || editTask.id) ? d.task : t));
        setToast({ msg: "Task updated!", type: "success" });
      } else {
        const d = await taskAPI.create(form);
        const assigneeId = String(d.task.assignedTo?._id || d.task.assignedTo);
        if (assigneeId !== myId) setAllTasks(ts => [d.task, ...ts]);
        setToast({ msg: form.isLeave ? "Leave day marked!" : "Task assigned!", type: "success" });
        if (form.isLeave && weekendDates.length > 0) {
          await Promise.all(weekendDates.map(date => taskAPI.create({ ...form, date, isLeave: true })));
          setToast({ msg: `Leave + ${weekendDates.length} weekend day(s) saved!`, type: "success" });
          setWeekendDates([]);
          load();
        }
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
            <span className="text-sm text-gray" style={{ marginLeft: "auto" }}>{filteredTasks.length} records</span>
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

  const loadReport = () => {
    setLoading(true);
    reportAPI.interns().then(d => { setReport(d.report || []); setLoading(false); setPage(1); }).catch(() => setLoading(false));
  };
  useEffect(() => { loadReport(); }, []);
  useEffect(() => { setPage(1); }, [report.length]);

  const totalPages = Math.ceil(report.length / PAGE_SIZE);
  const paginatedInterns = report.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
      setReport(r => r.filter(i => i._id !== deleteTarget._id));
      setToast({ msg: `${deleteTarget.name} removed.`, type: "success" });
      setDeleteTarget(null);
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
        <span style={{ fontSize: 11, color: "var(--gray-400)", marginLeft: 6 }}>Page {page} of {totalPages} ({report.length} total interns)</span>
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