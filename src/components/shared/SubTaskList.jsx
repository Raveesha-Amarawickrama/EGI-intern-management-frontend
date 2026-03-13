
import { useState } from "react";
import { taskAPI } from "../../utils/api";
import { formatMinutes, statusSelectClass } from "../../utils/helpers";
import SubTaskModal from "./SubTaskModal.jsx";

export default function SubTaskList({ task, currentUser, onTaskUpdated }) {
  const [expanded,    setExpanded]    = useState(false);
  const [showModal,   setShowModal]   = useState(false);
  const [editSubTask, setEditSubTask] = useState(null);
  const [saving,      setSaving]      = useState(false);

  const subTasks = task.subTasks || [];

  const resolveSubMins = (st) => {
    const stored = parseInt(st.totalMinutes) || 0;
    if (stored > 0) return stored;
    if (st.timeFrom && st.timeTo) {
      const [fh, fm] = st.timeFrom.split(":").map(Number);
      const [th, tm] = st.timeTo.split(":").map(Number);
      return Math.max(0, (th * 60 + tm) - (fh * 60 + fm));
    }
    return 0;
  };

  const totalSubMins = subTasks.reduce((s, st) => s + resolveSubMins(st), 0);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (editSubTask) {
        const d = await taskAPI.updateSubTask(task._id || task.id, editSubTask._id, form);
        onTaskUpdated(d.task);
      } else {
        const d = await taskAPI.createSubTask(task._id || task.id, form);
        onTaskUpdated(d.task);
      }
      setShowModal(false);
      setEditSubTask(null);
    } catch (e) {
      alert(e.message);
    }
    setSaving(false);
  };

  const handleDelete = async (subId) => {
    if (!window.confirm("Delete this sub-task?")) return;
    try {
      await taskAPI.deleteSubTask(task._id || task.id, subId);
      const d = await taskAPI.getOne(task._id || task.id);
      onTaskUpdated(d.task);
    } catch (e) { alert(e.message); }
  };

  const handleStatusChange = async (subId, status) => {
    try {
      const d = await taskAPI.updateSubTask(task._id || task.id, subId, { status });
      onTaskUpdated(d.task);
    } catch (e) { alert(e.message); }
  };

  const doneCount = subTasks.filter(st => st.status === "Done").length;

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
            ? `${doneCount}/${subTasks.length} sub-tasks ${expanded ? "▲" : "▼"}`
            : "+ sub-tasks"}
        </span>
   
        {subTasks.length > 0 && totalSubMins > 0 && !expanded && (
          <span style={{
            fontSize: 11, fontWeight: 700, color: "#0a2e1a",
            background: "#dcfce7", borderRadius: 6, padding: "2px 7px",
          }}>
            ⏱ {formatMinutes(totalSubMins)}
          </span>
        )}
      </div>

      {expanded && (
        <div style={{
          marginTop: 10, background: "#f8fafc", borderRadius: 10,
          border: "1px solid #e2e8f0", overflow: "hidden",
        }}>
  
          <div style={{
            padding: "8px 12px", borderBottom: "1px solid #e2e8f0",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: "#64748b",
                textTransform: "uppercase", letterSpacing: ".5px",
              }}>
                Sub-tasks ({subTasks.length})
              </span>
      
              {totalSubMins > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 700, color: "#166534",
                  background: "#dcfce7", borderRadius: 6, padding: "2px 8px",
                }}>
                  Total: {formatMinutes(totalSubMins)}
                </span>
              )}
            </div>
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
            subTasks.map((st, i) => {
              const mins = resolveSubMins(st);
              return (
                <div
                  key={st._id || i}
                  style={{
                    padding: "10px 12px",
                    borderBottom: i < subTasks.length - 1 ? "1px solid #e2e8f0" : "none",
                    display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap",
                  }}
                >
              
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontSize: 12, color: "#374151", marginBottom: 3 }}>{st.title}</div>
           
                    {(st.timeFrom || st.timeTo) && (
                      <div style={{ fontSize: 10, color: "#9ca3af" }}>
                        {st.timeFrom && st.timeTo
                          ? `${st.timeFrom} → ${st.timeTo}`
                          : st.timeFrom || st.timeTo}
                      </div>
                    )}
                    {st.estimateTime && (
                      <div style={{ fontSize: 10, color: "#9ca3af" }}>
                        Est: {st.estimateTime}
                      </div>
                    )}
                  </div>

            
                  <select
                    value={st.status}
                    onChange={e => handleStatusChange(st._id, e.target.value)}
                    onClick={e => e.stopPropagation()}
                    className={`status-select ${statusSelectClass(st.status)}`}
                    style={{ fontSize: 11, padding: "2px 6px" }}
                  >
                    {["To Do", "In Progress", "Done", "Hold"].map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>

          
                  {mins > 0 && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: "#0a2e1a",
                      background: "#dcfce7", borderRadius: 6, padding: "2px 7px",
                      whiteSpace: "nowrap",
                    }}>
                      ⏱ {formatMinutes(mins)}
                    </span>
                  )}

            
                  {st.workDoc && (
                    <a
                      href={st.workDoc}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ color: "#16a34a", fontSize: 14 }}
                      title="Open document"
                    >🔗</a>
                  )}

                  <button
                    onClick={e => { e.stopPropagation(); setEditSubTask(st); setShowModal(true); }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, padding: "2px 4px", color: "#6b7280" }}
                    title="Edit"
                  >✏️</button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(st._id); }}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", color: "#ef4444", display:"flex", alignItems:"center" }}
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
              );
            })
          )}
        </div>
      )}
    </div>
  );
}