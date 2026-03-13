
import { useState, useEffect, useCallback } from "react";
import { taskAPI, userAPI } from "../../utils/api";
import { StatusBadge, Avatar, Toast } from "../../components/shared/index.jsx";
import TaskModal from "../../components/shared/TaskModal.jsx";
import SubTaskList from "../../components/shared/SubTaskList.jsx";
import WeeklyHoursCard from "../../components/shared/WeeklyHoursCard.jsx";
import { computeStats, formatMinutes, statusSelectClass } from "../../utils/helpers";
import { useAuth } from "../../hooks/useAuth";

function LeaveBadge({ reason }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:700,
      background:"#fef3c7", color:"#92400e", border:"1px solid #fde68a",
    }}>
       Leave Day{reason ? ` — ${reason}` : ""}
    </span>
  );
}


export function InternDashboard() {
  const { user }  = useAuth();
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    taskAPI.getAll()
      .then(d => { setTasks(d.tasks || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const nonLeaveTasks = tasks.filter(t => !t.isLeave);
  const leaveDays     = tasks.filter(t => t.isLeave);
  const { total, done, inProgress, hold, todo, totalMins } = computeStats(nonLeaveTasks);

  const getWeekBounds = () => {
    const now = new Date();
    const mon = new Date(now);
    mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    mon.setHours(0,0,0,0);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999);
    return { mon, sun };
  };
  const { mon, sun } = getWeekBounds();
  const weekMins = nonLeaveTasks
    .filter(t => { const d = new Date(t.date); return d >= mon && d <= sun; })
    .reduce((s,t) => s + (parseInt(t.totalMinutes)||0), 0);

  if (loading) return <div style={{ padding:60, textAlign:"center" }}><div className="spinner" style={{ margin:"0 auto" }}/></div>;

  return (
    <div className="animate-fadeUp">
      <div className="alert alert-warning mb-20">
        ⚡ The internship requires at least <strong>&nbsp;6 hours/day</strong>.
      </div>

      <div className="grid-4 mb-24">
        {[
          ["✅","Done",        done,            "stat-green","up",     "↑ Keep it up!"],
          ["⚡","In Progress", inProgress,      "stat-blue", "neutral","Active"],
          ["⏸","On Hold",     hold,            "stat-gold", "warn",   "Needs action"],
          ["🏖️","Leave Days", leaveDays.length,"stat-red",  "neutral","Approved"],
        ].map(([icon,label,val,cls,chg,chgTxt]) => (
          <div key={label} className={`stat-card ${cls}`}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-value">{val}</div>
            <div className="stat-label">{label}</div>
            <div className={`stat-change ${chg}`}>{chgTxt}</div>
          </div>
        ))}
      </div>

      <div className="grid-2 mb-24">
   
        <WeeklyHoursCard tasks={nonLeaveTasks} noTarget/>

        <div className="card">
          <div className="card-header"><div className="card-title">📊 Breakdown</div></div>
          <div className="card-body">
            {[["Done",done,"#16a34a"],["In Progress",inProgress,"#1d4ed8"],["To Do",todo,"#6b7280"],["Hold",hold,"#d97706"]].map(([l,v,c]) => (
              <div key={l} className="flex items-center gap-10 mb-16">
                <div style={{ width:10, height:10, borderRadius:"50%", background:c, flexShrink:0 }}/>
                <div style={{ flex:1, fontSize:13 }}>{l}</div>
                <div style={{ fontSize:13, fontWeight:700, minWidth:24, textAlign:"right" }}>{v}</div>
                <div style={{ width:90, height:6, background:"var(--gray-100)", borderRadius:3, overflow:"hidden" }}>
                  <div style={{ height:"100%", width: total ? (v/total*100)+"%" : "0%", background:c, borderRadius:3 }}/>
                </div>
              </div>
            ))}
            {leaveDays.length > 0 && (
              <div style={{ borderTop:"1px solid #f1f5f9", paddingTop:12, marginTop:4 }}>
                <div className="flex items-center gap-10">
                  <div style={{ width:10, height:10, borderRadius:"50%", background:"#f59e0b", flexShrink:0 }}/>
                  <div style={{ flex:1, fontSize:13 }}>Leave Days</div>
                  <div style={{ fontSize:13, fontWeight:700 }}>{leaveDays.length}</div>
                </div>
              </div>
            )}
            <div style={{ borderTop:"1px solid #f1f5f9", paddingTop:14, marginTop:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}>
                <span style={{ color:"#6b7280" }}>All-time logged</span>
                <span style={{ fontWeight:800, color:"#0a2e1a", fontFamily:"Syne,sans-serif" }}>{formatMinutes(totalMins)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {leaveDays.filter(t => { const d=new Date(t.date); return d>=mon&&d<=sun; }).length > 0 && (
        <div className="alert alert-info mb-20">
           You have <strong>{leaveDays.filter(t => { const d=new Date(t.date); return d>=mon&&d<=sun; }).length} leave day(s)</strong> recorded this week.
        </div>
      )}

      <div className="card">
        <div className="card-header"><div className="card-title">🕐 Recent Tasks</div></div>
        <div className="table-wrap">
          {tasks.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📭</div><h3>No tasks yet</h3></div>
          ) : (
            <table>
          
              <thead>
                <tr><th>Date</th><th>Project</th><th>Task</th><th>Status</th><th>Sub-tasks</th><th>Mins</th></tr>
              </thead>
              <tbody>
                {tasks.slice(0,8).map(t => (
                  <tr key={t._id || t.id} style={t.isLeave ? { background:"#fffbeb" } : {}}>
                    <td className="text-sm text-gray">{t.date}</td>
                    <td>{t.isLeave ? "—" : <span className="tag">{t.project}</span>}</td>
                    <td className="text-sm" style={{ maxWidth:220 }}>
                      {t.isLeave ? <LeaveBadge reason={t.leaveReason}/> : t.task}
                    </td>
                    <td>{t.isLeave ? "—" : <StatusBadge status={t.status}/>}</td>
                    <td>
                      {t.isLeave ? "—" : (t.subTasks||[]).length > 0
                        ? <span style={{ fontSize:11, fontWeight:700, background:"#eff6ff", color:"#1d4ed8", padding:"2px 8px", borderRadius:99, border:"1px solid #bfdbfe" }}>
                            {(t.subTasks||[]).filter(s=>s.status==="Done").length}/{(t.subTasks||[]).length}
                          </span>
                        : <span style={{ fontSize:12, color:"#d1d5db" }}>—</span>}
                    </td>
                 
                    <td className="text-sm text-bold">{t.isLeave ? "—" : t.totalMinutes}</td>
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


export function MyTasksPage() {
  const { user }    = useAuth();
  const [tasks,     setTasks]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editTask,  setEditTask]  = useState(null);
  const [toast,     setToast]     = useState(null);
  const [status,    setStatus]    = useState("All");
  const [search,    setSearch]    = useState("");

  const load = useCallback(() => {
    setLoading(true);
    taskAPI.getAll({ status: status !== "All" ? status : undefined, search: search || undefined })
      .then(d => { setTasks(d.tasks || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [status, search]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (editTask) {
        const d = await taskAPI.update(editTask._id || editTask.id, form);
        setTasks(ts => ts.map(t => (t._id||t.id) === (editTask._id||editTask.id) ? d.task : t));
        setToast({ msg:"Task updated!", type:"success" });
      } else {
        const d = await taskAPI.create({ ...form, assignedTo: user._id });
        setTasks(ts => [d.task, ...ts]);
        setToast({ msg:"Task created!", type:"success" });
      }
      setShowModal(false); setEditTask(null);
    } catch (e) { setToast({ msg: e.message, type:"error" }); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await taskAPI.delete(id);
      setTasks(ts => ts.filter(t => (t._id||t.id) !== id));
      setToast({ msg:"Task deleted.", type:"success" });
    } catch (e) { setToast({ msg: e.message, type:"error" }); }
  };

  const handleStatus = async (id, newStatus) => {
    try {
      const d = await taskAPI.updateStatus(id, newStatus);
      setTasks(ts => ts.map(t => (t._id||t.id) === id ? d.task : t));
    } catch (e) { setToast({ msg: e.message, type:"error" }); }
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks(ts => ts.map(t => (t._id||t.id) === (updatedTask._id||updatedTask.id) ? updatedTask : t));
  };

  const leaveDays = tasks.filter(t => t.isLeave).length;

  return (
    <div className="animate-fadeUp">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}
      {showModal && (
        <TaskModal
          task={editTask}
          currentUser={user}
          onClose={() => { setShowModal(false); setEditTask(null); }}
          onSave={handleSave}
          loading={saving}
        />
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            📋 My Tasks
            {leaveDays > 0 && (
              <span style={{ marginLeft:10, fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:99, background:"#fef3c7", color:"#92400e", border:"1px solid #fde68a" }}>
                 {leaveDays} leave day{leaveDays>1?"s":""}
              </span>
            )}
          </div>
          <button className="btn btn-primary" onClick={() => { setEditTask(null); setShowModal(true); }}>+ New Task</button>
        </div>

        <div style={{ padding:"14px 24px", borderBottom:"1px solid var(--gray-100)" }}>
          <div className="filters">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-input" placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
            <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="All">All Status</option>
              {["To Do","In Progress","Done","Hold"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div style={{ padding:40, textAlign:"center" }}><div className="spinner" style={{ margin:"0 auto" }}/></div>
          ) : tasks.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📭</div><h3>No tasks found</h3><p>Create your first task above.</p></div>
          ) : (
            <table>
            
              <thead>
                <tr>
                  <th>Date</th><th>Project</th><th>Assigned By</th>
                  <th>Task / Sub-tasks</th><th>Status</th><th>Estimate</th>
                  <th>Mins</th><th>Doc</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t._id||t.id} style={t.isLeave ? { background:"#fffbeb" } : {}}>
                    <td className="text-sm text-gray">{t.date}</td>
                    <td>{t.isLeave ? "—" : <span className="tag">{t.project}</span>}</td>
                    <td className="text-sm">{t.assignedBy}</td>
                    <td className="text-sm" style={{ maxWidth:220 }}>
                      {t.isLeave
                        ? <LeaveBadge reason={t.leaveReason}/>
                        : <><div style={{ marginBottom:4 }}>{t.task}</div><SubTaskList task={t} currentUser={user} onTaskUpdated={handleTaskUpdated}/></>
                      }
                    </td>
                    <td>
                      {t.isLeave ? "—" : (
                        <select
                          className={`status-select ${statusSelectClass(t.status)}`}
                          value={t.status}
                          onChange={e => handleStatus(t._id||t.id, e.target.value)}
                        >
                          {["To Do","In Progress","Done","Hold"].map(s => <option key={s}>{s}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="text-sm">{t.isLeave ? "—" : t.estimateTime}</td>
            
                    <td className="text-sm text-bold">{t.isLeave ? "—" : t.totalMinutes}</td>
                    <td>{t.workDoc ? <a href={t.workDoc} target="_blank" rel="noreferrer" style={{ color:"var(--green-600)", fontSize:17 }}>🔗</a> : "–"}</td>
                    <td>
                      <div className="flex gap-6">
                        {!t.isLeave && <button className="btn btn-secondary btn-sm btn-icon" onClick={() => { setEditTask(t); setShowModal(true); }}>✏️</button>}
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(t._id||t.id)}>🗑</button>
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


export function ProfilePage() {
  const { user }  = useAuth();
  const [stats,   setStats] = useState(null);

  useEffect(() => {
    userAPI.getStats(user._id)
      .then(d => setStats(d.stats))
      .catch(() => {});
  }, [user._id]);

  return (
    <div className="animate-fadeUp">
      <div className="card mb-24">
        <div className="card-body">
          <div className="profile-header">
            <Avatar initials={user.avatar} color={user.avatarColor} size="xl"/>
            <div>
              <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:24, fontWeight:800, color:"var(--green-900)" }}>{user.name}</h2>
              <p style={{ fontSize:13, color:"var(--green-600)", fontWeight:600, marginTop:4 }}>{user.position}</p>
              <p style={{ fontSize:13, color:"var(--gray-500)", marginTop:2 }}>{user.department}</p>
              <div style={{ display:"flex", gap:8, marginTop:12, flexWrap:"wrap" }}>
                <span className="chip">🌿 Eco Green International</span>
                <span className="chip">👨‍💻 Intern Trainee</span>
              </div>
            </div>
          </div>
          <div className="profile-info-grid">
            {[
              ["Email Address",  user.email],
              ["Contact Number", user.contact   || "–"],
              ["Start Date",     user.startDate || "–"],
              ["End Date",       user.endDate   || "–"],
              ["Position",       user.position  || "–"],
              ["Department",     user.department|| "–"],
            ].map(([l,v]) => (
              <div key={l} className="profile-info-item"><label>{l}</label><p>{v}</p></div>
            ))}
          </div>
        </div>
      </div>
      {stats && (
        <div className="grid-4">
          {[
            ["✅","Completed",   stats.done,                     "stat-green"],
            ["📋","Total Tasks",  stats.total,                    "stat-blue"],
            ["⏱","Hours Logged", formatMinutes(stats.totalMins), "stat-gold"],
            ["📈","Completion",   stats.pct + "%",                "stat-purple"],
          ].map(([icon,label,val,cls]) => (
            <div key={label} className={`stat-card ${cls}`}>
              <div className="stat-icon">{icon}</div>
              <div className="stat-value">{val}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}