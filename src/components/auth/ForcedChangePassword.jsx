
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { authAPI } from "../../utils/api";
import logoImg from "../../assets/logo.png";
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
    <div className="auth-bg auth-bg--forced">
      <div className="auth-blob auth-blob--top-right auth-blob--amber" />
      <div className="auth-blob auth-blob--bottom-left auth-blob--amber-dim" />

      <div className="auth-logo-wrap">
        <img src={logoImg} alt="EGI" className="auth-logo" />
        <div className="auth-company">Eco Green International</div>
      </div>

      <div className="auth-card auth-card--forced">
        <div className="auth-card__header">
          <div className="auth-card__icon">🔐</div>
          <h2 className="auth-card__title auth-card__title--forced">Password Reset Required</h2>
          <p className="auth-card__sub">
            Your password was reset by a supervisor.
            Please enter your temporary password and choose a new one before continuing.
          </p>
        </div>

        {done && (
          <div className="auth-alert auth-alert--success">
         Password changed! Redirecting…
          </div>
        )}

        {error && !done && (
          <div className="auth-alert auth-alert--error"> {error}</div>
        )}

        {user && (
          <div className="auth-user-badge">
            <span className="auth-user-badge__avatar" style={{ background: user.avatarColor || "#1a6640" }}>
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
          {loading ? "Saving…" : "Set New Password"}
        </button>

        <button
          className="auth-btn auth-btn--back"
          onClick={logout}
        >
          Sign Out Instead
        </button>
      </div>

      <p className="auth-footer">© 2026 Eco Green International Pvt Ltd</p>
    </div>
  );
}