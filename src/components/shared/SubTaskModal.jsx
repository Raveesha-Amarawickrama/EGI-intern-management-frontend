import { useState, useEffect } from "react";

export default function SubTaskModal({ subTask, onClose, onSave, loading }) {
  const [title, setTitle] = useState(subTask?.title || "");

  useEffect(() => {
    setTitle(subTask?.title || "");
  }, [subTask]);

  const canSubmit = !!title.trim();

  const handleSave = () => {
    onSave({ title: title.trim() });
  };

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
              {subTask ? "Update sub-task title." : "Add a title for this sub-task."}
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
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Describe this sub-task…"
                autoFocus
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={loading || !canSubmit}
          >
            {loading ? "Saving…" : subTask ? "Update Sub-task" : "Add Sub-task"}
          </button>
        </div>
      </div>
    </div>
  );
}