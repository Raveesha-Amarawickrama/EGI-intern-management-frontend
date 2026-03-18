import { useState, useEffect, useRef } from "react";
import { taskAPI } from "../../utils/api";
import { formatMinutes } from "../../utils/helpers";


export default function TaskTimer({ task, onTaskUpdated }) {
  const [running,   setRunning]   = useState(false);
  const [elapsed,   setElapsed]   = useState(0);   
  const [saving,    setSaving]    = useState(false);
  const startRef  = useRef(null);
  const tickRef   = useRef(null);


  useEffect(() => () => clearInterval(tickRef.current), []);

  const start = () => {
    startRef.current = Date.now();
    setElapsed(0);
    setRunning(true);
    tickRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
  };

  const stop = async () => {
    clearInterval(tickRef.current);
    setRunning(false);

    const elapsedMins = Math.max(1, Math.round(elapsed / 60)); // min 1 minute
    const newTotal    = (parseInt(task.totalMinutes) || 0) + elapsedMins;

    setSaving(true);
    try {
      const d = await taskAPI.update(task._id || task.id, { totalMinutes: newTotal });
      onTaskUpdated(d.task);
    } catch (e) {
      console.error("Timer save failed:", e);
    }
    setSaving(false);
    setElapsed(0);
  };

  
  const hh = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  if (saving) {
    return (
      <span style={{ fontSize: 11, color: "#9ca3af" }}>saving…</span>
    );
  }

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
          title="Stop timer and save"
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 9px", borderRadius: 7,
            border: "1px solid #fca5a5", background: "#ef4444",
            color: "white", fontSize: 11, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
            transition: "all .15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#dc2626"}
          onMouseLeave={e => e.currentTarget.style.background = "#ef4444"}
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
        border: "1px solid #bbf7d0", background: "#f0fdf4",
        color: "#166534", fontSize: 11, fontWeight: 700,
        cursor: "pointer", fontFamily: "inherit",
        transition: "all .15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "#dcfce7"; e.currentTarget.style.borderColor = "#4ade80"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "#f0fdf4"; e.currentTarget.style.borderColor = "#bbf7d0"; }}
    >
      ▶ Start
    </button>
  );
}