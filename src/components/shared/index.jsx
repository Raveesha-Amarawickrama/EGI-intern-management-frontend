import { useEffect } from "react";
import { statusBadgeClass, statusDotColor } from "../../utils/helpers";
import { resolveImageUrl } from "../../utils/api";

import logoImg from "../../assets/logo.png";

export function Logo({ size = 44 }) {
  return (
    <div style={{ width:size, height:size, overflow:"hidden", flexShrink:0 }}>
      <img src={logoImg} alt="EGI Logo" style={{ width:"100%", height:"100%", objectFit:"contain" }} />
    </div>
  );
}

const LIGHTEN = {
  "#1a6640":"#2ecc7a","#155030":"#22a05a","#0f3d22":"#1a6640",
  "#d4a843":"#f0c96a","#b8860b":"#d4a843","#22a05a":"#5edda0"
};

// ── Avatar: shows the user's uploaded photo if present, falls back to initials ──
export function Avatar({ initials, color = "#1a6640", size = "md", src }) {
  const sz = { sm:"avatar-sm", md:"avatar-md", lg:"avatar-lg", xl:"avatar-xl" }[size] || "avatar-md";
  const resolvedSrc = resolveImageUrl(src);

  if (resolvedSrc) {
    return (
      <div className={`avatar ${sz}`} style={{ padding: 0, overflow: "hidden", background: "#e5e7eb" }}>
        <img
          src={resolvedSrc}
          alt={initials || "avatar"}
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit", display: "block" }}
          onError={e => {
            // Fall back to initials if the image fails to load
            e.target.style.display = "none";
            const parent = e.target.parentElement;
            if (parent) {
              parent.textContent = initials || "";
              parent.style.background = `linear-gradient(135deg,${color},${LIGHTEN[color] || "#2ecc7a"})`;
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className={`avatar ${sz}`} style={{ background:`linear-gradient(135deg,${color},${LIGHTEN[color]||"#2ecc7a"})` }}>
      {initials}
    </div>
  );
}

export function StatusBadge({ status }) {
  return (
    <span className={`badge ${statusBadgeClass(status)}`}>
      <span className="badge-dot" style={{ background:statusDotColor(status) }}/>
      {status}
    </span>
  );
}

export function Spinner() {
  return (
    <div className="loading-screen">
      <div className="spinner"/>
      <p>Loading…</p>
    </div>
  );
}

export function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  const cls  = { success:"alert-success", error:"alert-error", warning:"alert-warning" }[type] || "alert-info";
  const icon = { success:"✅", error:"❌", warning:"⚠️" }[type] || "ℹ️";
  return (
    <div style={{ position:"fixed", bottom:28, right:28, zIndex:999, minWidth:280, maxWidth:380, animation:"fadeUp .3s ease" }}>
      <div className={`alert ${cls}`} style={{ boxShadow:"0 8px 32px rgba(0,0,0,.18)", borderRadius:12 }}>
        <span>{icon}</span><span>{message}</span>
        <button onClick={onClose} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", fontSize:16, color:"inherit" }}>✕</button>
      </div>
    </div>
  );
}

// ── Re-exports for convenience ────────────────────────────────────────────────
// Reusable form primitives
export { default as Field } from "./forms/Field.jsx";

// Profile feature components (can import from here or directly)
export { default as FamilyDetailsSection } from "../profile/FamilyDetailsSection.jsx";
export { default as DocumentsSection }     from "../profile/DocumentsSection.jsx";