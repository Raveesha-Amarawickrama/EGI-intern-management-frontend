
import { useState, useEffect } from "react";
import { userAPI, projectAPI } from "../../utils/api";
import { todayISO } from "../../utils/helpers";
import { useAuth } from "../../hooks/useAuth";

const STATUSES = ["To Do", "In Progress", "Done", "Hold"];

export default function TaskModal({ task, currentUser = {}, onClose, onSave, loading }) {
  const { user: authUser, isSenior } = useAuth();
  const [interns,     setInterns]     = useState([]);
  const [allSups,     setAllSups]     = useState([]);
  const [projects,    setProjects]    = useState([]);
  const [isLeaveMode, setIsLeaveMode] = useState(task?.isLeave || false);

  const [form, setForm] = useState(
    task
      ? { ...task, assignedTo: task.assignedTo?._id || task.assignedTo || "" }
      : {
          date:         todayISO(),
          project:      "EGI",
          assignedBy:   currentUser?.name ?? "",
          assignedTo:   currentUser?.role === "intern"
                          ? (currentUser?._id || currentUser?.id || "")
                          : "",
          task:         "",
          status:       "To Do",
          
          totalMinutes: "",
         
          reason:       "",
          isLeave:      false,
          leaveReason:  "",
        }
  );

  const isSupervisor = currentUser?.role === "supervisor";

  useEffect(() => {
    if (isSupervisor) {
      userAPI.getAll("intern").then(d => setInterns(d.users || [])).catch(() => {});
      userAPI.getAll("supervisor").then(d => {
        const sups = d.users || [];
        setAllSups(sups);
      }).catch(() => {});
    }
    projectAPI.getAll().then(d => setProjects(d.projects || [])).catch(() => {});
  }, [currentUser?.role, isSenior, isSupervisor]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleLeave = () => {
    const next = !isLeaveMode;
    setIsLeaveMode(next);
    setForm(f => ({
      ...f,
      isLeave:    next,
      status:     next ? "Done" : "To Do",
      task:       next ? "Leave Day" : "",
      assignedTo: next && isSupervisor && !f.assignedTo
        ? (authUser?._id || authUser?.id || "")
        : f.assignedTo,
    }));
  };

  const handleSave = () => {
    const payload = { ...form, isLeave: isLeaveMode };
    if (isLeaveMode) {
      payload.task         = form.leaveReason || "Leave Day";
      payload.totalMinutes = 0;
      payload.status       = "Done";
    }
    onSave(payload);
  };

  const canSubmit = isLeaveMode
    ? (isSupervisor ? !!form.assignedTo : true) && !!form.date
    : !!form.task?.trim() && (isSupervisor ? !!form.assignedTo : true);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-scaleIn">
        <div className="modal-header">
          <div>
            <div className="modal-title">
              {isLeaveMode ? "" : (task ? "✏️" : "➕")}
              {" "}
              {isLeaveMode ? "Mark Leave Day" : (task ? "Edit Task" : "Create New Task")}
            </div>
            <p className="text-sm text-gray" style={{ marginTop: 3 }}>
              {isLeaveMode
                ? "Mark a leave day for yourself or a team member."
                : task ? "Update task details below." : "Fill in the details to assign a new task."}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {!task && (
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              <button
                onClick={() => isLeaveMode && toggleLeave()}
                style={{
                  flex: 1, padding: "9px", borderRadius: 9, border: "none", cursor: "pointer",
                  fontFamily: "inherit", fontSize: 13, fontWeight: 700,
                  background: !isLeaveMode ? "linear-gradient(135deg,#2ecc7a,#22a05a)" : "#f3f4f6",
                  color: !isLeaveMode ? "#fff" : "#6b7280", transition: "all .15s",
                }}
              >
                {isSupervisor ? "📋 Assign Task" : "📋 New Task"}
              </button>
              <button
                onClick={() => !isLeaveMode && toggleLeave()}
                style={{
                  flex: 1, padding: "9px", borderRadius: 9, border: "none", cursor: "pointer",
                  fontFamily: "inherit", fontSize: 13, fontWeight: 700,
                  background: isLeaveMode ? "linear-gradient(135deg,#f59e0b,#d97706)" : "#f3f4f6",
                  color: isLeaveMode ? "#fff" : "#6b7280", transition: "all .15s",
                }}
              >
              Mark Leave
              </button>
            </div>
          )}

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-input" type="date" value={form.date} onChange={e => set("date", e.target.value)} />
            </div>

            {!isLeaveMode && (
              <div className="form-group">
                <label className="form-label">Project</label>
                <select className="form-select" value={form.project} onChange={e => set("project", e.target.value)}>
                  {projects.map(p => (
                    <option key={p._id || p.id} value={p.name}>{p.name} – {p.fullName}</option>
                  ))}
                  {projects.length === 0 && ["EGI", "ERP"].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
            )}

            {isSupervisor && (
              <div className="form-group">
                <label className="form-label">{isLeaveMode ? "Mark Leave For" : "Assign To"}</label>
                <select className="form-select" value={form.assignedTo} onChange={e => set("assignedTo", e.target.value)}>
                  <option value="">Select person…</option>
                  {isLeaveMode && authUser && (
                    <optgroup label="── Myself ──">
                      <option value={authUser._id || authUser.id}>{authUser.name} (Me)</option>
                    </optgroup>
                  )}
                  {interns.length > 0 && (
                    <optgroup label="── Interns ──">
                      {interns.map(i => <option key={i._id || i.id} value={i._id || i.id}>{i.name}</option>)}
                    </optgroup>
                  )}
                  {isLeaveMode && allSups.filter(s => String(s._id || s.id) !== String(authUser?._id || authUser?.id)).length > 0 && (
                    <optgroup label="── Other Supervisors ──">
                      {allSups
                        .filter(s => String(s._id || s.id) !== String(authUser?._id || authUser?.id))
                        .map(s => <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>)}
                    </optgroup>
                  )}

                </select>
              </div>
            )}

            {!isLeaveMode && (
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => set("status", e.target.value)}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            )}

            {isLeaveMode && (
              <div className="form-group full">
                <label className="form-label">
                  Reason for Leave <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  className="form-input"
                  value={form.leaveReason}
                  onChange={e => set("leaveReason", e.target.value)}
                  placeholder="e.g. Medical leave, Personal day…"
                />
              </div>
            )}

            {!isLeaveMode && (
              <>
                <div className="form-group full">
                  <label className="form-label">Task / Work Description</label>
                  <textarea
                    className="form-textarea" rows={3}
                    value={form.task}
                    onChange={e => set("task", e.target.value)}
                    placeholder="Describe the task in detail…"
                  />
                </div>

                

                {form.status === "Hold" && (
                  <div className="form-group full">
                    <label className="form-label">Reason for Not Completing</label>
                    <textarea
                      className="form-textarea" rows={2}
                      value={form.reason}
                      onChange={e => set("reason", e.target.value)}
                      placeholder="Explain why this task is on hold…"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={loading || !canSubmit}
            style={isLeaveMode ? { background: "linear-gradient(135deg,#f59e0b,#d97706)" } : {}}
          >
            {loading ? "Saving…" : isLeaveMode ? "Mark Leave Day" : (task ? "Update Task" : "Create Task")}
          </button>
        </div>
      </div>
    </div>
  );
}