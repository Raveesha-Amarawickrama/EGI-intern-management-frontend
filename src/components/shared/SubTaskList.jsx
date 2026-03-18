import { useState, useEffect, useRef } from "react";
import { taskAPI } from "../../utils/api";
import SubTaskModal from "./SubTaskModal.jsx";
import { formatMinutes } from "../../utils/helpers";

// ── Per-subtask inline timer ──────────────────────────────────────────────────
function SubTimer({ task, subTaskId, onTaskUpdated }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [saving,  setSaving]  = useState(false);
  const startRef = useRef(null);
  const tickRef  = useRef(null);

  useEffect(() => () => clearInterval(tickRef.current), []);

  const start = (e) => {
    e.stopPropagation();
    startRef.current = Date.now();
    setElapsed(0);
    setRunning(true);
    tickRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
  };

  const stop = async (e) => {
    e.stopPropagation();
    clearInterval(tickRef.current);
    setRunning(false);

    const elapsedMins = Math.max(1, Math.round(elapsed / 60));

  
    const newTotal = (parseInt(task.totalMinutes) || 0) + elapsedMins;

    setSaving(true);
    try {
      const d = await taskAPI.update(task._id || task.id, { totalMinutes: newTotal });
      onTaskUpdated({
        ...d.task,
        totalMinutes: d.task.totalMinutes > 0 ? d.task.totalMinutes : newTotal,
      });
    } catch (err) { console.error("SubTimer save failed:", err); }
    setSaving(false);
    setElapsed(0);
  };

  const hh = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  if (saving) return <span style={{ fontSize: 10, color: "#9ca3af" }}>saving…</span>;

  if (running) {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
        <span style={{
          fontFamily: "monospace", fontSize: 11, fontWeight: 700,
          color: "#dc2626", background: "#fef2f2",
          padding: "1px 6px", borderRadius: 5, border: "1px solid #fecaca",
        }}>
          {hh}:{mm}:{ss}
        </span>
        <button onClick={stop} style={{
          padding: "2px 7px", borderRadius: 6, border: "1px solid #fca5a5",
          background: "#ef4444", color: "white", fontSize: 10, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
        }}>⏹</button>
      </div>
    );
  }

  return (
    <button onClick={start} style={{
      padding: "2px 8px", borderRadius: 6, border: "1px solid #bbf7d0",
      background: "#f0fdf4", color: "#166534", fontSize: 10, fontWeight: 700,
      cursor: "pointer", fontFamily: "inherit",
    }}>▶</button>
  );
}

// ── SubTaskList ───────────────────────────────────────────────────────────────
export default function SubTaskList({ task, currentUser, onTaskUpdated }) {
  const [expanded,    setExpanded]    = useState(false);
  const [showModal,   setShowModal]   = useState(false);
  const [editSubTask, setEditSubTask] = useState(null);
  const [saving,      setSaving]      = useState(false);

  const subTasks = task.subTasks || [];

  const handleSave = async (form) => {
    setSaving(true);
    try {
      let returnedTask;
      if (editSubTask) {
        const d = await taskAPI.updateSubTask(task._id || task.id, editSubTask._id, form);
        returnedTask = d.task;
      } else {
        const d = await taskAPI.createSubTask(task._id || task.id, form);
        returnedTask = d.task;
      }
     
      onTaskUpdated({
        ...returnedTask,
        totalMinutes: returnedTask.totalMinutes > 0
          ? returnedTask.totalMinutes
          : (task.totalMinutes || 0),
      });
      setShowModal(false);
      setEditSubTask(null);
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleDelete = async (subId) => {
    if (!window.confirm("Delete this sub-task?")) return;
    try {
      const d = await taskAPI.deleteSubTask(task._id || task.id, subId);
      onTaskUpdated({
        ...d.task,
        totalMinutes: d.task.totalMinutes > 0
          ? d.task.totalMinutes
          : (task.totalMinutes || 0),
      });
    } catch (e) { alert(e.message); }
  };

  return (
    <div>
      {showModal && (
        <SubTaskModal
          subTask={editSubTask}
          onClose={() => { setShowModal(false); setEditSubTask(null); }}
          onSave={handleSave}
          loading={saving}
        />
      )}

      {/* Toggle badge */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", userSelect: "none" }}
      >
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
          background: subTasks.length > 0 ? "#eff6ff" : "#f3f4f6",
          color:      subTasks.length > 0 ? "#1d4ed8" : "#9ca3af",
          border:     `1px solid ${subTasks.length > 0 ? "#bfdbfe" : "#e5e7eb"}`,
        }}>
          {subTasks.length > 0
            ? `${subTasks.length} sub-task${subTasks.length > 1 ? "s" : ""} ${expanded ? "▲" : "▼"}`
            : "+ sub-tasks"}
        </span>
      </div>

      {expanded && (
        <div style={{
          marginTop: 10, background: "#f8fafc", borderRadius: 10,
          border: "1px solid #e2e8f0", overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            padding: "8px 12px", borderBottom: "1px solid #e2e8f0",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".5px" }}>
              Sub-tasks ({subTasks.length})
            </span>
            <button
              onClick={e => { e.stopPropagation(); setEditSubTask(null); setShowModal(true); }}
              style={{
                fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                border: "1px solid #2ecc7a", background: "#f0fdf4", color: "#166534",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              + Add
            </button>
          </div>

          {subTasks.length === 0 ? (
            <div style={{ padding: "14px 12px", textAlign: "center", color: "#9ca3af", fontSize: 12 }}>
              No sub-tasks yet. Click "+ Add" to create one.
            </div>
          ) : (
            subTasks.map((st, i) => (
              <div
                key={st._id || i}
                style={{
                  padding: "10px 12px",
                  borderBottom: i < subTasks.length - 1 ? "1px solid #e2e8f0" : "none",
                  display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                }}
              >
                {/* Title */}
                <div style={{ flex: 1, minWidth: 100 }}>
                  <div style={{ fontSize: 12, color: "#374151" }}>{st.title}</div>
                </div>

                {/* Sub-task timer — adds to parent totalMinutes */}
                <SubTimer
                  task={task}
                  subTaskId={st._id}
                  onTaskUpdated={onTaskUpdated}
                />

                {/* Edit */}
                <button
                  onClick={e => { e.stopPropagation(); setEditSubTask(st); setShowModal(true); }}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, padding: "2px 4px", color: "#6b7280" }}
                  title="Edit"
                >✏️</button>

                {/* Delete */}
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(st._id); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", color: "#ef4444", display: "flex", alignItems: "center" }}
                  title="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}