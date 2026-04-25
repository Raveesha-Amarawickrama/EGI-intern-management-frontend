// src/pages/shared/SocialPage.jsx
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Toast } from "../../components/shared/index.jsx";

const BASE             = "/api/social";
const SOCIAL_PROJ_BASE = "/api/social-projects";
const tok = () => localStorage.getItem("egi_token");

const http = {
  get:   (url)       => fetch(url, { headers: { Authorization: `Bearer ${tok()}` } }).then(r => r.json()),
  post:  (url, body) => fetch(url, { method: "POST",   headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok()}` }, body: JSON.stringify(body) }).then(r => r.json()),
  put:   (url, body) => fetch(url, { method: "PUT",    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok()}` }, body: JSON.stringify(body) }).then(r => r.json()),
  patch: (url, body) => fetch(url, { method: "PATCH",  headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok()}` }, body: JSON.stringify(body) }).then(r => r.json()),
  del:   (url)       => fetch(url, { method: "DELETE", headers: { Authorization: `Bearer ${tok()}` } }).then(r => r.json()),
};

const PLATFORMS = ["Instagram", "Facebook", "Twitter", "LinkedIn", "TikTok", "YouTube", "Other"];
const STATUSES  = ["Planned", "Posted", "Missed", "Reviewed"];

const STATUS_STYLE = {
  "Planned":        { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  "Posted":         { bg: "#dcfce7", color: "#166534", border: "#bbf7d0" },
  "Missed":         { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  "Reviewed": { bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
};

const PLATFORM_EMOJI = {
  Instagram: "📸", Facebook: "👥", Twitter: "🐦", LinkedIn: "💼",
  TikTok: "🎵", YouTube: "▶️", Other: "🌐",
};

const sevenDaysPassed = (actualPostDate) => {
  if (!actualPostDate) return false;
  return new Date(actualPostDate) <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
};

const startOfWeek = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
};
const endOfWeek = () => {
  const d = startOfWeek();
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
};
const isThisWeek = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= startOfWeek() && d <= endOfWeek();
};

function SBadge({ status }) {
  const s = STATUS_STYLE[status] || { bg: "#f3f4f6", color: "#374151", border: "#e5e7eb" };
  return (
    <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

function StatusDropdown({ value, onChange }) {
  const s = STATUS_STYLE[value] || { bg: "#f3f4f6", color: "#374151", border: "#e5e7eb" };
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ padding: "4px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700,
        border: `1.5px solid ${s.border}`, background: s.bg, color: s.color,
        cursor: "pointer", outline: "none" }}>
      {STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
    </select>
  );
}

function Overlay({ onBgClick, children, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}
      onClick={e => e.target === e.currentTarget && onBgClick()}>
      <div style={{ background: "white", borderRadius: 18, width: wide ? 680 : 540,
        maxHeight: "90vh", overflow: "auto", padding: "32px 28px",
        boxShadow: "0 24px 80px rgba(0,0,0,.3)" }}>
        {children}
      </div>
    </div>
  );
}

function ModalTitle({ children }) {
  return (
    <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 18,
      color: "#0a2e1a", marginBottom: 20 }}>
      {children}
    </div>
  );
}

function F({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function WeeklySummary({ contents }) {
  const weekContents  = contents.filter(c => isThisWeek(c.plannedPostDate));
  const planned       = weekContents.filter(c => c.status === "Planned").length;
  const posted        = weekContents.filter(c => c.status === "Posted").length;
  const missed        = weekContents.filter(c => c.status === "Missed").length;
    const Review = weekContents.filter(c => c.status === "Reviewed").length;
  const total         = weekContents.length;

  const weekLabel = (() => {
    const s = startOfWeek();
    const e = endOfWeek();
    const fmt = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    return `${fmt(s)} – ${e.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
  })();

  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0",
      padding: "20px 24px", marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 15, color: "#0a2e1a" }}>
            📅 This Week's Summary
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{weekLabel}</div>
        </div>
        <div style={{ fontSize: 12, color: "#6b7280", background: "#f9fafb",
          border: "1px solid #e5e7eb", borderRadius: 8, padding: "4px 12px", fontWeight: 600 }}>
          {total} task{total !== 1 ? "s" : ""} this week
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "Planned",        value: planned,       bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", icon: "📋" },
          { label: "Posted",         value: posted,        bg: "#dcfce7", color: "#166534", border: "#bbf7d0", icon: "✅" },
          { label: "Reviewed", value: Review, bg: "#fef3c7", color: "#92400e", border: "#fde68a", icon: "⏳" },
          { label: "Missed",         value: missed,        bg: "#fef2f2", color: "#dc2626", border: "#fecaca", icon: "❌" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.color, fontWeight: 600, marginTop: 2, opacity: 0.85 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
      {total === 0 && (
        <div style={{ textAlign: "center", paddingTop: 12, fontSize: 13, color: "#9ca3af" }}>
          No content scheduled for this week.
        </div>
      )}
    </div>
  );
}

