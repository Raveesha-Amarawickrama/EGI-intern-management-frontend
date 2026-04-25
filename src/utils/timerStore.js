// src/utils/timerStore.js
const KEY = "task_timer";

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { taskId: null, startedAt: null };
  } catch { return { taskId: null, startedAt: null }; }
}

function save(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function timerStart(taskId) {
  save({ taskId, startedAt: Date.now() });
}

export function timerStop() {
  localStorage.removeItem(KEY);
}

export function timerGet() {
  return load();
}

export function timerElapsed() {
  const { startedAt } = load();
  if (!startedAt) return 0;
  return Math.floor((Date.now() - startedAt) / 1000);
}