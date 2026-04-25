import { useState, useEffect } from "react";
import { userAPI, authAPI } from "../../utils/api";
import { Avatar, Toast } from "../../components/shared/index.jsx";
import { useAuth } from "../../hooks/useAuth";
import { formatMinutes } from "../../utils/helpers";

export function SupervisorsPage() {
  const { user, isSenior } = useAuth();
  const [supervisors,      setSupervisors]      = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [toast,            setToast]            = useState(null);
  const [showAdd,          setShowAdd]          = useState(false);
  const [adding,           setAdding]           = useState(false);
  const [deleteTarget,     setDeleteTarget]     = useState(null);
  const [deleting,         setDeleting]         = useState(false);
  const [resetTarget,      setResetTarget]      = useState(null);
  const [newPass,          setNewPass]          = useState("");
  const [resetting,        setResetting]        = useState(false);
  const [form, setForm] = useState({
    name:"", username:"", password:"", email:"",
    contact:"", position:"", department:"", supervisorLevel:"supervisor",
  });

  const load = () => {
    setLoading(true);
    userAPI.getAll("supervisor")
      .then(d => {
        const others = (d.users || []).filter(u => String(u._id) !== String(user._id || user.id));
        setSupervisors(others);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.username || !form.password || !form.email) {
      setToast({ msg:"Name, username, password and email are required.", type:"error" }); return;
    }
    setAdding(true);
    try {
      await authAPI.registerSupervisor(form);
      setToast({ msg:`${form.name} added successfully!`, type:"success" });
      setShowAdd(false);
      setForm({ name:"", username:"", password:"", email:"", contact:"", position:"", department:"", supervisorLevel:"supervisor" });
      load();
    } catch (e) { setToast({ msg: e.message, type:"error" }); }
    setAdding(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await authAPI.deleteSupervisor(deleteTarget._id);
      setSupervisors(s => s.filter(u => u._id !== deleteTarget._id));
      setToast({ msg:`${deleteTarget.name} removed.`, type:"success" });
      setDeleteTarget(null);
    } catch (e) { setToast({ msg: e.message, type:"error" }); }
    setDeleting(false);
  };

  const handleResetPassword = async () => {
    if (!newPass || newPass.length < 6) { setToast({ msg:"Password must be at least 6 characters.", type:"error" }); return; }
    setResetting(true);
    try {
      await authAPI.resetPassword(resetTarget._id, { newPassword: newPass });
      setToast({ msg:`Password reset for ${resetTarget.name}.`, type:"success" });
      setResetTarget(null); setNewPass("");
    } catch (e) { setToast({ msg: e.message, type:"error" }); }
    setResetting(false);
  };

  const getRoleBadge = (sv) => {
    if (sv.supervisorLevel === "senior") return { label:"Senior Supervisor", bg:"#faf5ff", color:"#7c3aed", border:"#ddd6fe" };
    if (sv.supervisorLevel === "junior") return { label:"Junior Supervisor", bg:"#fff7ed", color:"#c2410c", border:"#fed7aa" };
    return                                      { label:"Supervisor",        bg:"#f0fdf4", color:"#166534", border:"#bbf7d0" };
  };

  if (loading) return <div style={{ padding:60, textAlign:"center" }}><div className="spinner"/></div>;

  const Modal = ({ children, onBgClick }) => (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16 }}
      onClick={e => e.target === e.currentTarget && onBgClick()}>
      <div style={{ background:"white", borderRadius:18, maxWidth:"100%", maxHeight:"90vh", overflow:"auto", padding:"32px 28px", boxShadow:"0 24px 80px rgba(0,0,0,.3)" }}>
        {children}
      </div>
    </div>
  );

  const juniors   = supervisors.filter(s => s.supervisorLevel === "junior");
  const plains    = supervisors.filter(s => s.supervisorLevel === "supervisor");
  const seniors   = supervisors.filter(s => s.supervisorLevel === "senior");

  const SupervisorCard = ({ sv }) => {
    const badge = getRoleBadge(sv);
    return (
      <div className="intern-card">
        <div className="flex items-center gap-12 mb-16">
          <Avatar initials={sv.avatar} color={sv.avatarColor} size="lg"/>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:15, color:"var(--green-900)" }}>{sv.name}</div>
            <div style={{ fontSize:12, fontWeight:600, marginTop:3 }}>
              <span style={{ padding:"2px 10px", borderRadius:99, fontSize:11, fontWeight:700, background:badge.bg, color:badge.color, border:`1px solid ${badge.border}` }}>
                {badge.label}
              </span>
            </div>
          </div>
          {isSenior && sv.supervisorLevel !== "senior" && (
            <button onClick={() => setDeleteTarget(sv)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, color:"#ef4444", padding:"4px" }}>🗑</button>
          )}
        </div>

        <div style={{ fontSize:12, color:"var(--gray-500)", marginBottom:12, display:"flex", flexDirection:"column", gap:4 }}>
          <div>📧 {sv.email}</div>
          {sv.contact && <div>📞 {sv.contact}</div>}
          {sv.position && <div>💼 {sv.position}</div>}
          {sv.department && <div>🏢 {sv.department}</div>}
        </div>

        {isSenior && (
          <button onClick={() => setResetTarget(sv)}
            style={{ marginTop:8, width:"100%", padding:"7px", borderRadius:8, border:"1px solid #fecaca", background:"#fef2f2", color:"#dc2626", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
            🔑 Reset Password
          </button>
        )}
      </div>
    );
  };

  const Section = ({ title, list }) => list.length === 0 ? null : (
    <>
      <div style={{ fontSize:11, fontWeight:700, color:"var(--gray-400)", letterSpacing:".08em", textTransform:"uppercase", marginBottom:12, marginTop:24 }}>
        {title} ({list.length})
      </div>
      <div className="grid-3">
        {list.map(sv => <SupervisorCard key={sv._id} sv={sv}/>)}
      </div>
    </>
  );

  return (
    <div className="animate-fadeUp">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}

      {/* Add Supervisor Modal */}
      {showAdd && (
        <Modal onBgClick={() => setShowAdd(false)}>
          <div style={{ width:500 }}>
            <div style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:18, color:"#0a2e1a", marginBottom:6 }}>➕ Add Supervisor</div>
            <p style={{ fontSize:13, color:"#6b7280", marginBottom:20 }}>Fill in the details to register a new supervisor.</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {[
                ["Full Name *",  "name",     "text"],
                ["Username *",   "username", "text"],
                ["Password *",   "password", "password"],
                ["Email *",      "email",    "email"],
                ["Contact",      "contact",  "text"],
                ["Position",     "position", "text"],
                ["Department",   "department","text"],
              ].map(([label, key, type]) => (
                <div key={key} style={{ gridColumn: key==="name" ? "1/-1" : "auto" }}>
                  <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>{label}</label>
                  <input
                    type={type}
                    className="form-input"
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div style={{ gridColumn:"1/-1" }}>
                <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>Role *</label>
                <div style={{ display:"flex", gap:10 }}>
                  {[
                    { value:"supervisor", label:"Supervisor",        bg:"#f0fdf4", color:"#166534", border:"#bbf7d0" },
                    { value:"junior",     label:"Junior Supervisor",  bg:"#fff7ed", color:"#c2410c", border:"#fed7aa" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setForm(f => ({ ...f, supervisorLevel: opt.value }))}
                      style={{
                        flex:1, padding:"10px 14px", borderRadius:10, cursor:"pointer", fontFamily:"inherit",
                        border: form.supervisorLevel === opt.value ? `2px solid ${opt.border}` : "2px solid #e5e7eb",
                        background: form.supervisorLevel === opt.value ? opt.bg : "#f9fafb",
                        color: form.supervisorLevel === opt.value ? opt.color : "#6b7280",
                        fontWeight: form.supervisorLevel === opt.value ? 700 : 500,
                        fontSize:13, transition:"all .15s",
                      }}
                    >{opt.label}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:20 }}>
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={adding}>{adding ? "Adding…" : "Add Supervisor"}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <Modal onBgClick={() => setResetTarget(null)}>
          <div style={{ width:360 }}>
            <div style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:18, color:"#0a2e1a", marginBottom:6 }}>🔑 Reset Password</div>
            <p style={{ fontSize:13, color:"#6b7280", marginBottom:20 }}>New temporary password for <strong>{resetTarget.name}</strong>.</p>
            <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>New Password</label>
            <input type="password" className="form-input" style={{ marginBottom:20 }} value={newPass}
              onChange={e => setNewPass(e.target.value)} placeholder="Min. 6 characters"
              onKeyDown={e => e.key==="Enter" && handleResetPassword()}/>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button className="btn btn-secondary" onClick={() => { setResetTarget(null); setNewPass(""); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleResetPassword} disabled={resetting}>{resetting ? "Resetting…" : "Reset Password"}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <Modal onBgClick={() => setDeleteTarget(null)}>
          <div style={{ width:360 }}>
            <div style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:18, color:"#dc2626", marginBottom:6 }}>🗑 Remove Supervisor</div>
            <p style={{ fontSize:13, color:"#6b7280", marginBottom:20 }}>Remove <strong>{deleteTarget.name}</strong>? This cannot be undone.</p>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button style={{ padding:"9px 20px", borderRadius:9, border:"none", background:"#ef4444", color:"white", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}
                onClick={handleDelete} disabled={deleting}>{deleting ? "Removing…" : "Remove"}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Header */}
      {isSenior && (
        <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:20 }}>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Supervisor</button>
        </div>
      )}

      {supervisors.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🧑‍💼</div>
          <h3>No supervisors yet</h3>
          <p>Add a supervisor using the button above.</p>
        </div>
      ) : (
        <>
          <Section title="Junior Supervisors"  list={juniors}/>
          <Section title="Supervisors"         list={plains}/>
          <Section title="Senior Supervisors"  list={seniors}/>
        </>
      )}
    </div>
  );
}
// Add this at the very end of SupervisorsPage.jsx
export default SupervisorsPage;