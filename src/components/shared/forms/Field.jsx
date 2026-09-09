// components/shared/forms/Field.jsx
// Reusable form field wrapper used throughout profile forms.
// Usage:
//   <Field label="Contact Number">
//     <input className="form-input" ... />
//   </Field>
//
//   <Field label="Address" full>
//     <textarea className="form-textarea" ... />
//   </Field>

export default function Field({ label, children, full = false }) {
  return (
    <div className={`form-group${full ? " full" : ""}`}>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}
