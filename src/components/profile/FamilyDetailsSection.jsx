// components/profile/FamilyDetailsSection.jsx
// Displays / edits family member information for an employee:
//   Spouse | Father | Mother | Children (list)

import Field from "../shared/forms/Field.jsx";

const emptyMember = { name: "", nic: "", occupation: "", contact: "" };
const emptyChild  = { name: "", dateOfBirth: "", nic: "" };

function MemberView({ title, data }) {
  const hasAny = data && (data.name || data.nic || data.occupation || data.contact);
  return (
    <div style={{
      background: "var(--gray-50, #f8fafc)",
      border: "1px solid var(--gray-200, #e2e8f0)",
      borderRadius: 10,
      padding: "14px 16px",
      marginBottom: 12,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--green-700, #047857)", marginBottom: hasAny ? 10 : 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {title}
      </div>
      {hasAny ? (
        <div className="profile-info-grid">
          {[["Full Name", data.name], ["NIC / Passport", data.nic], ["Occupation", data.occupation], ["Contact", data.contact]]
            .map(([l, v]) => v && (
              <div key={l} className="profile-info-item"><label>{l}</label><p>{v || "–"}</p></div>
            ))}
        </div>
      ) : (
        <p style={{ fontSize: 13, color: "var(--gray-400, #9ca3af)", margin: 0 }}>Not provided</p>
      )}
    </div>
  );
}

function MemberEdit({ title, data, onChange }) {
  const set = (k, v) => onChange({ ...data, [k]: v });
  return (
    <div style={{
      background: "var(--gray-50, #f8fafc)",
      border: "1px solid var(--green-200, #a7f3d0)",
      borderRadius: 10,
      padding: "14px 16px",
      marginBottom: 12,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--green-700, #047857)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {title}
      </div>
      <div className="form-grid">
        <Field label="Full Name">
          <input className="form-input" value={data.name || ""} onChange={e => set("name", e.target.value)} placeholder="Enter full name" />
        </Field>
        <Field label="NIC / Passport">
          <input className="form-input" value={data.nic || ""} onChange={e => set("nic", e.target.value)} placeholder="Enter NIC or passport no." />
        </Field>
        <Field label="Occupation">
          <input className="form-input" value={data.occupation || ""} onChange={e => set("occupation", e.target.value)} placeholder="Enter occupation" />
        </Field>
        <Field label="Contact Number">
          <input className="form-input" value={data.contact || ""} onChange={e => set("contact", e.target.value)} placeholder="Enter contact number" />
        </Field>
      </div>
    </div>
  );
}

export default function FamilyDetailsSection({ editing, form, setForm }) {
  const fd = form.familyDetails || { spouse: { ...emptyMember }, father: { ...emptyMember }, mother: { ...emptyMember }, children: [] };

  const setMember = (key, val) =>
    setForm(f => ({ ...f, familyDetails: { ...fd, [key]: val } }));

  const addChild = () =>
    setForm(f => ({ ...f, familyDetails: { ...fd, children: [...(fd.children || []), { ...emptyChild }] } }));

  const updateChild = (idx, val) => {
    const updated = [...(fd.children || [])];
    updated[idx] = val;
    setForm(f => ({ ...f, familyDetails: { ...fd, children: updated } }));
  };

  const removeChild = (idx) => {
    const updated = (fd.children || []).filter((_, i) => i !== idx);
    setForm(f => ({ ...f, familyDetails: { ...fd, children: updated } }));
  };

  if (!editing) {
    return (
      <div className="card mb-24">
        <div className="card-header">
          <div className="card-title">👨‍👩‍👧 Family Details</div>
        </div>
        <div className="card-body">
          <MemberView title="Spouse" data={fd.spouse} />
          <MemberView title="Father" data={fd.father} />
          <MemberView title="Mother" data={fd.mother} />

          {/* Children */}
          <div style={{
            background: "var(--gray-50, #f8fafc)",
            border: "1px solid var(--gray-200, #e2e8f0)",
            borderRadius: 10,
            padding: "14px 16px",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--green-700, #047857)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Children
            </div>
            {fd.children && fd.children.length > 0 ? (
              fd.children.map((c, i) => (
                <div key={i} className="profile-info-grid" style={{ borderBottom: i < fd.children.length - 1 ? "1px solid #e2e8f0" : "none", paddingBottom: 8, marginBottom: 8 }}>
                  <div className="profile-info-item"><label>Name</label><p>{c.name || "–"}</p></div>
                  <div className="profile-info-item"><label>Date of Birth</label><p>{c.dateOfBirth || "–"}</p></div>
                  <div className="profile-info-item"><label>NIC / Passport</label><p>{c.nic || "–"}</p></div>
                </div>
              ))
            ) : (
              <p style={{ fontSize: 13, color: "var(--gray-400, #9ca3af)", margin: 0 }}>No children added</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-24">
      <div className="card-header">
        <div className="card-title">👨‍👩‍👧 Family Details</div>
      </div>
      <div className="card-body">
        <MemberEdit title="Spouse" data={fd.spouse || emptyMember} onChange={v => setMember("spouse", v)} />
        <MemberEdit title="Father" data={fd.father || emptyMember} onChange={v => setMember("father", v)} />
        <MemberEdit title="Mother" data={fd.mother || emptyMember} onChange={v => setMember("mother", v)} />

        {/* Children */}
        <div style={{
          background: "var(--gray-50, #f8fafc)",
          border: "1px solid var(--green-200, #a7f3d0)",
          borderRadius: 10,
          padding: "14px 16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--green-700, #047857)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Children
            </div>
            <button
              type="button"
              onClick={addChild}
              style={{
                background: "var(--green-600, #059669)", color: "#fff",
                border: "none", borderRadius: 6, cursor: "pointer",
                fontSize: 12, fontWeight: 600, padding: "4px 12px",
              }}
            >
              + Add Child
            </button>
          </div>

          {(fd.children || []).length === 0 && (
            <p style={{ fontSize: 13, color: "var(--gray-400, #9ca3af)", margin: 0 }}>Click &quot;+ Add Child&quot; to add children.</p>
          )}

          {(fd.children || []).map((child, i) => (
            <div key={i} style={{
              background: "#fff",
              border: "1px solid var(--gray-200, #e2e8f0)",
              borderRadius: 8,
              padding: 12,
              marginBottom: 10,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Child #{i + 1}</span>
                <button
                  type="button"
                  onClick={() => removeChild(i)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 12, fontWeight: 600 }}
                >
                  Remove
                </button>
              </div>
              <div className="form-grid">
                <Field label="Full Name">
                  <input className="form-input" value={child.name || ""} onChange={e => updateChild(i, { ...child, name: e.target.value })} placeholder="Child's full name" />
                </Field>
                <Field label="Date of Birth">
                  <input type="date" className="form-input" value={child.dateOfBirth || ""} onChange={e => updateChild(i, { ...child, dateOfBirth: e.target.value })} />
                </Field>
                <Field label="NIC / Passport">
                  <input className="form-input" value={child.nic || ""} onChange={e => updateChild(i, { ...child, nic: e.target.value })} placeholder="NIC or passport no." />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
