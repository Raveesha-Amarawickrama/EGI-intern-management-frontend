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

export const getWeekKey = (date = new Date()) => {
  const d    = new Date(date);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
};

export const weeklyMinsFromTasks = (tasks = []) => {
  const wk = getWeekKey();
  return tasks
    .filter(t => {
      const d    = new Date(t.date);
      const jan1 = new Date(d.getFullYear(), 0, 1);
      const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
      return `${d.getFullYear()}-W${String(week).padStart(2, "0")}` === wk;
    })
    .reduce((s, t) => s + (parseInt(t.totalMinutes) || 0), 0);
};