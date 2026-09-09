import { useState, useEffect, useCallback } from "react";
import { renewalNotificationAPI } from "../../utils/api";
import useSocket from "../../hooks/useSocket";

export default function RenewalNotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const { onMessage } = useSocket();

  const load = useCallback(() => {
    renewalNotificationAPI.getAll().then(d => setNotifications(d.notifications || [])).catch(() => {});
  }, []);

  // Initial load
  useEffect(() => { load(); }, [load]);

  // Real-time push from the socket (fast path when it works)
  useEffect(() => {
    const off = onMessage("new_renewal_notification", () => {
      // Re-fetch rather than trusting the raw socket payload shape —
      // keeps this in sync with server-side filtering (e.g. orphaned items).
      load();
    });
    return off;
  }, [onMessage, load]);

  // ── NEW: fallback poll every 30s, in case the socket missed an update
  // (e.g. it reconnected, or "Check Reminders Now" fired while this tab
  // wasn't the active socket owner) ─────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  // ── NEW: listen for a same-tab custom event so actions elsewhere in the
  // app (like clicking "Check Reminders Now" on the Renewals page, or
  // deleting/renewing an item) can force an immediate refresh here without
  // waiting for the socket or the 30s poll ────────────────────────────────
  useEffect(() => {
    const handler = () => load();
    window.addEventListener("renewal-notifications-changed", handler);
    return () => window.removeEventListener("renewal-notifications-changed", handler);
  }, [load]);

  // Refresh whenever the dropdown is opened, so it's always current
  const toggleOpen = () => {
    setOpen(o => {
      if (!o) load();
      return !o;
    });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id) => {
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    try { await renewalNotificationAPI.markRead(id); } catch { load(); }
  };

  return (
    <div style={{ position: "relative" }}>
      <button onClick={toggleOpen} style={{ background: "none", border: "none", cursor: "pointer", position: "relative", fontSize: 18, lineHeight: 1 }}>
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -6, background: "#ef4444", color: "#fff",
            fontSize: 9, fontWeight: 700, borderRadius: 99, padding: "1px 5px", minWidth: 15, textAlign: "center",
          }}>{unreadCount}</span>
        )}
      </button>
      {open && (
        <div style={{
          position: "absolute", right: 0, top: 30, width: 320, background: "#fff",
          border: "1px solid #e5e7eb", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,.15)", zIndex: 300, maxHeight: 360, overflowY: "auto",
        }}>
          <div style={{ padding: "10px 14px", fontSize: 12, fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>🔔 Renewal Reminders</span>
            <button onClick={load} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#166534", fontWeight: 600 }}>↻ Refresh</button>
          </div>
          {notifications.length === 0 ? (
            <p style={{ padding: 16, fontSize: 12.5, color: "#9ca3af" }}>No reminders yet.</p>
          ) : notifications.map(n => (
            <div key={n._id} onClick={() => markAsRead(n._id)}
              style={{ padding: "10px 14px", borderBottom: "1px solid #f9fafb", cursor: "pointer", background: n.isRead ? "#fff" : "#fffbeb" }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#111" }}>{n.title}</div>
              <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 2 }}>{n.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}