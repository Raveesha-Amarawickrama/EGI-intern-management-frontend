export const todayISO = () => new Date().toISOString().split("T")[0];

export const formatMinutes = (mins) => {
  const n = parseInt(mins) || 0;
  if (n <= 0) return "0m";
  const h = Math.floor(n / 60);
  const m = n % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const computeStats = (tasks = []) => ({
  total:      tasks.length,
  done:       tasks.filter(t => t.status === "Done").length,
  inProgress: tasks.filter(t => t.status === "In Progress").length,
  hold:       tasks.filter(t => t.status === "Hold").length,
  todo:       tasks.filter(t => t.status === "To Do").length,
  totalMins:  tasks.reduce((s, t) => s + (parseInt(t.totalMinutes) || 0), 0),
});

export const statusBadgeClass = (s) => ({
  "Done":"badge-green","In Progress":"badge-blue","Hold":"badge-gold","To Do":"badge-gray",
})[s] || "badge-gray";

export const statusDotColor = (s) => ({
  "Done":"#16a34a","In Progress":"#2563eb","Hold":"#d97706","To Do":"#9ca3af",
})[s] || "#9ca3af";

export const statusSelectClass = (s) => ({
  "Done":"status-done","In Progress":"status-progress","Hold":"status-hold","To Do":"status-todo",
})[s] || "";

// ── Week runs Sunday → Saturday (7 days) ────────────────────────────────────
export const getWeekKey = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // back up to Sunday
  const year = d.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const jan1Sunday = new Date(jan1);
  jan1Sunday.setDate(jan1.getDate() - jan1.getDay());
  const diffDays = Math.round((d - jan1Sunday) / 86400000);
  const week = Math.floor(diffDays / 7) + 1;
  return `${year}-W${String(week).padStart(2, "0")}`;
};

export const weekKeyToRange = (wk) => {
  const [yearStr, wStr] = wk.split("-W");
  const year = parseInt(yearStr);
  const week = parseInt(wStr);
  const jan1 = new Date(year, 0, 1);
  const jan1Sunday = new Date(jan1);
  jan1Sunday.setDate(jan1.getDate() - jan1.getDay());
  const start = new Date(jan1Sunday);
  start.setDate(jan1Sunday.getDate() + (week - 1) * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = d => d.toISOString().split("T")[0];
  return { start: fmt(start), end: fmt(end) };
};

export const weeklyMinsFromTasks = (tasks = []) => {
  const wk = getWeekKey();
  return tasks
    .filter(t => t.date && getWeekKey(new Date(t.date)) === wk)
    .reduce((s, t) => s + (parseInt(t.totalMinutes) || 0), 0);
};