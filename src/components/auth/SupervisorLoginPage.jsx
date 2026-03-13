
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { authAPI, setToken } from "../../utils/api";
import logoImg from "../../assets/logo.png";
import "../../styles/auth.css";

export default function SupervisorLoginPage({ onBack }) {
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
    try { await login(username, password, "supervisor"); }
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
    
      const res = await authAPI.login({ username, password: cpCurrent, role: "supervisor" });
      setToken(res.token);
  
      await authAPI.changePassword({ currentPassword: cpCurrent, newPassword: cpNew });
      setCpSuccess("✅ Password changed! You can now sign in with your new password.");
      setCpCurrent(""); setCpNew(""); setCpConfirm("");
      setTimeout(() => { setCpSuccess(""); setView("login"); }, 2200);
    } catch (e) {
      setError(e.message || "Failed. Check your username and current password.");
    }
    setLoading(false);
  };

  return (
    <div className="auth-bg auth-bg--supervisor">
      <div className="auth-blob auth-blob--top-right auth-blob--gold" />
      <div className="auth-blob auth-blob--bottom-left auth-blob--gold-dim" />

      <div className="auth-logo-wrap">
        <img src={logoImg} alt="EGI" className="auth-logo" />
        <div className="auth-company">Eco Green International</div>
        <div className="auth-tagline">Management Portal</div>
      </div>

      <div className="auth-card auth-card--supervisor">

        {view === "login" && (
          <>
            <div className="auth-card__header">
              <div className="auth-card__icon">👔</div>
              <h2 className="auth-card__title auth-card__title--supervisor">Supervisor Login</h2>
              <p className="auth-card__sub">Access the management dashboard</p>
            </div>

            {error && <div className="auth-alert auth-alert--error">{error}</div>}

            <div className="auth-field">
              <label className="auth-label">Username</label>
              <input className="auth-input auth-input--supervisor" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="e.g. prasanna" onKeyDown={e => e.key === "Enter" && handleLogin()} autoComplete="username" />
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input type="password" className="auth-input auth-input--supervisor" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password" onKeyDown={e => e.key === "Enter" && handleLogin()} autoComplete="current-password" />
            </div>

            <div className="auth-link-row">
              <button className="auth-text-btn auth-text-btn--gold" onClick={() => { setError(""); setView("change-password"); }}>
                🔑 Change / Forgot Password?
              </button>
            </div>

            <button className="auth-btn auth-btn--supervisor" onClick={handleLogin} disabled={loading}>
              {loading ? "Signing in…" : "Sign In as Supervisor →"}
            </button>
            <button className="auth-btn auth-btn--back" onClick={onBack}>← Back</button>
          </>
        )}

        {view === "change-password" && (
          <>
            <div className="auth-card__header">
              <div className="auth-card__icon">🔑</div>
              <h2 className="auth-card__title auth-card__title--supervisor">Change Password</h2>
              <p className="auth-card__sub">Enter your username & current password, then choose a new one</p>
            </div>

            {error     && <div className="auth-alert auth-alert--error"> {error}</div>}
            {cpSuccess && <div className="auth-alert auth-alert--success">{cpSuccess}</div>}

            <div className="auth-field">
              <label className="auth-label">Username</label>
              <input className="auth-input auth-input--supervisor" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="e.g. prasanna" autoComplete="username" />
            </div>
            <div className="auth-field">
              <label className="auth-label">Current Password</label>
              <input type="password" className="auth-input auth-input--supervisor" value={cpCurrent} onChange={e => setCpCurrent(e.target.value)}
                placeholder="Your current password" autoComplete="current-password" />
            </div>
            <div className="auth-field">
              <label className="auth-label">New Password</label>
              <input type="password" className="auth-input auth-input--supervisor" value={cpNew} onChange={e => setCpNew(e.target.value)}
                placeholder="Min. 6 characters" autoComplete="new-password" />
            </div>
            <div className="auth-field" style={{ marginBottom: 20 }}>
              <label className="auth-label">Confirm New Password</label>
              <input type="password" className="auth-input auth-input--supervisor" value={cpConfirm} onChange={e => setCpConfirm(e.target.value)}
                placeholder="Repeat new password" onKeyDown={e => e.key === "Enter" && handleChangePassword()} autoComplete="new-password" />
            </div>

            <button className="auth-btn auth-btn--supervisor" onClick={handleChangePassword} disabled={loading}>
              {loading ? "Saving…" : "Update Password"}
            </button>
            <button className="auth-btn auth-btn--back" onClick={() => { setError(""); setCpSuccess(""); setView("login"); }}>
              ← Back to Login
            </button>
          </>
        )}
      </div>

      <p className="auth-footer">© 2026 Eco Green International Pvt Ltd</p>
    </div>
  );
}