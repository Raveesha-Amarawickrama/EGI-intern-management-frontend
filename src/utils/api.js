
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
  login:          (body)         => request("/auth/login",                          { method:"POST",  body: JSON.stringify(body) }),
  register:       (body)         => request("/auth/register",                       { method:"POST",  body: JSON.stringify(body) }),
  getMe:          ()             => request("/auth/me"),
  changePassword: (body)         => request("/auth/change-password",                { method:"PATCH", body: JSON.stringify(body) }),
  resetPassword:  (userId, body) => request(`/auth/reset-password/${userId}`,       { method:"PATCH", body: JSON.stringify(body) }),
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
  create:  (body)  => request("/projects",       { method:"POST",   body: JSON.stringify(body) }),
  delete:  (name)  => request(`/projects/${name}`,{ method:"DELETE" }),
};


export const reportAPI = {
  summary:  () => request("/reports/summary"),
  interns:  () => request("/reports/interns"),
  projects: () => request("/reports/projects"),
};