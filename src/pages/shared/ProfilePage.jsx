import { useState, useEffect } from "react";
import { userAPI } from "../../utils/api";
import { Avatar, Toast } from "../../components/shared/index.jsx";
import { useAuth } from "../../hooks/useAuth";
import { formatMinutes } from "../../utils/helpers";

const emptyBank = { bankName: "", accountHolderName: "", accountNumber: "", branchName: "", ifscOrSwift: "" };

function Field({ label, children }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [stats, setStats]     = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);

  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!user) return;
    setForm({
      contact: user.contact || "",
      position: user.position || "",
      department: user.department || "",
      startDate: user.startDate || "",
      endDate: user.endDate || "",
      gender: user.gender || "",
      dateOfBirth: user.dateOfBirth || "",
      nic: user.nic || "",
      address: user.address || "",
      emergencyContactName: user.emergencyContactName || "",
      emergencyContactPhone: user.emergencyContactPhone || "",
      bankDetails: { ...emptyBank, ...(user.bankDetails || {}) },
    });
  }, [user]);

  useEffect(() => {
    if (!user?._id) return;
    userAPI.getStats(user._id).then(d => setStats(d.stats)).catch(() => {});
  }, [user?._id]);

  if (!user || !form) return <div style={{ padding: 60, textAlign: "center" }}><div className="spinner" /></div>;

  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setBank = (k, v) => setForm(f => ({ ...f, bankDetails: { ...f.bankDetails, [k]: v } }));

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
    setForm({
      contact: user.contact || "",
      position: user.position || "",
      department: user.department || "",
      startDate: user.startDate || "",
      endDate: user.endDate || "",
      gender: user.gender || "",
      dateOfBirth: user.dateOfBirth || "",
      nic: user.nic || "",
      address: user.address || "",
      emergencyContactName: user.emergencyContactName || "",
      emergencyContactPhone: user.emergencyContactPhone || "",
      bankDetails: { ...emptyBank, ...(user.bankDetails || {}) },
    });
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
              <Avatar initials={user.avatar} color={user.avatarColor} size="xl" />
              <div>
                <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: 24, fontWeight: 800, color: "var(--green-900)" }}>{user.name}</h2>
                <p style={{ fontSize: 13, color: "var(--green-600)", fontWeight: 600, marginTop: 4 }}>{user.position || roleLabel}</p>
                <p style={{ fontSize: 13, color: "var(--gray-500)", marginTop: 2 }}>{user.department}</p>
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  <span className="chip">🌿 Eco Green International</span>
                  <span className="chip">{user.role === "intern" ? "👨‍💻 Intern Trainee" : `👔 ${roleLabel}`}</span>
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
            ["✅", "Completed", stats.done, "stat-green"],
            ["📋", "Total Tasks", stats.total, "stat-blue"],
            ["⏱", "Hours Logged", formatMinutes(stats.totalMins), "stat-gold"],
            ["📈", "Completion", stats.pct + "%", "stat-purple"],
          ].map(([icon, label, val, cls]) => (
            <div key={label} className={`stat-card ${cls}`}>
              <div className="stat-icon">{icon}</div>
              <div className="stat-value">{val}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Basic details */}
      <div className="card mb-24">
        <div className="card-header"><div className="card-title">👤 Basic Details</div></div>
        <div className="card-body">
          {!editing ? (
            <div className="profile-info-grid">
              {[
                ["Email Address", user.email],
                ["Contact Number", user.contact || "–"],
                ["Gender", user.gender || "–"],
                ["Date of Birth", user.dateOfBirth || "–"],
                ["NIC / Passport No.", user.nic || "–"],
                ["Address", user.address || "–"],
                ["Start Date", user.startDate || "–"],
                ["End Date", user.endDate || "–"],
                ["Position", user.position || "–"],
                ["Department", user.department || "–"],
                ["Emergency Contact Name", user.emergencyContactName || "–"],
                ["Emergency Contact Phone", user.emergencyContactPhone || "–"],
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
              <div className="form-group full">
                <label className="form-label">Address</label>
                <textarea className="form-textarea" rows={2} value={form.address} onChange={e => set("address", e.target.value)} />
              </div>
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

      {/* Bank details */}
      <div className="card">
        <div className="card-header"><div className="card-title">🏦 Bank Details</div></div>
        <div className="card-body">
          {!editing ? (
            <div className="profile-info-grid">
              {[
                ["Bank Name", user.bankDetails?.bankName],
                ["Account Holder Name", user.bankDetails?.accountHolderName],
                ["Account Number", user.bankDetails?.accountNumber],
                ["Branch Name", user.bankDetails?.branchName],
                ["IFSC / SWIFT Code", user.bankDetails?.ifscOrSwift],
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
    </div>
  );
}