
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { authAPI } from "../../utils/api";

import "../../styles/auth.css";

export default function ForcedChangePassword() {
  const { logout, setMustChangePassword, user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error,           setError]           = useState("");
  const [loading,         setLoading]         = useState(false);
  const [done,            setDone]            = useState(false);

  const handle = async () => {
    setError("");
    if (!currentPassword)                    { setError("Please enter your current (reset) password."); return; }
    if (!newPassword || newPassword.length < 6) { setError("New password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword)     { setError("Passwords do not match."); return; }
    if (newPassword === currentPassword)     { setError("New password must be different from the current one."); return; }

    setLoading(true);
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      setDone(true);
      setTimeout(() => setMustChangePassword(false), 1500);
    } catch (e) {
      setError(e.message || "Failed. Please check your current password and try again.");
    }
    setLoading(false);
  };

  return (
    <div className="egi-landing-wrapper">
      <div className="egi-landing-foliage-left" />
      <div className="egi-landing-foliage-right" />

      {/* Top Header */}
      <header className="egi-landing-header">
        <div className="egi-landing-brand">
          <svg width="38" height="38" viewBox="0 0 48 48" fill="none" className="egi-landing-brand-svg">
            <path d="M16 38C12 28 18 16 36 10C36 24 28 36 16 38Z" fill="#0f6240"/>
            <path d="M16 38C9 30 9 22 14 17C20 20 20 28 16 38Z" fill="#16a34a"/>
            <path d="M16 38C18 30 24 21 36 10" stroke="#a7f3d0" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          <div className="egi-landing-brand-text">
            <span className="egi-landing-brand-title">ECO GREEN</span>
            <span className="egi-landing-brand-sub">INTERNATIONAL</span>
          </div>
        </div>
        <div className="egi-landing-tagline">
          Green Solutions &nbsp;|&nbsp; Sustainable Future
        </div>
      </header>

      {/* Main Content Card Area */}
      <main className="egi-landing-content">
        <div className="auth-card auth-card--forced">
          <div className="auth-card__header">
            <div className="egi-portal-icon-wrap" style={{ background: "#ffedd5", color: "#c2410c", margin: "0 auto 16px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h2 className="auth-card__title">Password Reset Required</h2>
            <p className="auth-card__sub">
              Your password was reset by a supervisor.
              Please enter your temporary password and choose a new one before continuing.
            </p>
          </div>

          {done && (
            <div className="auth-alert auth-alert--success">
              ✓ Password changed! Redirecting…
            </div>
          )}

          {error && !done && (
            <div className="auth-alert auth-alert--error">⚠️ {error}</div>
          )}

          {user && (
            <div className="auth-user-badge">
              <span className="auth-user-badge__avatar" style={{ background: user.avatarColor || "#10b981" }}>
                {user.avatar || user.name?.[0] || "U"}
              </span>
              <span className="auth-user-badge__name">{user.name}</span>
              <span className="auth-user-badge__role">{user.role}</span>
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label">Current (Temporary) Password</label>
            <input
              type="password"
              className="auth-input auth-input--forced"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Password set by supervisor"
              autoComplete="current-password"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">New Password</label>
            <input
              type="password"
              className="auth-input auth-input--forced"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field" style={{ marginBottom: 20 }}>
            <label className="auth-label">Confirm New Password</label>
            <input
              type="password"
              className="auth-input auth-input--forced"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              onKeyDown={e => e.key === "Enter" && handle()}
              autoComplete="new-password"
            />
          </div>

          <button
            className="auth-btn auth-btn--forced"
            onClick={handle}
            disabled={loading || done}
          >
            {loading ? "Saving…" : "Set New Password & Continue →"}
          </button>

          <button
            className="auth-btn auth-btn--back"
            onClick={logout}
          >
            Sign Out Instead
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="egi-landing-footer">
        <div className="egi-landing-footer-left">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>Secure Internal Portal</span>
        </div>
        <div className="egi-landing-footer-center">
          © 2026 Eco Green International Pvt Ltd
        </div>
        <div className="egi-landing-footer-right">
          <span>Privacy Policy</span>
          <span>&nbsp;|&nbsp;</span>
          <span>Support</span>
        </div>
      </footer>
    </div>
  );
}