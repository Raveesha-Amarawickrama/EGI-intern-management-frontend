import { useState, useEffect, useRef } from "react";
import { userAPI } from "../../utils/api";
import { Avatar, Toast } from "../../components/shared/index.jsx";
import { useAuth } from "../../hooks/useAuth";
import { formatMinutes } from "../../utils/helpers";
import Field from "../../components/shared/forms/Field.jsx";
import FamilyDetailsSection from "../../components/profile/FamilyDetailsSection.jsx";
import DocumentsSection from "../../components/profile/DocumentsSection.jsx";

const emptyBank   = { bankName: "", accountHolderName: "", accountNumber: "", branchName: "", ifscOrSwift: "" };
const emptyMember = { name: "", nic: "", occupation: "", contact: "" };
const emptyFamily = { spouse: { ...emptyMember }, father: { ...emptyMember }, mother: { ...emptyMember }, children: [] };

function buildForm(user) {
  return {
    contact:               user.contact               || "",
    position:              user.position              || "",
    department:            user.department            || "",
    startDate:             user.startDate             || "",
    endDate:               user.endDate               || "",
    gender:                user.gender                || "",
    dateOfBirth:           user.dateOfBirth           || "",
    nic:                   user.nic                   || "",
    address:               user.address               || "",
    emergencyContactName:  user.emergencyContactName  || "",
    emergencyContactPhone: user.emergencyContactPhone || "",
    bankDetails:           { ...emptyBank,   ...(user.bankDetails   || {}) },
    familyDetails: {
      spouse:   { ...emptyMember, ...(user.familyDetails?.spouse   || {}) },
      father:   { ...emptyMember, ...(user.familyDetails?.father   || {}) },
      mother:   { ...emptyMember, ...(user.familyDetails?.mother   || {}) },
      children: user.familyDetails?.children || [],
    },
  };
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [stats, setStats]     = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!user) return;
    setForm(buildForm(user));
  }, [user]);

  useEffect(() => {
    if (!user?._id) return;
    userAPI.getStats(user._id).then(d => setStats(d.stats)).catch(() => {});
  }, [user?._id]);

  if (!user || !form) return <div style={{ padding: 60, textAlign: "center" }}><div className="spinner" /></div>;

  const set     = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setBank = (k, v) => setForm(f => ({ ...f, bankDetails: { ...f.bankDetails, [k]: v } }));

 
  const handlePickPhoto = () => fileInputRef.current?.click();

  const handlePhotoSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setToast({ msg: "Please choose a JPG, PNG, WEBP or GIF image.", type: "error" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast({ msg: "Image must be smaller than 5MB.", type: "error" });
      return;
    }
    setUploadingPic(true);
    try {
      const d = await userAPI.uploadProfilePicture(user._id || user.id, file);
      setUser(d.user);
      setToast({ msg: "Profile picture updated!", type: "success" });
    } catch (err) {
      setToast({ msg: err.message, type: "error" });
    }
    setUploadingPic(false);
  };

  const handleRemovePhoto = async () => {
    setUploadingPic(true);
    try {
      const d = await userAPI.deleteProfilePicture(user._id || user.id);
      setUser(d.user);
      setToast({ msg: "Profile picture removed.", type: "success" });
    } catch (err) {
      setToast({ msg: err.message, type: "error" });
    }
    setUploadingPic(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const d = await userAPI.update(user._id || user.id, form);
      setUser(d.user);
      setToast({ msg: "Profile updated!", type: "success" });
      setEditing(false);
    } catch (e) {
      setToast({ msg: e.message, type: "error" });
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setForm(buildForm(user));
    setEditing(false);
  };

  const roleLabel = user.role === "intern"
    ? "Intern Trainee"
    : user.supervisorLevel === "senior" ? "Senior Supervisor"
    : user.supervisorLevel === "junior" ? "Junior Supervisor"
    : "Supervisor";

  return (
    <div className="animate-fadeUp">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

   
      <div className="card mb-24">
        <div className="card-body">
          <div className="profile-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              {/* Clickable avatar with camera overlay */}
              <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
                <Avatar initials={user.avatar} color={user.avatarColor} size="xl" src={user.profilePicture} />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: "none" }}
                  onChange={handlePhotoSelected}
                />
                <button
                  onClick={handlePickPhoto}
                  disabled={uploadingPic}
                  title="Change profile picture"
                  style={{
                    position: "absolute", bottom: -4, right: -4,
                    width: 26, height: 26, borderRadius: "50%",
                    background: "var(--green-600)", color: "#fff",
                    border: "2px solid #fff", cursor: uploadingPic ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, boxShadow: "0 2px 6px rgba(0,0,0,.25)",
                  }}
                >
                  {uploadingPic ? "…" : "📷"}
                </button>
              </div>
              <div>
                <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: 24, fontWeight: 800, color: "var(--green-900)" }}>{user.name}</h2>
                <p style={{ fontSize: 13, color: "var(--green-600)", fontWeight: 600, marginTop: 4 }}>{user.position || roleLabel}</p>
                <p style={{ fontSize: 13, color: "var(--gray-500)", marginTop: 2 }}>{user.department}</p>
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <span className="chip">🌿 Eco Green International</span>
                  <span className="chip">{user.role === "intern" ? "👨‍💻 Intern Trainee" : `👔 ${roleLabel}`}</span>
                  {user.profilePicture && (
                    <button
                      onClick={handleRemovePhoto}
                      disabled={uploadingPic}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11.5, color: "#dc2626", fontWeight: 600, padding: 0 }}
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>
            </div>
            {!editing ? (
              <button className="btn btn-primary" onClick={() => setEditing(true)}>✏️ Edit Profile</button>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-secondary" onClick={handleCancel} disabled={saving}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

   
      {stats && (
        <div className="grid-4 mb-24">
          {[
            ["✅", "Completed",  stats.done,                    "stat-green"],
            ["📋", "Total Tasks", stats.total,                  "stat-blue"],
            ["⏱",  "Hours Logged", formatMinutes(stats.totalMins), "stat-gold"],
            ["📈", "Completion",  stats.pct + "%",              "stat-purple"],
          ].map(([icon, label, val, cls]) => (
            <div key={label} className={`stat-card ${cls}`}>
              <div className="stat-icon">{icon}</div>
              <div className="stat-value">{val}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      )}

    
      <div className="card mb-24">
        <div className="card-header"><div className="card-title">👤 Basic Details</div></div>
        <div className="card-body">
          {!editing ? (
            <div className="profile-info-grid">
              {[
                ["Email Address",          user.email],
                ["Contact Number",         user.contact || "–"],
                ["Gender",                 user.gender || "–"],
                ["Date of Birth",          user.dateOfBirth || "–"],
                ["NIC / Passport No.",     user.nic || "–"],
                ["Address",                user.address || "–"],
                ["Start Date",             user.startDate || "–"],
                ["End Date",               user.endDate || "–"],
                ["Position",               user.position || "–"],
                ["Department",             user.department || "–"],
                ["Emergency Contact Name", user.emergencyContactName || "–"],
                ["Emergency Contact Phone",user.emergencyContactPhone || "–"],
              ].map(([l, v]) => (
                <div key={l} className="profile-info-item"><label>{l}</label><p>{v}</p></div>
              ))}
            </div>
          ) : (
            <div className="form-grid">
              <Field label="Contact Number">
                <input className="form-input" value={form.contact} onChange={e => set("contact", e.target.value)} />
              </Field>
              <Field label="Gender">
                <select className="form-select" value={form.gender} onChange={e => set("gender", e.target.value)}>
                  <option value="">Select…</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
              <Field label="Date of Birth">
                <input type="date" className="form-input" value={form.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)} />
              </Field>
              <Field label="NIC / Passport No.">
                <input className="form-input" value={form.nic} onChange={e => set("nic", e.target.value)} />
              </Field>
              <Field label="Position">
                <input className="form-input" value={form.position} onChange={e => set("position", e.target.value)} />
              </Field>
              <Field label="Department">
                <input className="form-input" value={form.department} onChange={e => set("department", e.target.value)} />
              </Field>
              <Field label="Start Date">
                <input type="date" className="form-input" value={form.startDate} onChange={e => set("startDate", e.target.value)} />
              </Field>
              <Field label="End Date">
                <input type="date" className="form-input" value={form.endDate} onChange={e => set("endDate", e.target.value)} />
              </Field>
              <Field label="Address" full>
                <textarea className="form-textarea" rows={2} value={form.address} onChange={e => set("address", e.target.value)} />
              </Field>
              <Field label="Emergency Contact Name">
                <input className="form-input" value={form.emergencyContactName} onChange={e => set("emergencyContactName", e.target.value)} />
              </Field>
              <Field label="Emergency Contact Phone">
                <input className="form-input" value={form.emergencyContactPhone} onChange={e => set("emergencyContactPhone", e.target.value)} />
              </Field>
            </div>
          )}
        </div>
      </div>

    
      <div className="card mb-24">
        <div className="card-header"><div className="card-title">🏦 Bank Details</div></div>
        <div className="card-body">
          {!editing ? (
            <div className="profile-info-grid">
              {[
                ["Bank Name",           user.bankDetails?.bankName],
                ["Account Holder Name", user.bankDetails?.accountHolderName],
                ["Account Number",      user.bankDetails?.accountNumber],
                ["Branch Name",         user.bankDetails?.branchName],
                ["IFSC / SWIFT Code",   user.bankDetails?.ifscOrSwift],
              ].map(([l, v]) => (
                <div key={l} className="profile-info-item"><label>{l}</label><p>{v || "–"}</p></div>
              ))}
            </div>
          ) : (
            <div className="form-grid">
              <Field label="Bank Name">
                <input className="form-input" value={form.bankDetails.bankName} onChange={e => setBank("bankName", e.target.value)} />
              </Field>
              <Field label="Account Holder Name">
                <input className="form-input" value={form.bankDetails.accountHolderName} onChange={e => setBank("accountHolderName", e.target.value)} />
              </Field>
              <Field label="Account Number">
                <input className="form-input" value={form.bankDetails.accountNumber} onChange={e => setBank("accountNumber", e.target.value)} />
              </Field>
              <Field label="Branch Name">
                <input className="form-input" value={form.bankDetails.branchName} onChange={e => setBank("branchName", e.target.value)} />
              </Field>
              <Field label="IFSC / SWIFT Code">
                <input className="form-input" value={form.bankDetails.ifscOrSwift} onChange={e => setBank("ifscOrSwift", e.target.value)} />
              </Field>
            </div>
          )}
        </div>
      </div>

  
      <FamilyDetailsSection editing={editing} form={form} setForm={setForm} />

      
      <DocumentsSection
        user={user}
        onUpdated={(updatedUser) => setUser(updatedUser)}
        setToast={setToast}
      />
    </div>
  );
}