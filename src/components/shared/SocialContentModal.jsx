// components/shared/SocialContentModal.jsx
import { useState } from "react";

const PLATFORMS = ["Instagram", "Facebook", "Twitter", "LinkedIn", "TikTok", "YouTube", "Other"];

export default function SocialContentModal({ users, onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: "",
    platform: "",
    plannedPostDate: "",
    assignedTo: "",
    contentDescription: "",
    postUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.platform) e.platform = "Platform is required";
    if (!form.plannedPostDate) e.plannedPostDate = "Planned date is required";
    if (!form.assignedTo) e.assignedTo = "Please assign to a team member";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      await onSubmit(form);
    } finally {
      setLoading(false);
    }
  };

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
  };

  return (
    <div style={overlay}>
      <div style={box}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0F172A" }}>
            📝 Assign New Content
          </h2>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Content Title *" error={errors.title}>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Product launch announcement"
              style={inputStyle(!!errors.title)}
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Platform *" error={errors.platform}>
              <select value={form.platform} onChange={(e) => set("platform", e.target.value)} style={inputStyle(!!errors.platform)}>
                <option value="">Select platform</option>
                {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>

            <Field label="Planned Post Date *" error={errors.plannedPostDate}>
              <input
                type="date"
                value={form.plannedPostDate}
                onChange={(e) => set("plannedPostDate", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                style={inputStyle(!!errors.plannedPostDate)}
              />
            </Field>
          </div>

          <Field label="Assign To *" error={errors.assignedTo}>
            <select value={form.assignedTo} onChange={(e) => set("assignedTo", e.target.value)} style={inputStyle(!!errors.assignedTo)}>
              <option value="">Select team member</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </Field>

          <Field label="Description">
            <textarea
              value={form.contentDescription}
              onChange={(e) => set("contentDescription", e.target.value)}
              placeholder="Content brief, guidelines, or notes..."
              rows={3}
              style={{ ...inputStyle(false), resize: "vertical" }}
            />
          </Field>

          <Field label="Post URL (optional)">
            <input
              type="url"
              value={form.postUrl}
              onChange={(e) => set("postUrl", e.target.value)}
              placeholder="https://..."
              style={inputStyle(false)}
            />
          </Field>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
          <button onClick={onClose} style={cancelBtn}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={submitBtnStyle}>
            {loading ? "Assigning..." : "Assign Content"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {error && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#DC2626" }}>{error}</p>}
    </div>
  );
}

const overlay = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
};
const box = {
  background: "#fff", borderRadius: 20, padding: "28px 32px",
  width: "100%", maxWidth: 540, boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
  maxHeight: "90vh", overflowY: "auto",
};
const closeBtn = {
  background: "#F1F5F9", border: "none", borderRadius: "50%",
  width: 32, height: 32, cursor: "pointer", fontSize: 14, color: "#64748B",
};
const inputStyle = (hasError) => ({
  width: "100%", padding: "10px 14px", borderRadius: 9,
  border: `1.5px solid ${hasError ? "#DC2626" : "#E2E8F0"}`,
  fontSize: 14, color: "#0F172A", boxSizing: "border-box", background: "#fff",
});
const cancelBtn = {
  padding: "10px 20px", borderRadius: 9, border: "1.5px solid #E2E8F0",
  background: "#fff", color: "#64748B", fontWeight: 600, fontSize: 14, cursor: "pointer",
};
const submitBtnStyle = {
  padding: "10px 24px", borderRadius: 9, border: "none",
  background: "#2563EB", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer",
};