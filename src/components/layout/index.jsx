
import { Logo, Avatar } from "../shared/index.jsx";
import { useAuth } from "../../hooks/useAuth";


const INTERN_NAV = [
  { key:"dashboard", icon:"🏠", label:"Dashboard" },
  { key:"mytasks",   icon:"✅", label:"My Tasks"  },
  { key:"profile",   icon:"👤", label:"My Profile"},
];

const SUPERVISOR_NAV_SENIOR = [
  { key:"dashboard", icon:"🏠", label:"Dashboard"  },
  { key:"tasks",     icon:"📋", label:"All Tasks"  },
  { key:"mytasks",   icon:"✅", label:"My Tasks"   },
  { key:"interns",   icon:"👥", label:"Interns"    },
  { key:"projects",  icon:"🗂️", label:"Projects"   },
];

const SUPERVISOR_NAV_JUNIOR = [
  { key:"dashboard", icon:"🏠", label:"Dashboard"  },
  { key:"tasks",     icon:"📋", label:"All Tasks"  },
  { key:"mytasks",   icon:"✅", label:"My Tasks"   },
  { key:"interns",   icon:"👥", label:"Interns"    },
  { key:"projects",  icon:"🗂️", label:"Projects"   },
];

const META = {
  dashboard:{ title:"Dashboard",  sub:"Overview of EGI internship activity"          },
  mytasks:  { title:"My Tasks",   sub:"View, create and manage your own tasks"       },
  profile:  { title:"My Profile", sub:"Your personal information and stats"          },
  tasks:    { title:"All Tasks",  sub:"Manage and supervise all tasks"               },
  interns:  { title:"Interns",    sub:"Active intern profiles and performance"       },
  projects: { title:"Projects",   sub:"Project overview and progress tracking"       },
};

export function Sidebar({ page, setPage }) {
  const { user, logout, isSenior, isJunior } = useAuth();

  let nav;
  if (user.role === "intern") nav = INTERN_NAV;
  else if (isSenior)          nav = SUPERVISOR_NAV_SENIOR;
  else                        nav = SUPERVISOR_NAV_JUNIOR;

  const levelLabel = isSenior
    ? "Senior Supervisor"
    : isJunior
    ? "Junior Supervisor"
    : user?.role === "supervisor"
    ? "Supervisor"
    : "Intern";

  return (
    <nav style={{ width:"var(--sidebar-w)", background:"var(--green-900)", minHeight:"100vh", display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, zIndex:100, overflowY:"auto" }}>
      <div style={{ padding:"22px 18px 16px", display:"flex", alignItems:"center", gap:12, borderBottom:"1px solid rgba(255,255,255,.07)" }}>
        <Logo size={64}/>
        <div>
          <div style={{ fontFamily:"Syne,sans-serif", fontSize:12, fontWeight:800, color:"white", lineHeight:1.35 }}>Eco Green<br/>International</div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,.38)", marginTop:2, letterSpacing:".5px", textTransform:"uppercase" }}>
            {user.role === "intern" ? "Intern Portal" : "Supervisor Portal"}
          </div>
        </div>
      </div>

      <div style={{ padding:"14px 12px", flex:1 }}>
        <div style={{ fontSize:"9.5px", fontWeight:800, color:"rgba(255,255,255,.28)", letterSpacing:"1.5px", textTransform:"uppercase", padding:"6px 8px 5px", marginBottom:2 }}>Menu</div>
        {nav.map(n => (
          <div key={n.key} onClick={() => setPage(n.key)}
            style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, color:page===n.key?"#5edda0":"rgba(255,255,255,.62)", background:page===n.key?"linear-gradient(90deg,rgba(46,204,122,.22),rgba(46,204,122,.10))":"transparent", cursor:"pointer", fontSize:"13.5px", fontWeight:page===n.key?600:500, marginBottom:2, transition:"all .2s", userSelect:"none" }}
            onMouseEnter={e => { if (page!==n.key){e.currentTarget.style.background="rgba(255,255,255,.08)";e.currentTarget.style.color="white";}}}
            onMouseLeave={e => { if (page!==n.key){e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,.62)";}}}
          >
            <span style={{ fontSize:17, width:22, textAlign:"center" }}>{n.icon}</span>{n.label}
          </div>
        ))}
      </div>

      <div style={{ padding:"14px 16px 20px", borderTop:"1px solid rgba(255,255,255,.07)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <Avatar initials={user.avatar} color={user.avatarColor || "#1a6640"} size="sm"/>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:"white" }}>{user.name}</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,.45)" }}>
              {levelLabel}
              {isSenior && <span style={{ marginLeft:4, fontSize:10, background:"rgba(212,168,67,.25)", color:"#f0c96a", padding:"1px 5px", borderRadius:4 }}>Senior</span>}
              {isJunior && <span style={{ marginLeft:4, fontSize:10, background:"rgba(255,255,255,.1)", color:"rgba(255,255,255,.5)", padding:"1px 5px", borderRadius:4 }}>Junior</span>}
            </div>
          </div>
        </div>
        <button onClick={logout}
          style={{ width:"100%", padding:8, borderRadius:8, border:"1px solid rgba(255,255,255,.12)", background:"transparent", color:"rgba(255,255,255,.45)", fontSize:12, cursor:"pointer", fontFamily:"inherit", transition:"all .2s" }}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(239,68,68,.14)";e.currentTarget.style.color="#fca5a5";e.currentTarget.style.borderColor="rgba(239,68,68,.32)";}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,.45)";e.currentTarget.style.borderColor="rgba(255,255,255,.12)";}}>
          ← Sign Out
        </button>
      </div>
    </nav>
  );
}

export function Topbar({ page }) {
  const { user, isSenior, isJunior } = useAuth();
  const meta = META[page] || { title: page, sub: "" };
  const now  = new Date().toLocaleDateString("en-GB", { weekday:"long", year:"numeric", month:"long", day:"numeric" });

  const levelBadge = isSenior
    ? { label:"Senior Supervisor", bg:"#fef3c7", color:"#92400e" }
    : isJunior
    ? { label:"Junior Supervisor", bg:"#eff6ff", color:"#1e40af" }
    : user?.role === "supervisor"
    ? { label:"Supervisor",        bg:"#eff6ff", color:"#1e40af" }
    : { label:"Intern",            bg:"#dcfce7", color:"#166534" };

  return (
    <header style={{ background:"var(--white)", borderBottom:"1px solid var(--gray-200)", padding:"14px 32px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50, gap:16 }}>
      <div>
        <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:19, fontWeight:800, color:"var(--green-900)" }}>{meta.title}</h2>
        <p style={{ fontSize:12, color:"var(--gray-400)", marginTop:1 }}>{meta.sub}</p>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:14, flexShrink:0 }}>
        <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99, background:levelBadge.bg, color:levelBadge.color }}>{levelBadge.label}</span>
        <div style={{ fontSize:12, color:"var(--gray-400)", background:"var(--gray-50)", border:"1px solid var(--gray-200)", padding:"5px 12px", borderRadius:20 }}>{now}</div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Avatar initials={user.avatar} color={user.avatarColor || "#1a6640"} size="sm"/>
          <div>
            <div style={{ fontSize:13, fontWeight:600 }}>{user.name}</div>
            <div style={{ fontSize:11, color:"var(--gray-400)" }}>{user.position || levelBadge.label}</div>
          </div>
        </div>
      </div>
    </header>
  );
}