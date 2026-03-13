
import { useState, useEffect, useCallback } from "react";
import { taskAPI, userAPI, reportAPI, projectAPI, authAPI } from "../../utils/api";
import { StatusBadge, Avatar, Toast } from "../../components/shared/index.jsx";
import TaskModal from "../../components/shared/TaskModal.jsx";
import SubTaskList from "../../components/shared/SubTaskList.jsx";
import { WeeklyHoursBar } from "../../components/shared/WeeklyHoursCard.jsx";
import { computeStats, formatMinutes, statusSelectClass } from "../../utils/helpers";
import { useAuth } from "../../hooks/useAuth";

function LeaveBadge({ reason }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
      background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a",
    }}>
      Leave Day{reason ? ` — ${reason}` : ""}
    </span>
  );
}


export function SupervisorDashboard() {
  const { user, isSenior } = useAuth();
  const [report,  setReport]  = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fixing,  setFixing]  = useState(false);
  const [fixDone, setFixDone] = useState(false);

  useEffect(() => {
    if (!user) return;
    const myId = String(user._id || user.id || "");
    const calls = [taskAPI.getAll({ internId: myId })];
    if (isSenior) calls.push(reportAPI.interns());

    Promise.all(calls)
      .then(([mine, r]) => {
        const filtered = (mine.tasks || []).filter(
          t => String(t.assignedTo?._id || t.assignedTo) === myId
        );
        setMyTasks(filtered);
        if (r) setReport(r.report || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isSenior, user]);

  const myNonLeave = myTasks.filter(t => !t.isLeave);
  const { total: myTotal, done: myDone, inProgress: myInProgress } = computeStats(myNonLeave);


  const parseEstimateToMins = (str) => {
    if (!str) return 0;
    const s = String(str).toLowerCase().trim();
    if (/^\d+(\.\d+)?$/.test(s)) return Math.round(parseFloat(s) * 60);
    let total = 0;
    const hMatch = s.match(/(\d+\.?\d*)\s*h(our)?s?/);
    if (hMatch) total += Math.round(parseFloat(hMatch[1]) * 60);
    const mMatch = s.match(/(\d+\.?\d*)\s*m(in(ute)?s?)?/);
    if (mMatch) total += Math.round(parseFloat(mMatch[1]));
    return total;
  };


  const resolveTaskMins = (t) => {
  
    let parentMins = parseInt(t.totalMinutes) || 0;
    if (parentMins === 0 && t.timeFrom && t.timeTo) {
      const [fh, fm] = t.timeFrom.split(":").map(Number);
      const [th, tm] = t.timeTo.split(":").map(Number);
      parentMins = Math.max(0, (th * 60 + tm) - (fh * 60 + fm));
    }
    if (parentMins === 0) parentMins = parseEstimateToMins(t.estimateTime);

    const subMins = (t.subTasks || []).reduce((ss, st) => {
      const stMins = parseInt(st.totalMinutes) || 0;
      if (stMins > 0) return ss + stMins;
      if (st.timeFrom && st.timeTo) {
        const [fh, fm] = st.timeFrom.split(":").map(Number);
        const [th, tm] = st.timeTo.split(":").map(Number);
        return ss + Math.max(0, (th * 60 + tm) - (fh * 60 + fm));
      }
      return ss + parseEstimateToMins(st.estimateTime);
    }, 0);

    return parentMins + subMins;
  };

  const myTotalMins = myNonLeave.reduce((s, t) => s + resolveTaskMins(t), 0);
  const myLeaveDays = myTasks.filter(t => t.isLeave).length;

  if (!user || loading) return (
    <div style={{ padding: 60, textAlign: "center" }}><div className="spinner"/></div>
  );

  return (
    <div className="animate-fadeUp">
      <div className={`grid-${isSenior ? 4 : 3} mb-24`}>
        {isSenior && (
          <div className="stat-card stat-green">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{report.length}</div>
            <div className="stat-label">Active Interns</div>
            <div className="stat-change neutral">All time</div>
          </div>
        )}
        {[
          ["📋", "My Total Tasks", myTotal,     "stat-blue", "neutral"],
          ["✅", "My Completed",   myDone,       "stat-gold", "up"],
          ["🏖️", "My Leave Days", myLeaveDays,  "stat-red",  "neutral"],
        ].map(([icon, label, val, cls, chg]) => (
          <div key={label} className={`stat-card ${cls}`}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-value">{val}</div>
            <div className="stat-label">{label}</div>
            <div className={`stat-change ${chg}`}>
              {chg === "up"
                ? `↑ ${myTotal ? Math.round(myDone / myTotal * 100) : 0}% rate`
                : "All time"}
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2 mb-24">
        {isSenior && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">👥 Intern Weekly Hours</div>
            </div>
            <div className="card-body">
              {report.map(intern => (
                <div
                  key={intern._id}
                  style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #f1f5f9" }}
                >
                  <div className="flex items-center gap-10 mb-8">
                    <Avatar initials={intern.avatar} color={intern.avatarColor} size="sm"/>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {intern.name.split(" ")[0]}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--gray-400)" }}>
                        {intern.stats.total} tasks
                      </div>
                    </div>
                    <span style={{
                      fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 13,
                      color: intern.stats.pct > 70 ? "var(--green-500)" : "var(--orange)",
                    }}>
                      {intern.stats.pct}% done
                    </span>
                  </div>
                  <WeeklyHoursBar weekMins={intern.stats.weekMins || 0} compact noTarget/>
                </div>
              ))}
              {report.length === 0 && (
                <p style={{ color: "var(--gray-400)", fontSize: 13 }}>No intern data yet.</p>
              )}
            </div>
          </div>
        )}

        <div>
          <div className="week-summary mb-16">
            <h3>📊 My Overview</h3>
            {[
              ["My Hours Logged", formatMinutes(myTotalMins), "good"],
              ["My In Progress",  myInProgress,               "warn"],
              ["My Completion",   `${myTotal ? Math.round(myDone / myTotal * 100) : 0}%`, "good"],
            ].map(([l, v, c]) => (
              <div key={l} className="week-stat">
                <span className="week-stat-label">{l}</span>
                <span className={`week-stat-val ${c}`}>{v}</span>
              </div>
            ))}
          </div>

          {isSenior && !fixDone && (
            <button
              onClick={async () => {
                setFixing(true);
                try {
                  await taskAPI.fixHours();
                  setFixDone(true);
                  const myId = String(user._id || user.id || "");
                  const d = await taskAPI.getAll({ internId: myId });
                  setMyTasks(
                    (d.tasks || []).filter(
                      t => String(t.assignedTo?._id || t.assignedTo) === myId
                    )
                  );
                } catch (e) { console.error(e); }
                setFixing(false);
              }}
              style={{
                marginTop: 12, width: "100%", padding: "8px", borderRadius: 8,
                border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#166534",
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {fixing ? "⏳ Recalculating hours…" : " Recalculate All Hours"}
            </button>
          )}
          {fixDone && (
            <p style={{ fontSize: 11, color: "#16a34a", marginTop: 8, textAlign: "center" }}>
               Hours recalculated!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}


export function MyTasksPageSupervisor() {
  const { user } = useAuth();
  const [tasks,     setTasks]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editTask,  setEditTask]  = useState(null);
  const [toast,     setToast]     = useState(null);
  const [status,    setStatus]    = useState("All");
  const [search,    setSearch]    = useState("");

  const load = useCallback(() => {
    if (!user) return;
    setLoading(true);
    taskAPI.getAll({ status: status !== "All" ? status : undefined, search: search || undefined })
      .then(d => {
        setTasks(
          (d.tasks || []).filter(
            t => String(t.assignedTo?._id || t.assignedTo) === String(user._id)
          )
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status, search, user]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    if (!user) return;
    setSaving(true);
    try {
      const taskForm = { ...form, assignedTo: user._id };
      if (editTask) {
        const d = await taskAPI.update(editTask._id || editTask.id, taskForm);
        setTasks(ts =>
          ts.map(t => (t._id || t.id) === (editTask._id || editTask.id) ? d.task : t)
        );
        setToast({ msg: "Task updated!", type: "success" });
      } else {
        const d = await taskAPI.create(taskForm);
        setTasks(ts => [d.task, ...ts]);
        setToast({ msg: form.isLeave ? "Leave day marked!" : "Task created!", type: "success" });
      }
      setShowModal(false);
      setEditTask(null);
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await taskAPI.delete(id);
      setTasks(ts => ts.filter(t => (t._id || t.id) !== id));
      setToast({ msg: "Deleted.", type: "success" });
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
  };

  const handleTaskUpdated = (updated) => {
    setTasks(ts =>
      ts.map(t => (t._id || t.id) === (updated._id || updated.id) ? updated : t)
    );
  };

  if (!user) return (
    <div style={{ padding: 60, textAlign: "center" }}><div className="spinner"/></div>
  );

  return (
    <div className="animate-fadeUp">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}

  
      {showModal && user && (
        <TaskModal
          task={editTask}
          currentUser={{ ...user, role: "intern" }}
          onClose={() => { setShowModal(false); setEditTask(null); }}
          onSave={handleSave}
          loading={saving}
        />
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">My Tasks</div>
          <button
            className="btn btn-primary"
            onClick={() => { setEditTask(null); setShowModal(true); }}
          >
            + New Task
          </button>
        </div>
        <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--gray-100)" }}>
          <div className="filters">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Search…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="filter-select"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              {["To Do", "In Progress", "Done", "Hold"].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <span className="text-sm text-gray" style={{ marginLeft: "auto" }}>
              {tasks.length} records
            </span>
          </div>
        </div>

        <div className="table-wrap">
          {loading
            ? <div style={{ padding: 40, textAlign: "center" }}><div className="spinner"/></div>
            : tasks.length === 0
              ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <h3>No tasks yet</h3>
                  <p>Create your first task above.</p>
                </div>
              )
              : (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th><th>Project</th><th>Task / Sub-tasks</th>
                      <th>Status</th><th>Estimate</th><th>Doc</th>
                      <th>Checked By</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(t => (
                      <tr key={t._id || t.id} style={t.isLeave ? { background: "#fffbeb" } : {}}>
                        <td className="text-sm text-gray">{t.date}</td>
                        <td>
                          {t.isLeave ? "—" : <span className="tag">{t.project}</span>}
                        </td>
                        <td className="text-sm" style={{ maxWidth: 220 }}>
                          {t.isLeave
                            ? <LeaveBadge reason={t.leaveReason}/>
                            : (
                              <>
                                <div style={{ marginBottom: 4 }}>{t.task}</div>
                                <SubTaskList task={t} currentUser={user} onTaskUpdated={handleTaskUpdated}/>
                              </>
                            )}
                        </td>
                        <td>
                          {t.isLeave ? "—" : (
                            <select
                              className={`status-select ${statusSelectClass(t.status)}`}
                              value={t.status}
                              onChange={async e => {
                                const d = await taskAPI.updateStatus(t._id || t.id, e.target.value);
                                setTasks(ts =>
                                  ts.map(x => (x._id || x.id) === (t._id || t.id) ? d.task : x)
                                );
                              }}
                            >
                              {["To Do", "In Progress", "Done", "Hold"].map(s => (
                                <option key={s}>{s}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="text-sm">{t.isLeave ? "—" : t.estimateTime}</td>
                        <td>
                          {t.workDoc
                            ? <a href={t.workDoc} target="_blank" rel="noreferrer" style={{ color: "var(--green-600)", fontSize: 17 }}>🔗</a>
                            : "–"}
                        </td>
                        <td>
                          {t.isLeave ? "—" : t.adminCheckedUsers?.length > 0
                            ? t.adminCheckedUsers.map(sv => (
                              <span
                                key={sv.username}
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: 4,
                                  padding: "2px 8px", borderRadius: 99, fontSize: 11,
                                  fontWeight: 700, background: "#dcfce7", color: "#166534",
                                  border: "1px solid #bbf7d0", whiteSpace: "nowrap", marginRight: 3,
                                }}
                              >
                                 {sv.name}
                              </span>
                            ))
                            : <span style={{ fontSize: 12, color: "var(--gray-400)" }}>—</span>}
                        </td>
                        <td>
                          <div className="flex gap-6">
                            {!t.isLeave && (
                              <button
                                className="btn btn-secondary btn-sm btn-icon"
                                onClick={() => { setEditTask(t); setShowModal(true); }}
                              >✏️</button>
                            )}
                            <button
                              className="btn btn-danger btn-sm btn-icon"
                              onClick={() => handleDelete(t._id || t.id)}
                            >🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
          }
        </div>
      </div>
    </div>
  );
}

export function AllTasksPage() {
  const { user, isSenior } = useAuth();
  const [tasks,       setTasks]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [showModal,   setShowModal]   = useState(false);
  const [editTask,    setEditTask]    = useState(null);
  const [toast,       setToast]       = useState(null);
  const [status,      setStatus]      = useState("All");
  const [internId,    setInternId]    = useState("All");
  const [filterUsers, setFilterUsers] = useState([]);
  const [search,      setSearch]      = useState("");

  useEffect(() => {
    if (!user) return;
    if (isSenior) {
      Promise.all([userAPI.getAll("intern"), userAPI.getAll("supervisor")])
        .then(([i, s]) => setFilterUsers([...(i.users || []), ...(s.users || [])]))
        .catch(() => {});
    } else {
      userAPI.getAll("intern").then(d => setFilterUsers(d.users || [])).catch(() => {});
    }
  }, [isSenior, user]);

  const load = useCallback(() => {
    if (!user) return;
    setLoading(true);
    const myId = String(user._id || user.id || "");
    taskAPI.getAll({
      status:   status   !== "All" ? status   : undefined,
      internId: internId !== "All" ? internId : undefined,
      search:   search   || undefined,
    })
      .then(d => {
        const others = (d.tasks || []).filter(
          t => String(t.assignedTo?._id || t.assignedTo) !== myId
        );
        setTasks(others);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status, internId, search, user]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    if (!user) return;
    setSaving(true);
    try {
      if (editTask) {
        const d = await taskAPI.update(editTask._id || editTask.id, form);
        setTasks(ts =>
          ts.map(t => (t._id || t.id) === (editTask._id || editTask.id) ? d.task : t)
        );
        setToast({ msg: "Task updated!", type: "success" });
      } else {
        const d = await taskAPI.create(form);
        if (String(d.task.assignedTo?._id || d.task.assignedTo) !== String(user._id)) {
          setTasks(ts => [d.task, ...ts]);
        }
        setToast({ msg: form.isLeave ? "Leave day marked!" : "Task assigned!", type: "success" });
      }
      setShowModal(false);
      setEditTask(null);
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await taskAPI.delete(id);
      setTasks(ts => ts.filter(t => (t._id || t.id) !== id));
      setToast({ msg: "Deleted.", type: "success" });
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
  };

  const handleCheck = async (id) => {
    try {
      const d = await taskAPI.toggleCheck(id);
      setTasks(ts => ts.map(t => (t._id || t.id) === id ? d.task : t));
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
  };

  const handleTaskUpdated = (updated) => {
    setTasks(ts =>
      ts.map(t => (t._id || t.id) === (updated._id || updated.id) ? updated : t)
    );
  };

  if (!user) return (
    <div style={{ padding: 60, textAlign: "center" }}><div className="spinner"/></div>
  );

  const filterableUsers = filterUsers.filter(u => String(u._id) !== String(user._id));

  return (
    <div className="animate-fadeUp">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}

      {showModal && user && (
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
          <div className="card-title">📋 All Tasks</div>
          <button
            className="btn btn-primary"
            onClick={() => { setEditTask(null); setShowModal(true); }}
          >
            + Assign Task
          </button>
        </div>
        <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--gray-100)" }}>
          <div className="filters">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Search…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="filter-select"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              {["To Do", "In Progress", "Done", "Hold"].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select
              className="filter-select"
              value={internId}
              onChange={e => setInternId(e.target.value)}
            >
              <option value="All">All Members</option>
              {filterableUsers.filter(u => u.role === "intern").map(i => (
                <option key={i._id} value={i._id}>
                  {i.name.split(" ")[0]} (Intern)
                </option>
              ))}
              {isSenior && filterableUsers.filter(u => u.role === "supervisor").map(s => (
                <option key={s._id} value={s._id}>
                  {s.name.replace("Mr. ", "").replace("Miss. ", "")}{" "}
                  ({s.supervisorLevel === "senior" ? "Senior Sup" : "Supervisor"})
                </option>
              ))}
            </select>
            <span className="text-sm text-gray" style={{ marginLeft: "auto" }}>
              {tasks.length} records
            </span>
          </div>
        </div>

        <div className="table-wrap">
          {loading
            ? <div style={{ padding: 40, textAlign: "center" }}><div className="spinner"/></div>
            : tasks.length === 0
              ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <h3>No tasks found</h3>
                  <p>Tasks you assign to others will appear here.</p>
                </div>
              )
              : (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th><th>Assigned To</th><th>Project</th>
                      <th>Task / Sub-tasks</th><th>Status</th><th>Estimate</th>
                      <th>Doc</th><th>Check</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(t => (
                      <tr key={t._id || t.id} style={t.isLeave ? { background: "#fffbeb" } : {}}>
                        <td className="text-sm text-gray">{t.date}</td>
                        <td>
                          {t.assignedTo && (
                            <div className="flex items-center gap-8">
                              <Avatar
                                initials={t.assignedTo.avatar}
                                color={t.assignedTo.avatarColor}
                                size="sm"
                              />
                              <span className="text-sm">{t.assignedTo.name || ""}</span>
                            </div>
                          )}
                        </td>
                        <td>
                          {t.isLeave ? "—" : <span className="tag">{t.project}</span>}
                        </td>
                        <td className="text-sm" style={{ maxWidth: 200 }}>
                          {t.isLeave
                            ? <LeaveBadge reason={t.leaveReason}/>
                            : (
                              <>
                                <div style={{ marginBottom: 4 }}>{t.task}</div>
                                <SubTaskList task={t} currentUser={user} onTaskUpdated={handleTaskUpdated}/>
                              </>
                            )}
                        </td>
                        <td>
                          {t.isLeave ? "—" : <StatusBadge status={t.status}/>}
                        </td>
                        <td className="text-sm">{t.isLeave ? "—" : t.estimateTime}</td>
                        <td>
                          {t.workDoc
                            ? <a href={t.workDoc} target="_blank" rel="noreferrer" style={{ color: "var(--green-600)", fontSize: 17 }}>🔗</a>
                            : "–"}
                        </td>
                        <td>
                          {t.isLeave ? "—" : (
                            <button
                              onClick={() => handleCheck(t._id || t.id)}
                              style={{
                                background: (t.adminChecked || []).includes(user.username)
                                  ? "#dcfce7" : "#f3f4f6",
                                border: "none", borderRadius: 6, padding: "4px 10px",
                                fontSize: 11, fontWeight: 700, cursor: "pointer",
                                fontFamily: "inherit",
                                color: (t.adminChecked || []).includes(user.username)
                                  ? "#166534" : "#6b7280",
                              }}
                            >
                              {(t.adminChecked || []).includes(user.username) ? "✓ Checked" : "Mark"}
                            </button>
                          )}
                        </td>
                        <td>
                          <div className="flex gap-6">
                            {!t.isLeave && (
                              <button
                                className="btn btn-secondary btn-sm btn-icon"
                                onClick={() => { setEditTask(t); setShowModal(true); }}
                              >✏️</button>
                            )}
                            <button
                              className="btn btn-danger btn-sm btn-icon"
                              onClick={() => handleDelete(t._id || t.id)}
                            >🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
          }
        </div>
      </div>
    </div>
  );
}

export function InternsPage() {
  const { isSenior } = useAuth();
  const [report,       setReport]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [toast,        setToast]        = useState(null);
  const [resetTarget,  setResetTarget]  = useState(null);
  const [newPass,      setNewPass]      = useState("");
  const [resetting,    setResetting]    = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  const [showAddIntern, setShowAddIntern] = useState(false);
  const [addingIntern,  setAddingIntern]  = useState(false);
  const [internForm,    setInternForm]    = useState({
    name: "", username: "", password: "", email: "",
    contact: "", position: "", department: "", startDate: "", endDate: "",
  });

  const loadReport = () => {
    setLoading(true);
    reportAPI.interns()
      .then(d => { setReport(d.report || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadReport(); }, []);

  const handleResetPassword = async () => {
    if (!newPass || newPass.length < 6) {
      setToast({ msg: "Password must be at least 6 characters.", type: "error" });
      return;
    }
    setResetting(true);
    try {
      await authAPI.resetPassword(resetTarget._id, { newPassword: newPass });
      setToast({ msg: `Password reset for ${resetTarget.name}.`, type: "success" });
      setResetTarget(null);
      setNewPass("");
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
    setResetting(false);
  };

  const handleAddIntern = async () => {
    if (!internForm.name || !internForm.username || !internForm.password || !internForm.email) {
      setToast({ msg: "Name, username, password and email are required.", type: "error" });
      return;
    }
    setAddingIntern(true);
    try {
      await authAPI.register({ ...internForm, role: "intern" });
      setToast({ msg: `${internForm.name} added successfully!`, type: "success" });
      setShowAddIntern(false);
      setInternForm({
        name: "", username: "", password: "", email: "",
        contact: "", position: "", department: "", startDate: "", endDate: "",
      });
      loadReport();
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
    setAddingIntern(false);
  };

  const handleDeleteIntern = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await userAPI.delete(deleteTarget._id);
      setReport(r => r.filter(i => i._id !== deleteTarget._id));
      setToast({ msg: `${deleteTarget.name} removed.`, type: "success" });
      setDeleteTarget(null);
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
    setDeleting(false);
  };

  if (loading) return (
    <div style={{ padding: 60, textAlign: "center" }}><div className="spinner"/></div>
  );

  return (
    <div className="animate-fadeUp">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={() => setShowAddIntern(true)}>+ Add Intern</button>
      </div>

    
      {showAddIntern && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 200, padding: 16,
          }}
          onClick={e => e.target === e.currentTarget && setShowAddIntern(false)}
        >
          <div style={{
            background: "white", borderRadius: 18, width: 540, maxWidth: "100%",
            maxHeight: "90vh", overflow: "auto", padding: "32px 28px",
            boxShadow: "0 24px 80px rgba(0,0,0,.3)",
          }}>
            <div style={{
              fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 18,
              color: "#0a2e1a", marginBottom: 6,
            }}>
              ➕ Add New Intern
            </div>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
              Fill in the details to register a new intern.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                ["Full Name *",  "name",       "text"],
                ["Username *",   "username",   "text"],
                ["Password *",   "password",   "password"],
                ["Email *",      "email",      "email"],
                ["Contact",      "contact",    "text"],
                ["Position",     "position",   "text"],
                ["Department",   "department", "text"],
                ["Start Date",   "startDate",  "date"],
                ["End Date",     "endDate",    "date"],
              ].map(([label, key, type]) => (
                <div key={key} style={{ gridColumn: key === "name" ? "1/-1" : "auto" }}>
                  <label style={{
                    fontSize: 12, fontWeight: 600, color: "#374151",
                    display: "block", marginBottom: 4,
                  }}>
                    {label}
                  </label>
                  <input
                    type={type}
                    className="form-input"
                    value={internForm[key]}
                    onChange={e => setInternForm(f => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setShowAddIntern(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddIntern}
                disabled={addingIntern}
              >
                {addingIntern ? "Adding…" : "Add Intern"}
              </button>
            </div>
          </div>
        </div>
      )}

  
      {resetTarget && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 200, padding: 16,
          }}
          onClick={e => e.target === e.currentTarget && setResetTarget(null)}
        >
          <div style={{
            background: "white", borderRadius: 18, width: 380,
            padding: "32px 28px", boxShadow: "0 24px 80px rgba(0,0,0,.3)",
          }}>
            <div style={{
              fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 18,
              color: "#0a2e1a", marginBottom: 6,
            }}>
              🔑 Reset Password
            </div>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
              Set a new temporary password for <strong>{resetTarget.name}</strong>.
            </p>
            <label style={{
              fontSize: 12, fontWeight: 600, color: "#374151",
              display: "block", marginBottom: 5,
            }}>
              New Password
            </label>
            <input
              type="password"
              className="form-input"
              style={{ marginBottom: 20 }}
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              placeholder="Min. 6 characters"
              onKeyDown={e => e.key === "Enter" && handleResetPassword()}
            />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                className="btn btn-secondary"
                onClick={() => { setResetTarget(null); setNewPass(""); }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleResetPassword}
                disabled={resetting}
              >
                {resetting ? "Resetting…" : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}

  
      {deleteTarget && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 200, padding: 16,
          }}
          onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}
        >
          <div style={{
            background: "white", borderRadius: 18, width: 380,
            padding: "32px 28px", boxShadow: "0 24px 80px rgba(0,0,0,.3)",
          }}>
            <div style={{
              fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 18,
              color: "#dc2626", marginBottom: 6,
            }}>
              🗑 Remove Intern
            </div>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
              Are you sure you want to remove <strong>{deleteTarget.name}</strong>?
              This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button
                style={{
                  padding: "9px 20px", borderRadius: 9, border: "none",
                  background: "#ef4444", color: "white", fontWeight: 700,
                  fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                }}
                onClick={handleDeleteIntern}
                disabled={deleting}
              >
                {deleting ? "Removing…" : "Remove Intern"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid-3">
        {report.map(intern => {
          const { total, done, leaveDays = 0, totalMins = 0, weekMins = 0, pct = 0 } = intern.stats;

          return (
            <div key={intern._id} className="intern-card">
              <div className="flex items-center gap-12 mb-16">
                <Avatar initials={intern.avatar} color={intern.avatarColor} size="lg"/>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: "Syne,sans-serif", fontWeight: 800,
                    fontSize: 15, color: "var(--green-900)",
                  }}>
                    {intern.name}
                  </div>
                  <div style={{
                    fontSize: 12, color: "var(--green-600)",
                    fontWeight: 600, marginTop: 2,
                  }}>
                    {intern.position}
                  </div>
                </div>
                {isSenior && (
                  <button
                    onClick={() => setDeleteTarget({ _id: intern._id, name: intern.name })}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 16, color: "#ef4444", flexShrink: 0, padding: "4px",
                    }}
                    title="Remove intern"
                  >🗑</button>
                )}
              </div>

              <div style={{ fontSize: 12, color: "var(--gray-500)", marginBottom: 14, lineHeight: 1.8 }}>
                📅 {intern.startDate} → {intern.endDate}
              </div>

              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
                gap: 6, marginBottom: 14, textAlign: "center",
              }}>
                {[
                  ["Tasks", total,                    "var(--green-50)", "var(--green-900)"],
                  ["Done",  done,                     "var(--green-50)", "var(--green-900)"],
                  ["Leave", leaveDays,                "#fffbeb",         "#92400e"],
                  ["Hours", formatMinutes(totalMins), "var(--green-50)", "var(--green-900)"],
                ].map(([l, v, bg, col]) => (
                  <div key={l} style={{ background: bg, borderRadius: 8, padding: "8px 4px" }}>
                    <div style={{
                      fontFamily: "Syne,sans-serif", fontWeight: 800,
                      fontSize: 14, color: col,
                    }}>{v}</div>
                    <div style={{
                      fontSize: 9, color: "var(--gray-400)", fontWeight: 600,
                      textTransform: "uppercase", letterSpacing: ".5px", marginTop: 2,
                    }}>{l}</div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between mb-8">
                <span className="text-xs text-gray">Completion</span>
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: pct > 70 ? "var(--green-500)" : "var(--orange)",
                }}>{pct}%</span>
              </div>
              <div className="progress-bar mb-12">
                <div
                  className={`progress-fill${pct < 50 ? " warn" : ""}`}
                  style={{ width: Math.max(0, pct) + "%" }}
                />
              </div>

              <div className="flex justify-between mb-6">
                <span className="text-xs text-gray">⏱ Weekly hours</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--green-600)" }}>
                  {formatMinutes(weekMins)}
                </span>
              </div>
              <WeeklyHoursBar weekMins={weekMins} compact noTarget/>

              <button
                onClick={() => setResetTarget({ _id: intern._id, name: intern.name })}
                style={{
                  marginTop: 14, width: "100%", padding: "7px", borderRadius: 8,
                  border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                🔑 Reset Password
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}


export function ProjectsPage() {
  const { isSenior } = useAuth();
  const [report,         setReport]         = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [toast,          setToast]          = useState(null);
  const [showAddProject, setShowAddProject] = useState(false);
  const [addingProject,  setAddingProject]  = useState(false);
  const [projectForm,    setProjectForm]    = useState({
    name: "", fullName: "", color: "#1a6640", icon: "🗂️",
  });

  const loadReport = () => {
    setLoading(true);
    reportAPI.projects()
      .then(d => { setReport(d.report || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadReport(); }, []);

  const handleAddProject = async () => {
    if (!projectForm.name || !projectForm.fullName) {
      setToast({ msg: "Project code and full name are required.", type: "error" });
      return;
    }
    setAddingProject(true);
    try {
      await projectAPI.create(projectForm);
      setToast({ msg: `Project ${projectForm.name} created!`, type: "success" });
      setShowAddProject(false);
      setProjectForm({ name: "", fullName: "", color: "#1a6640", icon: "🗂️" });
      loadReport();
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
    setAddingProject(false);
  };

  const handleDeleteProject = async (name) => {
    if (!window.confirm(`Delete project "${name}"? This cannot be undone.`)) return;
    try {
      await projectAPI.delete(name);
      setReport(r => r.filter(p => p.name !== name));
      setToast({ msg: "Project deleted.", type: "success" });
    } catch (e) { setToast({ msg: e.message, type: "error" }); }
  };

  if (loading) return (
    <div style={{ padding: 60, textAlign: "center" }}><div className="spinner"/></div>
  );

  const lighten = hex =>
    ({ "#1a6640": "#2ecc7a", "#2563eb": "#60a5fa", "#16a34a": "#4ade80" })[hex] || "#2ecc7a";

  return (
    <div className="animate-fadeUp">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}

      {isSenior && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
          <button className="btn btn-primary" onClick={() => setShowAddProject(true)}>
            + Add Project
          </button>
        </div>
      )}

      {showAddProject && isSenior && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 200, padding: 16,
          }}
          onClick={e => e.target === e.currentTarget && setShowAddProject(false)}
        >
          <div style={{
            background: "white", borderRadius: 18, width: 420,
            padding: "32px 28px", boxShadow: "0 24px 80px rgba(0,0,0,.3)",
          }}>
            <div style={{
              fontFamily: "Syne,sans-serif", fontWeight: 800,
              fontSize: 18, color: "#0a2e1a", marginBottom: 6,
            }}>
              ➕ Add New Project
            </div>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
              Create a new project for task assignment.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{
                  fontSize: 12, fontWeight: 600, color: "#374151",
                  display: "block", marginBottom: 4,
                }}>
                  Project Code * (e.g. EGI)
                </label>
                <input
                  className="form-input"
                  value={projectForm.name}
                  onChange={e => setProjectForm(f => ({ ...f, name: e.target.value.toUpperCase() }))}
                  placeholder="EGI"
                />
              </div>
              <div>
                <label style={{
                  fontSize: 12, fontWeight: 600, color: "#374151",
                  display: "block", marginBottom: 4,
                }}>
                  Full Name *
                </label>
                <input
                  className="form-input"
                  value={projectForm.fullName}
                  onChange={e => setProjectForm(f => ({ ...f, fullName: e.target.value }))}
                  placeholder="Eco Green International"
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{
                    fontSize: 12, fontWeight: 600, color: "#374151",
                    display: "block", marginBottom: 4,
                  }}>
                    Color
                  </label>
                  <input
                    type="color"
                    value={projectForm.color}
                    onChange={e => setProjectForm(f => ({ ...f, color: e.target.value }))}
                    style={{
                      width: "100%", height: 38, borderRadius: 8,
                      border: "1px solid #e5e7eb", cursor: "pointer",
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    fontSize: 12, fontWeight: 600, color: "#374151",
                    display: "block", marginBottom: 4,
                  }}>
                    Icon (emoji)
                  </label>
                  <input
                    className="form-input"
                    value={projectForm.icon}
                    onChange={e => setProjectForm(f => ({ ...f, icon: e.target.value }))}
                    placeholder="🗂️"
                  />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setShowAddProject(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddProject}
                disabled={addingProject}
              >
                {addingProject ? "Creating…" : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid-3 mb-24">
        {report.map(p => (
          <div key={p._id || p.id} className="card">
            <div className="card-body">
              <div className="flex items-center gap-12 mb-18">
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: `linear-gradient(135deg,${p.color},${lighten(p.color)})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, flexShrink: 0,
                }}>
                  {p.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: "Syne,sans-serif", fontWeight: 800,
                    fontSize: 18, color: "var(--green-900)",
                  }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{p.fullName}</div>
                </div>
                {isSenior && (
                  <button
                    onClick={() => handleDeleteProject(p.name)}
                    style={{
                      background: "none", border: "none",
                      cursor: "pointer", fontSize: 16, color: "#ef4444", flexShrink: 0,
                    }}
                    title="Delete project"
                  >🗑</button>
                )}
              </div>

              {[
                ["Total Tasks",  p.stats.total],
                ["Completed",    p.stats.done],
                ["Hours",        formatMinutes(p.stats.totalMins)],
                ["In Progress",  p.stats.inProgress || 0],
              ].map(([l, v]) => (
                <div key={l} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "9px 0", borderBottom: "1px solid var(--gray-100)", fontSize: 13,
                }}>
                  <span className="text-gray">{l}</span>
                  <span style={{ fontWeight: 700 }}>{v}</span>
                </div>
              ))}

              <div style={{ marginTop: 14 }}>
                <div className="flex justify-between mb-8">
                  <span className="text-xs text-gray">Progress</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--green-600)" }}>
                    {p.stats.pct}%
                  </span>
                </div>
                <div className="progress-bar" style={{ height: 9 }}>
                  <div
                    className={`progress-fill${p.stats.pct < 40 ? " danger" : p.stats.pct < 70 ? " warn" : ""}`}
                    style={{ width: p.stats.pct + "%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}