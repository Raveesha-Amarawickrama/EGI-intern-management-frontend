import { useState } from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { Sidebar, Topbar } from "./components/layout/index.jsx";
import { Spinner } from "./components/shared/index.jsx";

import InternLoginPage from "./components/auth/InternLoginPage.jsx";
import SupervisorLoginPage from "./components/auth/SupervisorLoginPage.jsx";
import ForcedChangePassword from "./components/auth/ForcedChangePassword.jsx";


import { InternDashboard, MyTasksPage } from "./pages/intern/index.jsx";
import ProfilePage from "./pages/shared/ProfilePage.jsx";

import InternSchedulePage from "./pages/intern/Schedule.jsx";

import DiaryPage from "./pages/shared/DiaryPage.jsx"

import {
  SupervisorDashboard,
  AllTasksPage,
  InternsPage,
  ProjectsPage,
  MyTasksPageSupervisor,
} from "./pages/supervisor/index.jsx";
import SupervisorsPage from "./pages/supervisor/SupervisorsPage.jsx";

import SupervisorSchedulePage from "./pages/supervisor/Schedule.jsx";

// Shared Pages
import SocialPage from "./pages/shared/SocialPage.jsx";
import FilesPage from "./pages/shared/FilesPage.jsx";
import ThirdPartyItemsPage from "./pages/supervisor/ThirdPartyItemsPage.jsx";


function LoginChoose({ setView }) {
  return (
    <div className="egi-landing-wrapper">
      {/* Modern Top Header */}
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

      {/* Main Hero & Portal Cards */}
      <main className="egi-landing-content">
        <div className="egi-hero-title-box">
          <div className="egi-hero-accent-bar" />
          <h1 className="egi-hero-heading">Eco Green International</h1>
          <h2 className="egi-hero-subtitle">Intern Management Portal</h2>
          <p className="egi-hero-desc">
            Manage internship activities, tasks, work logs and performance.
          </p>
        </div>

        <div className="egi-portal-cards-row">
          {/* Intern Portal Card */}
          <div className="egi-portal-card egi-portal-card--intern" onClick={() => setView("intern")}>
            <div className="egi-portal-icon-wrap egi-portal-icon-wrap--intern">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <h3 className="egi-portal-card-title">Intern Portal</h3>
            <p className="egi-portal-card-desc">
              View your assigned tasks, submit work logs and track your progress.
            </p>
            <button className="egi-portal-btn egi-portal-btn--intern">
              Continue as Intern →
            </button>
            <svg className="egi-portal-leaf-watermark" viewBox="0 0 120 120" fill="none">
              <path d="M42 115C32 80 48 45 98 25C98 65 78 100 42 115Z" fill="#a7f3d0" fillOpacity="0.5"/>
              <path d="M42 115C22 90 22 65 37 50C52 60 52 85 42 115Z" fill="#6ee7b7" fillOpacity="0.4"/>
            </svg>
          </div>

          {/* Supervisor Portal Card */}
          <div className="egi-portal-card egi-portal-card--supervisor" onClick={() => setView("supervisor")}>
            <div className="egi-portal-icon-wrap egi-portal-icon-wrap--supervisor">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <circle cx="19" cy="11" r="2"/>
                <path d="M19 8v1"/>
                <path d="M19 13v1"/>
                <path d="M16.5 9.5l.8.5"/>
                <path d="M20.7 12l.8.5"/>
                <path d="M16.5 12.5l.8-.5"/>
                <path d="M20.7 10l.8-.5"/>
              </svg>
            </div>
            <h3 className="egi-portal-card-title">Supervisor Portal</h3>
            <p className="egi-portal-card-desc">
              Manage interns, assign tasks and view performance reports.
            </p>
            <button className="egi-portal-btn egi-portal-btn--supervisor">
              Continue as Supervisor →
            </button>
            <svg className="egi-portal-leaf-watermark" viewBox="0 0 120 120" fill="none">
              <path d="M42 115C32 80 48 45 98 25C98 65 78 100 42 115Z" fill="#fde68a" fillOpacity="0.55"/>
              <path d="M42 115C22 90 22 65 37 50C52 60 52 85 42 115Z" fill="#fcd34d" fillOpacity="0.4"/>
            </svg>
          </div>
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

function LoginRouter() {
  const getInitialView = () => {
    const path = window.location.pathname;
    if (path === "/intern-login") return "intern";
    if (path === "/supervisor-login") return "supervisor";
    return "choose";
  };

  const [view, setView] = useState(getInitialView);

  const goTo = (v) => {
    const paths = { choose: "/", intern: "/intern-login", supervisor: "/supervisor-login" };
    window.history.pushState({}, "", paths[v] || "/");
    setView(v);
  };

  if (view === "intern") return <InternLoginPage onBack={() => goTo("choose")} />;
  if (view === "supervisor") return <SupervisorLoginPage onBack={() => goTo("choose")} />;
  return <LoginChoose setView={goTo} />;
}

function AppContent() {
  const { user, loading, mustChangePassword, isSenior } = useAuth();
  const [page, setPage] = useState("dashboard");

  if (loading) return <Spinner />;
  if (!user) return <LoginRouter />;
  if (mustChangePassword) return <ForcedChangePassword />;

  const renderPage = () => {
    if (user.role === "intern") {
      switch (page) {
         case "diary": return <DiaryPage />;
        case "dashboard": return <InternDashboard setPage={setPage} />;
        case "mytasks":   return <MyTasksPage />;
        case "profile":   return <ProfilePage />;
       
        case "schedule":  return <InternSchedulePage />;
        case "social":    return <SocialPage />;
        case "files":     return <FilesPage />;
        default:          return <div style={{ padding: 40 }}>Page not found</div>;
      }
    }

    if (user.role === "supervisor") {
      switch (page) {
         case "diary": return <DiaryPage />;
        case "dashboard":   return <SupervisorDashboard setPage={setPage} />;
        case "tasks":       return <AllTasksPage />;
        case "mytasks":     return <MyTasksPageSupervisor />;
        case "profile":     return <ProfilePage />;   
        case "interns":     return <InternsPage />;
        case "projects":    return <ProjectsPage />;
       
        case "schedule":    return <SupervisorSchedulePage />;
        case "social":      return <SocialPage />;
        case "content":     return <SocialPage view="calendar" />;
        case "files":       return <FilesPage />;
       case "renewals":
  return isSenior ? <ThirdPartyItemsPage /> : <div>Access Denied</div>;
        case "supervisors": 
          return isSenior ? <SupervisorsPage /> : <div>Access Denied</div>;
        default: 
          return <div style={{ padding: 40 }}>Page not found</div>;
      }
    }

    return <div style={{ padding: 40 }}>Page not found.</div>;
  };

  return (
    <div style={{ 
      display: "flex", 
      minHeight: "100vh", 
      background: "var(--gray-50)",
      overflow: "hidden"
    }}>
      {/* Sidebar */}
      <Sidebar page={page} setPage={setPage} />

      {/* Main Content */}
      <div style={{ 
        marginLeft: "var(--sidebar-w)", 
        flex: 1, 
        display: "flex", 
        flexDirection: "column",
        minHeight: "100vh"
      }}>
        <Topbar page={page} />

        <main style={{ 
          flex: 1, 
          padding: "28px 32px", 
          overflow: "auto",
          maxWidth: "1400px",
          width: "100%"
        }}>
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