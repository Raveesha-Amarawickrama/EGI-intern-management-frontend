
import { useState } from "react";

const STATUSES = ["To Do", "In Progress", "Done", "Hold"];

export default function SubTaskModal({ subTask, onClose, onSave, loading }) {
  const [form, setForm] = useState(
    subTask
      ? { ...subTask }
      : {
          title:        "",
          status:       "To Do",
          estimateTime: "",
          timeFrom:     "",
          timeTo:       "",
          totalMinutes: "",
          workDoc:      "",
          reason:       "",
        }
  );

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const canSubmit = !!form.title?.trim();

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ zIndex: 300 }}
    >
      <div className="modal animate-scaleIn">
        <div className="modal-header">
          <div>
            <div className="modal-title">
              {subTask ? "✏️ Edit Sub-task" : "➕ Add Sub-task"}
            </div>
            <p className="text-sm text-gray" style={{ marginTop: 3 }}>
              {subTask ? "Update sub-task details below." : "Fill in the details for this sub-task."}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="form-grid">

            <div className="form-group full">
              <label className="form-label">Sub-task Title / Description</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={form.title}
                onChange={e => set("title", e.target.value)}
                placeholder="Describe this sub-task…"
                autoFocus
              />
            </div>

   
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={form.status}
                onChange={e => set("status", e.target.value)}
              >
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

   
            <div className="form-group">
              <label className="form-label">Estimate Time</label>
              <input
                className="form-input"
                value={form.estimateTime}
                onChange={e => set("estimateTime", e.target.value)}
                placeholder="e.g. 2 Hours, 30 min"
              />
            </div>



            <div className="form-group full">
              <label className="form-label">Work Document / Link</label>
              <input
                className="form-input"
                value={form.workDoc}
                onChange={e => set("workDoc", e.target.value)}
                placeholder="https://drive.google.com/…"
              />
            </div>

       
            {form.status === "Hold" && (
              <div className="form-group full">
                <label className="form-label">Reason for Not Completing</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={form.reason}
                  onChange={e => set("reason", e.target.value)}
                  placeholder="Explain why this sub-task is on hold…"
                />
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={() => onSave(form)}
            disabled={loading || !canSubmit}
          >
            {loading ? "Saving…" : subTask ? "Update Sub-task" : "Add Sub-task"}
          </button>
        </div>
      </div>
    </div>
  );
}