// components/profile/DocumentsSection.jsx
// Renders three document upload cards:
//   CV | Police Report | Grama Niladhari Report
//
// Each card shows:
//   - Upload status (Uploaded / Not Uploaded)
//   - Upload date
//   - View button (opens Cloudinary URL in new tab)
//   - Upload / Replace button
//   - Delete button

import { useRef, useState } from "react";
import { userAPI } from "../../utils/api.js";
import { FileTextIcon, ClipboardIcon, FolderIcon } from "../shared/Icons.jsx";

const DOC_META = {
  cv:             { label: "Curriculum Vitae (CV)",         icon: <FileTextIcon size={22} color="#059669" />, accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" },
  policeReport:   { label: "Police Report",                 icon: <FileTextIcon size={22} color="#2563eb" />, accept: ".pdf,.jpg,.jpeg,.png,.webp" },
  gramaNiladhari: { label: "Grama Niladhari Report",        icon: <ClipboardIcon size={22} color="#b45309" />, accept: ".pdf,.jpg,.jpeg,.png,.webp" },
};

function DocCard({ docType, docData, userId, onUpdated, setToast }) {
  const meta      = DOC_META[docType];
  const fileRef   = useRef(null);
  const [busy, setBusy] = useState(false);

  const uploaded   = !!(docData?.url);
  const uploadedAt = docData?.uploadedAt ? new Date(docData.uploadedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null;

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const d = await userAPI.uploadDocument(userId, docType, file);
      onUpdated(d.user);
      setToast({ msg: `${meta.label} uploaded successfully!`, type: "success" });
    } catch (err) {
      setToast({ msg: err.message || "Upload failed", type: "error" });
    }
    setBusy(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Remove the uploaded ${meta.label}?`)) return;
    setBusy(true);
    try {
      const d = await userAPI.deleteDocument(userId, docType);
      onUpdated(d.user);
      setToast({ msg: `${meta.label} removed.`, type: "success" });
    } catch (err) {
      setToast({ msg: err.message || "Delete failed", type: "error" });
    }
    setBusy(false);
  };

  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${uploaded ? "var(--green-200, #a7f3d0)" : "var(--gray-200, #e2e8f0)"}`,
      borderRadius: 12,
      padding: "18px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      transition: "box-shadow 0.2s",
      boxShadow: uploaded ? "0 2px 12px rgba(16,185,129,0.08)" : "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: uploaded ? "rgba(16,185,129,0.1)" : "var(--gray-100, #f1f5f9)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, flexShrink: 0,
        }}>
          {meta.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{meta.label}</div>
          <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
              background: uploaded ? "rgba(16,185,129,0.1)" : "rgba(148,163,184,0.12)",
              color:      uploaded ? "#059669"              : "#94a3b8",
              border:     `1px solid ${uploaded ? "rgba(16,185,129,0.25)" : "rgba(148,163,184,0.2)"}`,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: uploaded ? "#10b981" : "#94a3b8" }} />
              {uploaded ? "Uploaded" : "Not Uploaded"}
            </span>
            {uploadedAt && (
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{uploadedAt}</span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {/* Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept={meta.accept}
          style={{ display: "none" }}
          onChange={handleUpload}
        />

        {uploaded && (
          <a
            href={docData.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "6px 14px", borderRadius: 7,
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.25)",
              color: "#059669", fontSize: 12, fontWeight: 600,
              textDecoration: "none",
            }}
          >
            View
          </a>
        )}

        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "6px 14px", borderRadius: 7,
            background: "var(--green-600, #059669)",
            border: "none", color: "#fff",
            fontSize: 12, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer",
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? "Processing…" : uploaded ? "Replace" : "Upload"}
        </button>

        {uploaded && (
          <button
            onClick={handleDelete}
            disabled={busy}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "6px 14px", borderRadius: 7,
              background: "rgba(220,38,38,0.06)",
              border: "1px solid rgba(220,38,38,0.18)",
              color: "#dc2626", fontSize: 12, fontWeight: 600,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.6 : 1,
            }}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

export default function DocumentsSection({ user, onUpdated, setToast }) {
  const userId = user?._id || user?.id;
  const docs   = user?.documents || {};

  return (
    <div className="card mb-24">
      <div className="card-header">
        <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FolderIcon size={18} color="var(--egi-green)" /> Employee Documents
        </div>
        <div style={{ fontSize: 12, color: "var(--gray-500, #94a3b8)" }}>
          Upload CV, Police Report &amp; Grama Niladhari Report
        </div>
      </div>
      <div className="card-body">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {Object.keys(DOC_META).map(docType => (
            <DocCard
              key={docType}
              docType={docType}
              docData={docs[docType]}
              userId={userId}
              onUpdated={onUpdated}
              setToast={setToast}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
