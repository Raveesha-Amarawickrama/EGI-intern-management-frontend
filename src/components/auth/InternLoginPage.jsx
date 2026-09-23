
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { authAPI, setToken } from "../../utils/api";

import "../../styles/auth.css";

export default function InternLoginPage({ onBack }) {
  const { login }               = useAuth();
  const [view,     setView]     = useState("login"); 
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

 
  const [cpCurrent, setCpCurrent] = useState("");
  const [cpNew,     setCpNew]     = useState("");
  const [cpConfirm, setCpConfirm] = useState("");
  const [cpSuccess, setCpSuccess] = useState("");

  const handleLogin = async () => {
    if (!username || !password) { setError("Please enter username and password."); return; }
    setLoading(true); setError("");
    try { await login(username, password, "intern"); }
    catch (e) { setError(e.message || "Invalid credentials."); setLoading(false); }
  };

  const handleChangePassword = async () => {
    setError(""); setCpSuccess("");
    if (!username)                  { setError("Please enter your username above."); return; }
    if (!cpCurrent)                 { setError("Please enter your current password."); return; }
    if (!cpNew || cpNew.length < 6) { setError("New password must be at least 6 characters."); return; }
    if (cpNew !== cpConfirm)        { setError("Passwords do not match."); return; }
    if (cpNew === cpCurrent)        { setError("New password must differ from the current one."); return; }

    setLoading(true);
    try {
  
      const res = await authAPI.login({ username, password: cpCurrent, role: "intern" });
      setToken(res.token); 
      await authAPI.changePassword({ currentPassword: cpCurrent, newPassword: cpNew });
      setCpSuccess(" Password changed! You can now sign in with your new password.");
      setCpCurrent(""); setCpNew(""); setCpConfirm("");
      setTimeout(() => { setCpSuccess(""); setView("login"); }, 2200);
    } catch (e) {
      setError(e.message || "Failed. Check your username and current password.");
    }
    setLoading(false);
  };

  return (
    <div className="egi-landing-wrapper">
      <div className="egi-landing-foliage-left" />
      <div className="egi-landing-foliage-right" />

      {/* Modern Top Header */}
      <header className="egi-landing-header">
        <div className="egi-landing-brand" onClick={onBack} style={{ cursor: onBack ? "pointer" : "default" }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="egi-landing-tagline">
            Green Solutions &nbsp;|&nbsp; Sustainable Future
          </div>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
                color: "#0a5639", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
              }}
            >
              ← Portals
            </button>
          )}
        </div>
      </header>

      {/* Main Login Card Area */}
      <main className="egi-landing-content">
        <div className="auth-card auth-card--intern">
          {view === "login" && (
            <>
              <div className="auth-card__header">
                <div className="egi-portal-icon-wrap egi-portal-icon-wrap--intern" style={{ margin: "0 auto 16px" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                </div>
                <h2 className="auth-card__title">Intern Login</h2>
                <p className="auth-card__sub">Sign in to your internship portal</p>
              </div>

              {error && <div className="auth-alert auth-alert--error">{error}</div>}

              <div className="auth-field">
                <label className="auth-label">Username</label>
                <input className="auth-input" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. Kumara" onKeyDown={e => e.key === "Enter" && handleLogin()} autoComplete="username" />
              </div>

              <div className="auth-field">
                <label className="auth-label">Password</label>
                <input type="password" className="auth-input" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password" onKeyDown={e => e.key === "Enter" && handleLogin()} autoComplete="current-password" />
              </div>

              <div className="auth-link-row">
                <button className="auth-text-btn" onClick={() => { setError(""); setView("change-password"); }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="7.5" cy="15.5" r="5.5"/>
                    <path d="m21 2-9.6 9.6"/>
                    <path d="m15.5 7.5 3 3L22 7l-3-3"/>
                  </svg>
                  <span>Change / Forgot Password?</span>
                </button>
              </div>

              <button className="auth-btn auth-btn--intern" onClick={handleLogin} disabled={loading}>
                {loading ? "Signing in…" : "Sign In as Intern →"}
              </button>
              {onBack && (
                <button className="auth-btn auth-btn--back" onClick={onBack}>
                  ← Back to Portals
                </button>
              )}
            </>
          )}

          {view === "change-password" && (
            <>
              <div className="auth-card__header">
                <div className="egi-portal-icon-wrap" style={{ background: "#e0f2fe", color: "#0369a1", margin: "0 auto 16px" }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="7.5" cy="15.5" r="5.5"/>
                    <path d="m21 2-9.6 9.6"/>
                    <path d="m15.5 7.5 3 3L22 7l-3-3"/>
                  </svg>
                </div>
                <h2 className="auth-card__title">Change Password</h2>
                <p className="auth-card__sub">Enter your username & current password, then choose a new one</p>
              </div>

              {error     && <div className="auth-alert auth-alert--error">⚠️ {error}</div>}
              {cpSuccess && <div className="auth-alert auth-alert--success">{cpSuccess}</div>}

              <div className="auth-field">
                <label className="auth-label">Username</label>
                <input className="auth-input" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. Kumara" autoComplete="username" />
              </div>
              <div className="auth-field">
                <label className="auth-label">Current Password</label>
                <input type="password" className="auth-input" value={cpCurrent} onChange={e => setCpCurrent(e.target.value)}
                  placeholder="Your current password" autoComplete="current-password" />
              </div>
              <div className="auth-field">
                <label className="auth-label">New Password</label>
                <input type="password" className="auth-input" value={cpNew} onChange={e => setCpNew(e.target.value)}
                  placeholder="Min. 6 characters" autoComplete="new-password" />
              </div>
              <div className="auth-field" style={{ marginBottom: 20 }}>
                <label className="auth-label">Confirm New Password</label>
                <input type="password" className="auth-input" value={cpConfirm} onChange={e => setCpConfirm(e.target.value)}
                  placeholder="Repeat new password" onKeyDown={e => e.key === "Enter" && handleChangePassword()} autoComplete="new-password" />
              </div>

              <button className="auth-btn auth-btn--intern" onClick={handleChangePassword} disabled={loading}>
                {loading ? "Saving…" : "Update Password"}
              </button>
              <button className="auth-btn auth-btn--back" onClick={() => { setError(""); setCpSuccess(""); setView("login"); }}>
                ← Back to Login
              </button>
            </>
          )}
        </div>
      </main>

      {/* Modern Footer Bar */}
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