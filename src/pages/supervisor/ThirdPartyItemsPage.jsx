import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { thirdPartyItemAPI } from "../../utils/api";
import { Toast } from "../../components/shared/index.jsx";
import { useAuth } from "../../hooks/useAuth";

function Modal({ children, onBgClick }) {
  return createPortal(
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.55)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        zIndex: 1000, padding: "80px 16px 40px", overflowY: "auto",
      }}
      onClick={e => e.target === e.currentTarget && onBgClick()}
    >
      <div style={{
        background: "white", borderRadius: 18, maxWidth: "100%",
        padding: "32px 28px", boxShadow: "0 24px 80px rgba(0,0,0,.3)",
      }}>
        {children}
      </div>
    </div>,
    document.body
  );
}

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

function badgeStyle(bg, color, border) {
  return { fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: bg, color, border: `1px solid ${border}` };
}

function RenewalBadge({ dateStr, status }) {
  if (status === "cancelled") return <span style={badgeStyle("#f3f4f6", "#6b7280", "#e5e7eb")}>Cancelled</span>;
  if (status === "completed") return <span style={badgeStyle("#dcfce7", "#166534", "#bbf7d0")}>✓ Completed</span>;

  const d = daysUntil(dateStr);
  if (d < 0)   return <span style={badgeStyle("#fee2e2", "#991b1b", "#fecaca")}>Overdue {Math.abs(d)}d</span>;
  if (d === 0) return <span style={badgeStyle("#fee2e2", "#991b1b", "#fecaca")}>Due today</span>;
  if (d <= 3)  return <span style={badgeStyle("#fee2e2", "#b91c1c", "#fecaca")}>⏰ {d} day{d !== 1 ? "s" : ""} left</span>;
  if (d <= 7)  return <span style={badgeStyle("#fef3c7", "#92400e", "#fde68a")}>{d} days left</span>;
  if (d <= 14) return <span style={badgeStyle("#fef3c7", "#78350f", "#fde68a")}>{d} days left</span>;
  return <span style={badgeStyle("#dcfce7", "#166534", "#bbf7d0")}>{d} days left</span>;
}

// Shows a small email-sent chip when the item's lastNotifiedDate is today
function EmailSentChip({ lastNotifiedDate }) {
  if (!lastNotifiedDate) return null;
  const todayISO = new Date().toISOString().split("T")[0];
  const sentToday = lastNotifiedDate === todayISO;
  return (
    <span
      title={sentToday ? "Email reminder sent today" : `Last email: ${lastNotifiedDate}`}
      style={{
        display: "inline-flex", alignItems: "center", gap: 3,
        fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 99,
        background: sentToday ? "rgba(16,185,129,0.1)" : "rgba(148,163,184,0.12)",
        color:      sentToday ? "#059669"              : "#94a3b8",
        border:     `1px solid ${sentToday ? "rgba(16,185,129,0.25)" : "rgba(148,163,184,0.2)"}`,
        cursor: "help",
      }}
    >
      ✉ {sentToday ? "Email sent today" : lastNotifiedDate}
    </span>
  );
}

// 3-day warning banner shown at the top when items are within 3 days
function UpcomingBanner({ items }) {
  const urgent = items.filter(i => {
    if (i.status !== "active") return false;
    const d = daysUntil(i.renewalDate);
    return d >= 0 && d <= 3;
  });
  const overdue = items.filter(i => i.status === "active" && daysUntil(i.renewalDate) < 0);

  if (urgent.length === 0 && overdue.length === 0) return null;

  return (
    <div style={{
      background: "linear-gradient(135deg, #fef2f2, #fff7ed)",
      border: "1px solid #fecaca",
      borderRadius: 12,
      padding: "14px 20px",
      marginBottom: 18,
      display: "flex",
      alignItems: "flex-start",
      gap: 14,
    }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>🔔</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: "#991b1b", marginBottom: 4 }}>
          Renewal Alerts — Email reminders sent 3 days before due date
        </div>
        {overdue.length > 0 && (
          <div style={{ fontSize: 12.5, color: "#b91c1c", marginBottom: 3 }}>
            🚨 <strong>{overdue.length}</strong> item{overdue.length !== 1 ? "s" : ""} overdue:{" "}
            {overdue.map(i => i.name).join(", ")}
          </div>
        )}
        {urgent.length > 0 && (
          <div style={{ fontSize: 12.5, color: "#92400e" }}>
            ⏰ <strong>{urgent.length}</strong> item{urgent.length !== 1 ? "s" : ""} due within 3 days:{" "}
            {urgent.map(i => `${i.name} (${daysUntil(i.renewalDate)}d)`).join(", ")}
          </div>
        )}
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
          Senior supervisors receive an automated email reminder at 08:00 when items reach the 3-day window.
        </div>
      </div>
    </div>
  );
}

