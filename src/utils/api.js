const BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const getToken   = ()  => localStorage.getItem("egi_token");
export const setToken   = (t) => localStorage.setItem("egi_token", t);
export const clearToken = ()  => localStorage.removeItem("egi_token");

async function request(path, options = {}) {
  const token   = getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res  = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const authAPI = {
  login:          (body)         => request("/auth/login",                    { method:"POST",  body: JSON.stringify(body) }),
  register:       (body)         => request("/auth/register",                 { method:"POST",  body: JSON.stringify(body) }),
  getMe:          ()             => request("/auth/me"),
  changePassword: (body)         => request("/auth/change-password",          { method:"PATCH", body: JSON.stringify(body) }),
  resetPassword:  (userId, body) => request(`/auth/reset-password/${userId}`, { method:"PATCH", body: JSON.stringify(body) }),
  registerSupervisor: (data) => request("/auth/register-supervisor", { method:"POST", body: JSON.stringify(data) }),
deleteSupervisor:   (id)   => request(`/auth/supervisor/${id}`,    { method:"DELETE" }),
};

export const taskAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v && v !== "All"))
    ).toString();
    return request(`/tasks${qs ? "?" + qs : ""}`);
  },
  getOne:        (id)             => request(`/tasks/${id}`),
  create:        (body)           => request("/tasks",              { method:"POST",  body: JSON.stringify(body) }),
  update:        (id, body)       => request(`/tasks/${id}`,        { method:"PATCH", body: JSON.stringify(body) }),
  updateStatus:  (id, status)     => request(`/tasks/${id}/status`, { method:"PATCH", body: JSON.stringify({ status }) }),
  toggleCheck:   (id)             => request(`/tasks/${id}/check`,  { method:"PATCH" }),
  delete:        (id)             => request(`/tasks/${id}`,        { method:"DELETE" }),
  fixHours:      ()               => request("/tasks/fix-hours",    { method:"PATCH" }),
  getWeekly:     (params = {})    => {
    const qs = new URLSearchParams(params).toString();
    return request(`/tasks/weekly${qs ? "?" + qs : ""}`);
  },
  createSubTask: (taskId, body)        => request(`/tasks/${taskId}/subtasks`,          { method:"POST",   body: JSON.stringify(body) }),
  updateSubTask: (taskId, subId, body) => request(`/tasks/${taskId}/subtasks/${subId}`, { method:"PATCH",  body: JSON.stringify(body) }),
  deleteSubTask: (taskId, subId)       => request(`/tasks/${taskId}/subtasks/${subId}`, { method:"DELETE" }),
};

export const userAPI = {
  getAll:   (role)     => request(`/users${role ? "?role=" + role : ""}`),
  getOne:   (id)       => request(`/users/${id}`),
  update:   (id, body) => request(`/users/${id}`, { method:"PATCH",  body: JSON.stringify(body) }),
  delete:   (id)       => request(`/users/${id}`, { method:"DELETE" }),
  getStats: (id)       => request(`/users/${id}/stats`),
};

export const projectAPI = {
  getAll:  ()      => request("/projects"),
  getStats:(name)  => request(`/projects/${name}/stats`),
  create:  (body)  => request("/projects",        { method:"POST",   body: JSON.stringify(body) }),
  delete:  (name)  => request(`/projects/${name}`,{ method:"DELETE" }),
};

export const reportAPI = {
  summary:  () => request("/reports/summary"),
  interns:  () => request("/reports/interns"),
  projects: () => request("/reports/projects"),
   supervisors: () => request("/reports/supervisors"),
};

// ── Messages ──────────────────────────────────────────────────────────────────
// In messageAPI object in api.js
export const messageAPI = {
  getConversations:    ()            => request("/messages/conversations"),
  getUsers:            ()            => request("/messages/users"),
  getMessages:         (userId)      => request(`/messages/${userId}`),
  send:                (body)        => request("/messages",   { method:"POST", body: JSON.stringify(body) }),
  markRead:            (userId)      => request(`/messages/${userId}/read`, { method:"PATCH" }),
  sendGroupMessage:    (body)        => request("/messages/group", { method:"POST", body: JSON.stringify(body) }), // ✅ NEW
  deleteGroupMessage:  (messageId)   => request(`/messages/message/${messageId}`, { method:"DELETE" }),
  deleteDirectMessage: (messageId)   => request(`/messages/message/${messageId}`, { method:"DELETE" }),
};
// ── Meetings ──────────────────────────────────────────────────────────────────
export const meetingAPI = {
  getAll:       ()           => request("/meetings"),
  create:       (body)       => request("/meetings",            { method:"POST",   body: JSON.stringify(body) }),
  update:       (id, body)   => request(`/meetings/${id}`,      { method:"PATCH",  body: JSON.stringify(body) }),
  updateStatus: (id, status) => request(`/meetings/${id}/status`,{ method:"PATCH", body: JSON.stringify({ status }) }),
  delete:       (id)         => request(`/meetings/${id}`,      { method:"DELETE" }),
};


export const fileAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request(`/files${qs ? "?" + qs : ""}`);
  },

  // ← NEW: fetch files scoped to a project folder
  getByProject: (projectId) => request(`/files/project/${projectId}`),

  upload: (file, projectId = null) => {
    const formData = new FormData();
    formData.append("file", file);
    if (projectId) formData.append("projectId", projectId);
    const token = getToken();
    const url = projectId
      ? `${BASE}/files/upload/${projectId}`
      : `${BASE}/files/upload`;
    return fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      return data;
    });
  },

  delete: (id) => request(`/files/${id}`, { method: "DELETE" }),

  download: async (id, originalName) => {
    const token = getToken();
    const res = await fetch(`${BASE}/files/${id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = originalName;
    a.click();
    URL.revokeObjectURL(url);
  },
};