function SocialProjectsManagerModal({ onClose, onProjectsChanged }) {
  const { user } = useAuth();
  const [projects,  setProjects]  = useState([]);
  const [allUsers,  setAllUsers]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form,      setForm]      = useState(defaultForm());
  const [saving,    setSaving]    = useState(false);

  function defaultForm() {
    return { name: "", description: "", assignedPersons: [],
      platformUrls: PLATFORMS.map(p => ({ platform: p, url: "" })) };
  }

  useEffect(() => {
    Promise.all([http.get(SOCIAL_PROJ_BASE), http.get(`${SOCIAL_PROJ_BASE}/members`)])
      .then(([pRes, uRes]) => {
        if (pRes.success) setProjects(pRes.data || []);
        setAllUsers((uRes.data || []).filter(u => String(u._id) !== String(user._id)));
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  const fetchProjects = async () => {
    const res = await http.get(SOCIAL_PROJ_BASE);
    if (res.success) setProjects(res.data || []);
  };

  const openEdit = (p) => {
    setForm({
      name: p.name, description: p.description || "",
      assignedPersons: p.assignedPersons.map(u => u._id || u),
      platformUrls: PLATFORMS.map(pl => {
        const found = p.platformUrls?.find(x => x.platform === pl);
        return { platform: pl, url: found?.url || "" };
      }),
    });
    setEditingId(p._id); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim())               { alert("Project name is required.");   return; }
    if (form.assignedPersons.length < 1) { alert("Assign at least one person."); return; }
    setSaving(true);
    const payload = { ...form, platformUrls: form.platformUrls.filter(x => x.url.trim()) };
    const res = editingId
      ? await http.put(`${SOCIAL_PROJ_BASE}/${editingId}`, payload)
      : await http.post(SOCIAL_PROJ_BASE, payload);
    if (res.success) { await fetchProjects(); onProjectsChanged?.(); setShowForm(false); }
    else alert(res.message || "Error saving.");
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this social project?")) return;
    await http.del(`${SOCIAL_PROJ_BASE}/${id}`);
    fetchProjects(); onProjectsChanged?.();
  };

  const togglePerson = (uid) =>
    setForm(f => ({
      ...f,
      assignedPersons: f.assignedPersons.includes(uid)
        ? f.assignedPersons.filter(id => id !== uid)
        : [...f.assignedPersons, uid],
    }));

  const setPlatformUrl = (platform, url) =>
    setForm(f => ({ ...f, platformUrls: f.platformUrls.map(x => x.platform === platform ? { ...x, url } : x) }));

  if (showForm) {
    return (
      <Overlay onBgClick={() => setShowForm(false)} wide>
        <ModalTitle>{editingId ? "✏️ Edit Social Project" : "➕ New Social Project"}</ModalTitle>
        <F label="Project Name *">
          <input className="form-input" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Summer Campaign 2025"/>
        </F>
        <F label="Description">
          <textarea className="form-input" rows={2} value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Brief overview…" style={{ resize: "vertical" }}/>
        </F>
        <F label="Assigned Persons *">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "8px 0" }}>
            {allUsers.length === 0 && <span style={{ fontSize: 12, color: "#9ca3af" }}>Loading users…</span>}
            {allUsers.map(u => {
              const selected = form.assignedPersons.includes(u._id);
              return (
                <button key={u._id} type="button" onClick={() => togglePerson(u._id)}
                  style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    background: selected ? "#166534" : "#f3f4f6", color: selected ? "white" : "#374151",
                    border: selected ? "1.5px solid #166534" : "1.5px solid #e5e7eb" }}>
                  {selected ? "✓ " : ""}{u.name}
                  <span style={{ opacity: .6, fontSize: 10, marginLeft: 4 }}>
                    ({u.role === "intern" ? "Intern" : "Supervisor"})
                  </span>
                </button>
              );
            })}
          </div>
        </F>
        <F label="Platform URLs">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
            {form.platformUrls.map(({ platform, url }) => (
              <div key={platform} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, minWidth: 96, color: "#374151" }}>{PLATFORM_EMOJI[platform]} {platform}</span>
                <input className="form-input" value={url}
                  onChange={e => setPlatformUrl(platform, e.target.value)}
                  placeholder="https://…" style={{ fontSize: 12, padding: "6px 10px" }}/>
              </div>
            ))}
          </div>
        </F>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
          <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Back</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : editingId ? "Update Project" : "Create Project"}
          </button>
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay onBgClick={onClose} wide>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <ModalTitle>📁 Social Projects</ModalTitle>
        <button className="btn btn-primary" onClick={() => { setForm(defaultForm()); setEditingId(null); setShowForm(true); }}>
          + New Project
        </button>
      </div>
      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}><div className="spinner" style={{ margin: "0 auto" }}/></div>
      ) : projects.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📁</div><h3>No social projects yet</h3></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {projects.map(p => (
            <div key={p._id} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0a2e1a", marginBottom: 4 }}>{p.name}</div>
                  {p.description && <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>{p.description}</div>}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    {p.assignedPersons?.map(u => (
                      <span key={u._id} style={{ background: "#dcfce7", color: "#166534",
                        border: "1px solid #bbf7d0", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>
                        👤 {u.name}
                      </span>
                    ))}
                  </div>
                  {p.platformUrls?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {p.platformUrls.map(x => (
                        <span key={x.platform} style={{ fontSize: 11, color: "#6b7280", background: "#f3f4f6", borderRadius: 6, padding: "2px 8px" }}>
                          {PLATFORM_EMOJI[x.platform]} {x.platform}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6, marginLeft: 12 }}>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(p)}>✏️</button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(p._id)}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
      </div>
    </Overlay>
  );
}

function ContentModal({ content, socialProjects, onClose, onSaved }) {
  const { user } = useAuth();
  const isAdmin  = user?.role === "supervisor";

  const [form, setForm] = useState(() => content ? {
    socialProject: content.socialProject?._id || content.socialProject || "",
    platform: content.platform || "Instagram",
    plannedPostDate: content.plannedPostDate ? content.plannedPostDate.split("T")[0] : "",
    assignedTo: content.assignedTo?._id || content.assignedTo || "",
    contentDescription: content.contentDescription || "",
    postUrl: content.postUrl || "",
    status: content.status || "Planned",
  } : { socialProject: "", platform: "Instagram", plannedPostDate: "", assignedTo: "", contentDescription: "", postUrl: "", status: "Planned" });

  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const selectedProject = socialProjects.find(p => p._id === form.socialProject) || null;
  const projectPersons  = selectedProject?.assignedPersons || [];

  useEffect(() => {
    if (!selectedProject || !form.platform) return;
    const entry = selectedProject.platformUrls?.find(x => x.platform === form.platform);
    if (entry?.url) set("postUrl", entry.url);
  }, [form.socialProject, form.platform]);

  useEffect(() => {
    if (projectPersons.length === 1) set("assignedTo", projectPersons[0]._id || projectPersons[0]);
    else set("assignedTo", "");
  }, [form.socialProject]);

  const handleSave = async () => {
    if (!form.socialProject)   { alert("Please select a social project."); return; }
    if (!form.plannedPostDate) { alert("Planned post date is required.");  return; }
    if (!form.assignedTo)      { alert("Please assign to a person.");      return; }
    setSaving(true);
    try {
      const res = content
        ? await http.put(`${BASE}/${content._id}`, form)
        : await http.post(BASE, form);
      if (res.success) { onSaved(res.data); onClose(); }
      else alert(res.message || "Error saving.");
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const platformOptions = PLATFORMS.map(p => {
    const hasUrl = selectedProject?.platformUrls?.find(x => x.platform === p && x.url);
    return { value: p, label: `${PLATFORM_EMOJI[p]} ${p}${hasUrl ? " ✓" : ""}` };
  });

  return (
    <Overlay onBgClick={onClose}>
      <ModalTitle>{content ? "✏️ Edit Content" : "➕ New Content"}</ModalTitle>
      <F label="Social Project *">
        <select className="form-input" value={form.socialProject} onChange={e => set("socialProject", e.target.value)}>
          <option value="">— Select project —</option>
          {socialProjects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </F>
      {selectedProject?.description && (
        <div style={{ fontSize: 12, color: "#6b7280", background: "#f9fafb",
          border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", marginBottom: 14 }}>
          {selectedProject.description}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <F label="Platform *">
          <select className="form-input" value={form.platform} onChange={e => set("platform", e.target.value)}>
            {platformOptions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </F>
        <F label="Planned Post Date *">
          <input type="date" className="form-input" value={form.plannedPostDate} onChange={e => set("plannedPostDate", e.target.value)}/>
        </F>
      </div>
      <F label="Assigned To *">
        {!form.socialProject ? (
          <div style={{ fontSize: 12, color: "#9ca3af", padding: "8px 0" }}>← Select a social project first</div>
        ) : projectPersons.length === 0 ? (
          <div style={{ fontSize: 12, color: "#f59e0b", padding: "8px 0" }}>⚠️ No assigned persons — edit the project first.</div>
        ) : (
          <select className="form-input" value={form.assignedTo} onChange={e => set("assignedTo", e.target.value)}>
            <option value="">— Select person —</option>
            {projectPersons.map(u => {
              const id = u._id || u; const name = u.name || id;
              return <option key={id} value={id}>{name}{u.role ? ` (${u.role === "intern" ? "Intern" : "Supervisor"})` : ""}</option>;
            })}
          </select>
        )}
      </F>
      <F label="Content Description">
        <textarea className="form-input" rows={3} value={form.contentDescription}
          onChange={e => set("contentDescription", e.target.value)}
          placeholder="Content details…" style={{ resize: "vertical" }}/>
      </F>
      <F label={`Post URL${form.postUrl ? " ✓ auto-filled" : ""}`}>
        <input className="form-input" value={form.postUrl}
          onChange={e => set("postUrl", e.target.value)} placeholder="https://…"/>
      </F>
      {!isAdmin && content && (
        <F label="Status">
          <select className="form-input" value={form.status} onChange={e => set("status", e.target.value)}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </F>
      )}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : content ? "Update" : "Create"}
        </button>
      </div>
    </Overlay>
  );
}

function MarkPostedModal({ content, onClose, onSaved }) {
  const [postUrl, setPostUrl] = useState(content.postUrl || "");
  const [saving,  setSaving]  = useState(false);

  const handle = async () => {
    setSaving(true);
    try {
      const res = await http.patch(`${BASE}/${content._id}/mark-posted`, { postUrl });
      if (res.success) { onSaved(res.data); onClose(); }
      else alert(res.message);
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  return (
    <Overlay onBgClick={onClose}>
      <ModalTitle>✅ Mark as Posted</ModalTitle>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 18 }}>
        Confirm <strong>"{content.socialProject?.name || content.title}"</strong> has been posted on <strong>{content.platform}</strong>.
      </p>
      <F label="Post URL (optional)">
        <input className="form-input" value={postUrl} onChange={e => setPostUrl(e.target.value)} placeholder="https://…"/>
      </F>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handle} disabled={saving}>
          {saving ? "Saving…" : "Confirm Posted"}
        </button>
      </div>
    </Overlay>
  );
}

function PerformanceModal({ content, onClose, onSaved }) {
  const [form,   setForm]   = useState({ views: 0, likes: 0, comments: 0, shares: 0 });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: parseInt(v) || 0 }));

  const v = form.views, l = form.likes, c = form.comments, s = form.shares;
  const engRate   = v > 0 ? (((l + c + s) / v) * 100).toFixed(2) : 0;
  const perfScore = v + (l * 2) + (c * 3);

  const handle = async () => {
    if (!v && !l && !c && !s) { alert("Please enter at least one metric."); return; }
    setSaving(true);
    try {
      const res = await http.patch(`${BASE}/${content._id}/performance`, form);
      if (res.success) { onSaved(res.data); onClose(); }
      else alert(res.message || "Failed to submit metrics.");
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  return (
    <Overlay onBgClick={onClose}>
      <ModalTitle>📊 Submit Performance Data</ModalTitle>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 18 }}>
        Enter 7-day metrics for <strong>"{content.socialProject?.name || content.title}"</strong>
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[["Views 👁", "views"], ["Likes ❤️", "likes"], ["Comments 💬", "comments"], ["Shares 🔁", "shares"]].map(([label, key]) => (
          <F key={key} label={label}>
            <input type="number" min="0" className="form-input" value={form[key]}
              onChange={e => set(key, e.target.value)}/>
          </F>
        ))}
      </div>
      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10,
        padding: "12px 16px", marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", marginBottom: 8 }}>📈 Calculated Metrics Preview</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{ fontSize: 12, color: "#374151" }}>Engagement Rate: <strong>{engRate}%</strong></div>
          <div style={{ fontSize: 12, color: "#374151" }}>Performance Score: <strong>{perfScore}</strong></div>
        </div>
        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>
          ER = (Likes+Comments+Shares)/Views×100 · Score = Views+(Likes×2)+(Comments×3)
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handle} disabled={saving}>
          {saving ? "Submitting…" : "Submit Metrics"}
        </button>
      </div>
    </Overlay>
  );
}

function CalendarView({ contents, loading }) {
  const byDate = contents.reduce((acc, c) => {
    const d = (c.plannedPostDate || "").split("T")[0];
    if (!acc[d]) acc[d] = [];
    acc[d].push(c);
    return acc;
  }, {});

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }}/></div>;
  if (Object.keys(byDate).length === 0) return (
    <div className="empty-state"><div className="empty-icon">📅</div><h3>No content scheduled</h3></div>
  );

  return (
    <div style={{ padding: 24 }}>
      {Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, items]) => (
        <div key={date} style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 14,
            color: "var(--green-900)", marginBottom: 12, paddingBottom: 8, borderBottom: "2px solid var(--green-100)" }}>
            📅 {new Date(date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
            {items.map(c => (
              <div key={c._id} style={{ background: "white", border: "1px solid var(--gray-200)",
                borderRadius: 12, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <span className="tag">{PLATFORM_EMOJI[c.platform]} {c.platform}</span>
                  <SBadge status={c.status}/>
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--green-900)", marginBottom: 4 }}>
                  {c.socialProject?.name || c.title}
                </div>
                {c.contentDescription && <div style={{ fontSize: 12, color: "var(--gray-500)", marginBottom: 6 }}>{c.contentDescription}</div>}
                <div style={{ fontSize: 11, color: "var(--gray-400)", marginBottom: 4 }}>👤 {c.assignedTo?.name || "—"}</div>
                {c.postUrl && <a href={c.postUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "var(--green-600)", fontWeight: 600 }}>View Post ↗</a>}
                {c.metrics?.performanceScore > 0 && (
                  <div style={{ marginTop: 8, fontSize: 11, background: "#f0fdf4", borderRadius: 6, padding: "6px 8px", color: "#166534", fontWeight: 600 }}>
                    Score: {c.metrics.performanceScore} · ER: {c.metrics.engagementRate}% · 👁 {c.metrics.views}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SocialPage({ view = "list" }) {
  const { user }   = useAuth();
  const isAdmin    = user?.role === "supervisor";
  const isCalendar = view === "calendar";

  const [contents,       setContents]       = useState([]);
  const [stats,          setStats]          = useState(null);
  const [socialProjects, setSocialProjects] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [toast,          setToast]          = useState(null);
  const [showCreate,     setShowCreate]     = useState(false);
  const [editContent,    setEditContent]    = useState(null);
  const [markPosted,     setMarkPosted]     = useState(null);
  const [perfContent,    setPerfContent]    = useState(null);
  const [showProjMgr,    setShowProjMgr]    = useState(false);
  const [filterStatus,   setFilterStatus]   = useState("All");
  const [filterPlatform, setFilterPlatform] = useState("All");
  const [filterProject,  setFilterProject]  = useState("All");

  const loadSocialProjects = useCallback(async () => {
    const res = await http.get(SOCIAL_PROJ_BASE);
    if (res.success) setSocialProjects(res.data || []);
  }, []);

  useEffect(() => { loadSocialProjects(); }, [loadSocialProjects]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus   !== "All") params.set("status",   filterStatus);
      if (filterPlatform !== "All") params.set("platform", filterPlatform);
      params.set("limit", "100");
      const [cRes, sRes] = await Promise.all([
        http.get(`${BASE}?${params}`),
        http.get(`${BASE}/dashboard`),
      ]);
      if (cRes.success) setContents(cRes.data || []);
      if (sRes.success) setStats(sRes.data);
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
    setLoading(false);
  }, [filterStatus, filterPlatform]);

  useEffect(() => { load(); }, [load]);

  const filteredContents = filterProject === "All"
    ? contents
    : contents.filter(c => String(c.socialProject?._id || c.socialProject) === filterProject);

  const handleSaved = (updated) => {
    setContents(cs => {
      const idx = cs.findIndex(c => c._id === updated._id);
      if (idx >= 0) { const n = [...cs]; n[idx] = updated; return n; }
      return [updated, ...cs];
    });
    load();
    setToast({ msg: "Saved successfully!", type: "success" });
  };

  const handleStatusChange = async (contentId, newStatus) => {
    try {
      const res = await http.put(`${BASE}/${contentId}`, { status: newStatus });
      if (res.success) handleSaved(res.data);
      else setToast({ msg: res.message, type: "error" });
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this content?")) return;
    try {
      const res = await http.del(`${BASE}/${id}`);
      if (res.success) { setContents(cs => cs.filter(c => c._id !== id)); setToast({ msg: "Deleted.", type: "success" }); load(); }
      else setToast({ msg: res.message, type: "error" });
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
  };

  return (
    <div className="animate-fadeUp">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}

      {(showCreate || editContent) && (
        <ContentModal content={editContent} socialProjects={socialProjects}
          onClose={() => { setShowCreate(false); setEditContent(null); }} onSaved={handleSaved}/>
      )}
      {markPosted && <MarkPostedModal content={markPosted} onClose={() => setMarkPosted(null)} onSaved={handleSaved}/>}
      {perfContent && <PerformanceModal content={perfContent} onClose={() => setPerfContent(null)} onSaved={handleSaved}/>}
      {showProjMgr && <SocialProjectsManagerModal onClose={() => setShowProjMgr(false)} onProjectsChanged={loadSocialProjects}/>}

      <WeeklySummary contents={contents}/>

      {isAdmin && stats?.topPerformers?.length > 0 && (
        <div className="card mb-24">
          <div className="card-header"><div className="card-title">🏆 Top Performers (Last 30 Days)</div></div>
          <div style={{ padding: "0 24px 16px", display: "flex", gap: 12, flexWrap: "wrap" }}>
            {stats.topPerformers.map((c, i) => (
              <div key={c._id} style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", minWidth: 200 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#166534", marginBottom: 4 }}>#{i + 1} {PLATFORM_EMOJI[c.platform]} {c.platform}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--green-900)" }}>{c.socialProject?.name || c.title}</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Score: <strong>{c.metrics?.performanceScore}</strong> · ER: <strong>{c.metrics?.engagementRate}%</strong></div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>by {c.assignedTo?.name || "—"}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">{isCalendar ? "📅 Content Calendar" : "📱 Social Media Content"}</div>
          <div style={{ display: "flex", gap: 8 }}>
            {isAdmin && <button className="btn btn-secondary" onClick={() => setShowProjMgr(true)}>📁 Social Projects</button>}
            {isAdmin && !isCalendar && (
              <button className="btn btn-primary" onClick={() => { setEditContent(null); setShowCreate(true); }}>+ New Content</button>
            )}
          </div>
        </div>

        <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--gray-100)" }}>
          <div className="filters" style={{ flexWrap: "wrap", gap: 10 }}>
            <select className="filter-select" value={filterProject} onChange={e => setFilterProject(e.target.value)}>
              <option value="All">All Projects</option>
              {socialProjects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
            <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="All">All Status</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="filter-select" value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}>
              <option value="All">All Platforms</option>
              {PLATFORMS.map(p => <option key={p}>{p}</option>)}
            </select>
            <span className="text-sm text-gray" style={{ marginLeft: "auto" }}>
              {filteredContents.length} item{filteredContents.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {isCalendar && <CalendarView contents={filteredContents} loading={loading}/>}

        {!isCalendar && (
          <div className="table-wrap">
            {loading ? (
              <div style={{ padding: 40, textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }}/></div>
            ) : filteredContents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No content found</h3>
                <p>{isAdmin ? "Create your first content item above." : "No content has been assigned to you yet."}</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Planned Date</th>
                    <th>Project</th>
                    <th>Platform</th>
                    {isAdmin && <th>Assigned To</th>}
                    <th>Status</th>
                    <th>Performance</th>
                    <th>Post URL</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContents.map(c => (
                    <tr key={c._id}>
                      <td className="text-sm text-gray" style={{ whiteSpace: "nowrap" }}>
                        {c.plannedPostDate ? new Date(c.plannedPostDate).toLocaleDateString("en-GB") : "—"}
                      </td>
                      <td style={{ maxWidth: 200 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{c.socialProject?.name || c.title || "—"}</div>
                        {c.contentDescription && (
                          <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 2 }}>
                            {c.contentDescription.slice(0, 60)}{c.contentDescription.length > 60 ? "…" : ""}
                          </div>
                        )}
                      </td>
                      <td><span className="tag">{PLATFORM_EMOJI[c.platform]} {c.platform}</span></td>
                      {isAdmin && <td className="text-sm">{c.assignedTo?.name || "—"}</td>}
                      <td>
                        <StatusDropdown value={c.status} onChange={(newStatus) => handleStatusChange(c._id, newStatus)}/>
                      </td>
                      <td>
  {c.performanceCheckedAt ? (
    <div style={{ fontSize: 11 }}>
      <div style={{ fontWeight: 700, color: "#166534" }}>Score: {c.metrics.performanceScore}</div>
      <div style={{ color: "#6b7280" }}>ER: {c.metrics.engagementRate}%</div>
      <div style={{ color: "#6b7280" }}>👁 {c.metrics.views} ❤️ {c.metrics.likes}</div>
    </div>
  ) : <span style={{ fontSize: 12, color: "var(--gray-400)" }}>—</span>}
</td>
                      <td>
                        {c.postUrl
                          ? <a href={c.postUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--green-600)", fontWeight: 600 }}>View ↗</a>
                          : <span style={{ fontSize: 12, color: "var(--gray-400)" }}>—</span>}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setEditContent(c)}>✏️</button>
                          {c.status === "Planned" && (
                            <button onClick={() => setMarkPosted(c)}
                              style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0",
                                borderRadius: 7, padding: "4px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                              ✅ Posted
                            </button>
                          )}
                         {c.status === "Posted" && !c.performanceCheckedAt && (
  <button onClick={() => setPerfContent(c)}
    style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe",
      borderRadius: 7, padding: "4px 8px", fontSize: 11, fontWeight: 700,
      cursor: "pointer", whiteSpace: "nowrap" }}>
    📊 Metrics
  </button>
)}
                          {isAdmin && (
                            <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(c._id)}>🗑</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}