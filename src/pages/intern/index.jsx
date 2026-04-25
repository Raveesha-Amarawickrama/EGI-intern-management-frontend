import { useState, useEffect, useCallback, useRef } from "react";
import { taskAPI, userAPI } from "../../utils/api";
import { StatusBadge, Avatar, Toast } from "../../components/shared/index.jsx";
import TaskModal from "../../components/shared/TaskModal.jsx";
import SubTaskList from "../../components/shared/SubTaskList.jsx";
import TaskTimer from "../../components/shared/TaskTimer.jsx";
import WeeklyHoursCard from "../../components/shared/WeeklyHoursCard.jsx";
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
  const jan1 = new Date(year, 0, 1);
  const jan1Day = jan1.getDay();
  const daysToMon = jan1Day === 0 ? 1 : jan1Day === 1 ? 0 : 8 - jan1Day;
  const firstMon = new Date(year, 0, 1 + daysToMon);
  const mon = new Date(firstMon);
  mon.setDate(firstMon.getDate() + (week - 1) * 7);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = d => d.toISOString().split("T")[0];
  return { start: fmt(mon), end: fmt(sun) };
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
    const now = new Date();
    const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7)); mon.setHours(0, 0, 0, 0);
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
      <div className="alert alert-warning mb-20">
        ⚡ The internship requires at least <strong>&nbsp;8 hours/day</strong>.
      </div>
      <div className="grid-4 mb-24">
        {[
          ["✅", "Done", done, "stat-green", "up", "↑ Keep it up!"],
          ["⚡", "In Progress", inProgress, "stat-blue", "neutral", "Active"],
          ["⏸", "On Hold", hold, "stat-gold", "warn", "Needs action"],
          ["🏖️", "Leave Days", leaveDays.length, "stat-red", "neutral", "Approved"],
        ].map(([icon, label, val, cls, chg, chgTxt]) => (
          <div key={label} className={`stat-card ${cls}`}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-value">{val}</div>
            <div className="stat-label">{label}</div>
            <div className={`stat-change ${chg}`}>{chgTxt}</div>
          </div>
        ))}
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

  // FIX 2: use confirm hook
  const { confirm, ConfirmComponent } = useConfirm();

  const load = useCallback(() => {
    if (!user) return;
    setLoading(true);
    const myId = String(user._id || user.id || "");
    const params = { internId: myId };
    if (status !== "All") params.status = status;
    if (search) params.search = search;

    taskAPI.getAll(params)
      .then(d => {
        const mine = (d.tasks || []).filter(
          t => String(t.assignedTo?._id || t.assignedTo) === myId
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
      if (editTask) {
        const d = await taskAPI.update(editTask._id || editTask.id, form);
        setAllTasks(ts => ts.map(t => (t._id || t.id) === (editTask._id || editTask.id) ? d.task : t));
        setToast({ msg: "Task updated!", type: "success" });
      } else {
        const d = await taskAPI.create({ ...form, assignedTo: user._id });
        setAllTasks(ts => [d.task, ...ts]);
        setToast({ msg: "Task created!", type: "success" });
        if (form.isLeave && weekendDates.length > 0) {
          await Promise.all(
            weekendDates.map(date =>
              taskAPI.create({ ...form, date, assignedTo: user._id, isLeave: true })
            )
          );
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
    } catch (e) {
      setToast({ msg: e.message, type: "error" });
      load();
    }
  };

  const handleWorkTimeChange = async (id, minutes) => {
    const mins = typeof minutes === "number" ? minutes : (parseInt(minutes) || 0);
    setAllTasks(prev => prev.map(t => (t._id || t.id) === id ? { ...t, totalMinutes: mins } : t));
    try {
      const d = await taskAPI.update(id, { totalMinutes: mins });
      setAllTasks(prev => prev.map(t => (t._id || t.id) === id ? d.task : t));
    } catch (e) {
      setToast({ msg: e.message, type: "error" });
      load();
    }
  };

  const handleTaskUpdated = (updated) => {
    setAllTasks(ts => ts.map(t => (t._id || t.id) === (updated._id || updated.id) ? updated : t));
  };

  // FIX 2: delete with custom confirm dialog
  const handleDelete = async (id) => {
    const ok = await confirm("Delete this task? This action cannot be undone.");
    if (!ok) return;
    try {
      await taskAPI.delete(id);
      setAllTasks(ts => ts.filter(t => (t._id || t.id) !== id));
      setToast({ msg: "Task deleted.", type: "success" });
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
  };

  const leaveDays = allTasks.filter(t => t.isLeave).length;

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
          <div className="card-title">
            📋 My Tasks
            {leaveDays > 0 && (
              <span style={{ marginLeft: 10, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
                🌴 {leaveDays} leave day{leaveDays > 1 ? "s" : ""}
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
            <span className="text-sm text-gray" style={{ marginLeft: "auto" }}>{filteredTasks.length} records</span>
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
                        {/* FIX 2: delete now uses custom confirm */}
                        <button className="btn btn-danger btn-sm btn-icon"
                          onClick={() => handleDelete(t._id || t.id)}>🗑</button>
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
            ["✅", "Completed", stats.done, "stat-green"],
            ["📋", "Total Tasks", stats.total, "stat-blue"],
            ["⏱", "Hours Logged", formatMinutes(stats.totalMins), "stat-gold"],
            ["📈", "Completion", stats.pct + "%", "stat-purple"],
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