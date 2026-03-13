
import { formatMinutes } from "../../utils/helpers";

const TARGET = 30 * 60;


export function WeeklyHoursBar({ weekMins = 0, compact = false, noTarget = false }) {
  const pct   = Math.min(100, Math.round((weekMins / TARGET) * 100));
  const left  = Math.max(0, TARGET - weekMins);
  const color = pct >= 100 ? "#16a34a" : pct >= 60 ? "#1d4ed8" : "#d97706";

  if (compact) {
    return (
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ flex:1, height:7, background:"#e5e7eb", borderRadius:4, overflow:"hidden" }}>
          <div style={{ height:"100%", width:pct+"%", background:color, borderRadius:4, transition:"width .4s" }}/>
        </div>
        <span style={{ fontSize:11, fontWeight:700, color, minWidth:32, textAlign:"right" }}>{pct}%</span>
        {noTarget
          ? <span style={{ fontSize:11, color:"#9ca3af" }}>{formatMinutes(weekMins)}</span>
          : <span style={{ fontSize:11, color:"#9ca3af" }}>{formatMinutes(weekMins)}/30h</span>
        }
      </div>
    );
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, alignItems:"center" }}>
        <span style={{ fontSize:12, color:"#6b7280" }}>⏱ This Week</span>
        <span style={{ fontSize:13, fontWeight:700, color }}>
          {noTarget
            ? `${formatMinutes(weekMins)} (${pct}%)`
            : `${formatMinutes(weekMins)} / 30h (${pct}%)`
          }
        </span>
      </div>
      <div style={{ height:9, background:"#e5e7eb", borderRadius:5, overflow:"hidden" }}>
        <div style={{ height:"100%", width:pct+"%", background:`linear-gradient(90deg,${color},${color}bb)`, borderRadius:5, transition:"width .4s" }}/>
      </div>
      <p style={{ fontSize:11, fontWeight:600, marginTop:5, color }}>
        {pct >= 100
          ? "Great work this week!"
          : noTarget
            ? `⚡ ${formatMinutes(weekMins)} logged this week`
            : `${formatMinutes(left)} remaining to reach your 30h goal`
        }
      </p>
    </div>
  );
}

export default function WeeklyHoursCard({ tasks = [], weekMins: propMins, noTarget = false }) {
  const weekMins = propMins !== undefined ? propMins : (() => {
    const now = new Date();
    const mon = new Date(now);
    mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    mon.setHours(0, 0, 0, 0);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    sun.setHours(23, 59, 59, 999);
    return tasks
      .filter(t => { const d = new Date(t.date); return d >= mon && d <= sun; })
      .reduce((s, t) => s + (parseInt(t.totalMinutes) || 0), 0);
  })();

  const pct   = Math.min(100, Math.round((weekMins / TARGET) * 100));
  const color = pct >= 100 ? "#16a34a" : pct >= 60 ? "#1d4ed8" : "#d97706";
  const left  = Math.max(0, TARGET - weekMins);

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">⏱ Weekly Hours</div>
        <span style={{
          fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99,
          background: pct >= 100 ? "#dcfce7" : pct >= 60 ? "#dbeafe" : "#fef3c7",
          color:      pct >= 100 ? "#166534" : pct >= 60 ? "#1e40af" : "#92400e",
        }}>{pct}%</span>
      </div>
      <div className="card-body">
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
          <span style={{ fontSize:12, color:"#6b7280" }}>
            {noTarget ? "Hours logged this week" : "Progress toward 30h target"}
          </span>
          <span style={{ fontSize:13, fontWeight:700 }}>
            {noTarget ? formatMinutes(weekMins) : `${formatMinutes(weekMins)} / 30h`}
          </span>
        </div>
        <div style={{ height:12, background:"#f1f5f9", borderRadius:6, overflow:"hidden", marginBottom:8 }}>
          <div style={{ height:"100%", width:pct+"%", background:`linear-gradient(90deg,${color},${color}99)`, borderRadius:6, transition:"width .5s" }}/>
        </div>
        <p style={{ fontSize:12, fontWeight:600, color }}>
          {pct >= 100
            ? "Great work this week!"
            : noTarget
              ? `⚡ ${formatMinutes(weekMins)} logged so far`
              : `⚡ ${formatMinutes(left)} more to reach your weekly goal`
          }
        </p>

        <div style={{ display:"grid", gridTemplateColumns:`repeat(${noTarget ? 2 : 3}, 1fr)`, gap:10, marginTop:16, textAlign:"center" }}>
          {[
            ["Mon–Sun", formatMinutes(weekMins), color],
            ...(noTarget ? [] : [["Target", "30h", "#6b7280"]]),
            ["Daily ~", "6h", "#6b7280"],
          ].map(([l, v, c]) => (
            <div key={l} style={{ background:"#f8fafc", borderRadius:10, padding:"10px 6px" }}>
              <div style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:17, color:c }}>{v}</div>
              <div style={{ fontSize:10, color:"#9ca3af", fontWeight:600, textTransform:"uppercase", letterSpacing:".5px", marginTop:3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}