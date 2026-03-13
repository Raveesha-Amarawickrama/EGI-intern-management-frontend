
import { useState } from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { Sidebar, Topbar } from "./components/layout/index.jsx";
import { Spinner } from "./components/shared/index.jsx";
import InternLoginPage      from "./components/auth/InternLoginPage.jsx";
import SupervisorLoginPage  from "./components/auth/SupervisorLoginPage.jsx";
import ForcedChangePassword from "./components/auth/ForcedChangePassword.jsx";


import { InternDashboard, MyTasksPage, ProfilePage } from "./pages/intern/index.jsx";

import {
  SupervisorDashboard, AllTasksPage, InternsPage,
  ProjectsPage, MyTasksPageSupervisor,
} from "./pages/supervisor/index.jsx";




function LoginChoose({ setView }) {
  return (
    <div className="auth-bg">
      <div className="auth-blob auth-blob--top-right" />
      <div className="auth-blob auth-blob--bottom-left" />

      <div className="auth-logo-wrap">
        <div className="auth-company">Eco Green International</div>
        <div className="auth-tagline">Intern Training Programme 2025 / 2026</div>
      </div>

      <div style={{ display: "flex", gap: 20, zIndex: 1, flexWrap: "wrap", justifyContent: "center" }}>
        <div className="auth-choose-card auth-choose-card--intern" onClick={() => setView("intern")}>
          <div className="auth-choose-card__icon">👨‍💻</div>
          <h2 className="auth-choose-card__title">Intern</h2>
          <p className="auth-choose-card__desc">
            Access your internship tasks, track hours and view your progress.
          </p>
          <span className="auth-choose-card__cta auth-choose-card__cta--intern">Sign In →</span>
        </div>

        <div className="auth-choose-card auth-choose-card--supervisor" onClick={() => setView("supervisor")}>
          <div className="auth-choose-card__icon">👔</div>
          <h2 className="auth-choose-card__title auth-choose-card__title--supervisor">Supervisor</h2>
          <p className="auth-choose-card__desc">
            Manage interns, assign tasks and view performance reports.
          </p>
          <span className="auth-choose-card__cta auth-choose-card__cta--supervisor">Sign In →</span>
        </div>
      </div>

      <p className="auth-footer">© 2026 Eco Green International Pvt Ltd</p>
    </div>
  );
}


function LoginRouter() {
  const getInitialView = () => {
    const path = window.location.pathname;
    if (path === "/intern-login")     return "intern";
    if (path === "/supervisor-login") return "supervisor";
    return "choose";
  };

  const [view, setView] = useState(getInitialView);

  const goTo = (v) => {
    const paths = { choose: "/", intern: "/intern-login", supervisor: "/supervisor-login" };
    window.history.pushState({}, "", paths[v] || "/");
    setView(v);
  };

  if (view === "intern")     return <InternLoginPage     onBack={() => goTo("choose")} />;
  if (view === "supervisor") return <SupervisorLoginPage onBack={() => goTo("choose")} />;
  return <LoginChoose setView={goTo} />;
}

function AppContent() {
  const { user, loading, mustChangePassword } = useAuth();
  const [page, setPage] = useState("dashboard");

  if (loading)            return <Spinner />;
  if (!user)              return <LoginRouter />;
  if (mustChangePassword) return <ForcedChangePassword />;

  const renderPage = () => {
    if (user.role === "intern") {
      if (page === "dashboard") return <InternDashboard />;
      if (page === "mytasks")   return <MyTasksPage />;
      if (page === "profile")   return <ProfilePage />;
   
    }
    if (user.role === "supervisor") {
      if (page === "dashboard") return <SupervisorDashboard />;
      if (page === "tasks")     return <AllTasksPage />;
      if (page === "mytasks")   return <MyTasksPageSupervisor />;
      if (page === "interns")   return <InternsPage />;
      if (page === "projects")  return <ProjectsPage />;
  
      if (page === "profile")   return <ProfilePage />;
    }
    return <div style={{ padding: 40 }}>Page not found.</div>;
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--gray-50)" }}>
      <Sidebar page={page} setPage={setPage} />
      <div style={{ marginLeft: "var(--sidebar-w)", flex: 1, display: "flex", flexDirection: "column" }}>
        <Topbar page={page} />
        <main style={{ flex: 1, padding: "28px 32px", maxWidth: 1400, width: "100%" }}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}