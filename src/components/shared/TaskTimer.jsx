import { useState, useEffect, useRef } from "react";
import { taskAPI } from "../../utils/api";
import { timerStart, timerStop, timerGet, timerElapsed } from "../../utils/timerStore";

export default function TaskTimer({ task, onTaskUpdated }) {
  const taskId = task._id || task.id;
  const global = timerGet();
  const isThisTaskRunning = global.taskId === taskId && global.startedAt !== null;

  const [running, setRunning] = useState(isThisTaskRunning);
  const [elapsed, setElapsed] = useState(isThisTaskRunning ? timerElapsed() : 0);
  const [saving,  setSaving]  = useState(false);
  const tickRef = useRef(null);

  // Always keep a ref to the latest task prop to avoid stale closures
  const taskRef = useRef(task);
  useEffect(() => { taskRef.current = task; }, [task]);

  useEffect(() => {
    if (isThisTaskRunning) {
      tickRef.current = setInterval(() => setElapsed(timerElapsed()), 1000);
    }
    return () => clearInterval(tickRef.current);
  }, []); // eslint-disable-line

  const start = () => {
    const g = timerGet();
    if (g.taskId && g.taskId !== taskId) {
      alert("Please stop the current timer before starting a new one.");
      return;
    }
    timerStart(taskId);
    setRunning(true);
    setElapsed(0);
    tickRef.current = setInterval(() => setElapsed(timerElapsed()), 1000);
  };

  const stop = async () => {
    clearInterval(tickRef.current);

    const finalElapsedSeconds = timerElapsed();
    // Convert to minutes, minimum 1 min if any time passed
    const elapsedMins = finalElapsedSeconds > 0
      ? Math.max(1, Math.round(finalElapsedSeconds / 60))
      : 0;

    // CUMULATIVE: add timer minutes on top of existing totalMinutes
    const currentTotal = parseInt(taskRef.current.totalMinutes) || 0;
    const newTotal = currentTotal + elapsedMins;

    // 1. Optimistic UI update immediately
    const optimisticTask = { ...taskRef.current, totalMinutes: newTotal };
    onTaskUpdated(optimisticTask);

    // 2. Reset timer state
    timerStop();
    setRunning(false);
    setElapsed(0);
    setSaving(true);

    try {
      // 3. Persist to backend
      const d = await taskAPI.update(taskId, { totalMinutes: newTotal });
      onTaskUpdated(d.task); // sync with server response
    } catch (e) {
      console.error("Timer save failed:", e);
      onTaskUpdated(taskRef.current); // revert on failure
    }
    setSaving(false);
  };

  const hh = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  if (saving) return <span style={{ fontSize: 11, color: "#9ca3af" }}>saving…</span>;

  if (running) {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span style={{
          fontFamily: "monospace", fontSize: 13, fontWeight: 700,
          color: "#dc2626", background: "#fef2f2",
          padding: "2px 8px", borderRadius: 6,
          border: "1px solid #fecaca",
          minWidth: 72, textAlign: "center",
        }}>
          {hh}:{mm}:{ss}
        </span>
        <button
          onClick={stop}
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 9px", borderRadius: 7,
            border: "1px solid #fca5a5", background: "#ef4444",
            color: "white", fontSize: 11, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          ⏹ Stop
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={start}
      title="Start timer"
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "3px 10px", borderRadius: 7,
        border: "1px solid #bbf7d0",
        background: "#f0fdf4",
        color: "#166534",
        fontSize: 11, fontWeight: 700,
        cursor: "pointer", fontFamily: "inherit",
      }}
    >
      ▶ Start
    </button>
  );
}