const emptyForm = { name: "", vendor: "", category: "", renewalDate: "", renewalCycle: "yearly", cost: "", notes: "", status: "active" };

export default function ThirdPartyItemsPage() {
  const { isSenior } = useAuth();

  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState(null);
  const [checkingNow, setCheckingNow] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  const [renewTarget, setRenewTarget] = useState(null);
  const [renewing, setRenewing]       = useState(false);

  const load = () => {
    setLoading(true);
    thirdPartyItemAPI.getAll()
      .then(d => setItems(d.items || []))
      .catch(e => setToast({ msg: e.message, type: "error" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isSenior) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSenior]);

  if (!isSenior) {
    return (
      <div className="animate-fadeUp">
        <div className="empty-state">
          <div className="empty-icon">🔒</div>
          <h3>Access Denied</h3>
          <p>Only senior supervisors can access third-party renewals.</p>
        </div>
      </div>
    );
  }

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name, vendor: item.vendor, category: item.category || "",
      renewalDate: item.renewalDate, renewalCycle: item.renewalCycle,
      cost: item.cost || "", notes: item.notes || "", status: item.status,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.vendor || !form.renewalDate) {
      setToast({ msg: "Name, vendor and renewal date are required.", type: "error" }); return;
    }
    setSaving(true);
    try {
      if (editItem) {
        const d = await thirdPartyItemAPI.update(editItem._id, form);
        setItems(list => list.map(i => i._id === editItem._id ? d.item : i));
        setToast({ msg: "Renewal item updated!", type: "success" });
      } else {
        const d = await thirdPartyItemAPI.create(form);
        setItems(list => [d.item, ...list]);
        setToast({ msg: "Renewal item added!", type: "success" });
      }
      setShowModal(false);
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await thirdPartyItemAPI.delete(deleteTarget._id);
      setItems(list => list.filter(i => i._id !== deleteTarget._id));
      setToast({ msg: "Renewal item removed.", type: "success" });
      setDeleteTarget(null);
      window.dispatchEvent(new CustomEvent("renewal-notifications-changed"));
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
    setDeleting(false);
  };

  const handleMarkRenewed = async () => {
    if (!renewTarget) return;
    setRenewing(true);
    try {
      const d = await thirdPartyItemAPI.markRenewed(renewTarget._id);
      setItems(list => list.map(i => i._id === renewTarget._id ? d.item : i));
      setToast({
        msg: d.item.renewalCycle === "one-time"
          ? `${d.item.name} marked as completed.`
          : `${d.item.name} renewed — next renewal ${d.item.renewalDate}.`,
        type: "success",
      });
      setRenewTarget(null);
      window.dispatchEvent(new CustomEvent("renewal-notifications-changed"));
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
    setRenewing(false);
  };

  const handleCheckNow = async () => {
    setCheckingNow(true);
    try {
      const d = await thirdPartyItemAPI.checkRemindersNow();
      setToast({ msg: d.message, type: "success" });
      load(); // refresh to show updated lastNotifiedDate
      window.dispatchEvent(new CustomEvent("renewal-notifications-changed"));
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
    setCheckingNow(false);
  };

  const sorted = [...items].sort((a, b) => a.renewalDate.localeCompare(b.renewalDate));

  return (
    <div className="animate-fadeUp">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {showModal && (
        <Modal onBgClick={() => setShowModal(false)}>
          <div style={{ width: 460 }}>
            <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 18, color: "#0a2e1a", marginBottom: 6 }}>
              {editItem ? "✏️ Edit Renewal Item" : "➕ Add Renewal Item"}
            </div>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>Third-party subscriptions, licenses or contracts to track.</p>
            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label">Item Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Microsoft 365 License" />
              </div>
              <div className="form-group">
                <label className="form-label">Vendor *</label>
                <input className="form-input" value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} placeholder="e.g. Microsoft" />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Software, Domain, Insurance…" />
              </div>
              <div className="form-group">
                <label className="form-label">Renewal Date *</label>
                <input type="date" className="form-input" value={form.renewalDate} onChange={e => setForm(f => ({ ...f, renewalDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Renewal Cycle</label>
                <select className="form-select" value={form.renewalCycle} onChange={e => setForm(f => ({ ...f, renewalCycle: e.target.value }))}>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Cost</label>
                <input type="number" className="form-input" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expired">Expired</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="form-group full">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : editItem ? "Save Changes" : "Add Item"}</button>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal onBgClick={() => setDeleteTarget(null)}>
          <div style={{ width: 360 }}>
            <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 18, color: "#dc2626", marginBottom: 6 }}>🗑 Remove Item</div>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>Remove <strong>{deleteTarget.name}</strong>? This cannot be undone.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "#ef4444", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                onClick={handleDelete} disabled={deleting}>{deleting ? "Removing…" : "Remove"}</button>
            </div>
          </div>
        </Modal>
      )}

      {renewTarget && (
        <Modal onBgClick={() => setRenewTarget(null)}>
          <div style={{ width: 380 }}>
            <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 18, color: "#166534", marginBottom: 6 }}>✅ Mark as Renewed</div>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
              Confirm that <strong>{renewTarget.name}</strong> has been renewed.
            </p>
            <p style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 20 }}>
              {renewTarget.renewalCycle === "one-time"
                ? "This is a one-time item — it will be marked Completed and reminders will stop."
                : `This will move the renewal date forward one ${renewTarget.renewalCycle.replace("ly", "")} cycle and clear the current reminder.`}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setRenewTarget(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleMarkRenewed} disabled={renewing}>
                {renewing ? "Saving…" : "Confirm Renewed"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Upcoming alerts banner ───────────────────────────────────────── */}
      <UpcomingBanner items={items} />

      {/* ── Main card ────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">🔔 Third-Party Renewals</div>
            <div style={{ fontSize: 11.5, color: "var(--gray-400)", marginTop: 2 }}>
              📧 Email reminders sent automatically 3 days before each renewal date
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleCheckNow}
              disabled={checkingNow}
              style={{
                fontSize: 11.5, fontWeight: 600, padding: "8px 14px", borderRadius: 8,
                border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#166534",
                cursor: checkingNow ? "default" : "pointer", fontFamily: "inherit",
              }}
              title="Manually run the renewal check and send any pending emails now"
            >
              {checkingNow ? "⏳ Checking…" : "🔄 Check & Send Reminders Now"}
            </button>
            <button className="btn btn-primary" onClick={openAdd}>+ Add Renewal Item</button>
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: 40, textAlign: "center" }}><div className="spinner" /></div>
          ) : sorted.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No renewal items yet</h3>
              <p>Click "Add Renewal Item" to track your first subscription or contract.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th><th>Vendor</th><th>Category</th><th>Renewal Date</th>
                  <th>Cycle</th><th>Cost</th><th>Status</th><th>Email</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(item => (
                  <tr key={item._id} style={{
                    background: item.status === "active" && daysUntil(item.renewalDate) <= 3
                      ? "rgba(254,242,242,0.4)"
                      : undefined,
                  }}>
                    <td className="text-sm text-bold">{item.name}</td>
                    <td className="text-sm">{item.vendor}</td>
                    <td>{item.category ? <span className="tag">{item.category}</span> : "—"}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span className="text-sm">{item.renewalDate}</span>
                        <RenewalBadge dateStr={item.renewalDate} status={item.status} />
                      </div>
                    </td>
                    <td className="text-sm" style={{ textTransform: "capitalize" }}>{item.renewalCycle}</td>
                    <td className="text-sm">{item.cost ? `Rs. ${item.cost}` : "—"}</td>
                    <td className="text-sm" style={{ textTransform: "capitalize" }}>{item.status}</td>
                    <td>
                      <EmailSentChip lastNotifiedDate={item.lastNotifiedDate} />
                    </td>
                    <td>
                      <div className="flex gap-6">
                        {item.status === "active" && (
                          <button
                            className="btn btn-sm"
                            style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }}
                            onClick={() => setRenewTarget(item)}
                            title="Mark as renewed"
                          >
                            ✅ Renew
                          </button>
                        )}
                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(item)}>✏️</button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => setDeleteTarget(item)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}