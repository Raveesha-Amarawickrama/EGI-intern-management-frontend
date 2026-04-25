import React, { useState, useEffect, useCallback } from 'react';
import CalendarView  from '../../components/shared/Calendarview.jsx';
import { Toast }     from '../../components/shared/index.jsx';
import { useAuth }   from '../../hooks/useAuth';

const BASE      = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const getToken  = () => localStorage.getItem('egi_token');
const authHdrs  = () => ({ Authorization: `Bearer ${getToken()}` });

const STATUS_COLORS = {
  scheduled:  { bg:'#dbeafe', color:'#1d4ed8' },
  completed:  { bg:'#dcfce7', color:'#166534' },
  cancelled:  { bg:'#fee2e2', color:'#991b1b' },
};

export default function SchedulePage() {
  const { user }        = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState(null);
  const [selected, setSelected] = useState(null); // clicked day meetings
  const [detail,   setDetail]   = useState(null); // single meeting detail

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/meetings`, { headers: authHdrs() });
      const data = await res.json();
      setMeetings(data.meetings || []);
    } catch {
      setToast({ msg:'Failed to load meetings', type:'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Upcoming meetings (next 7 days)
  const upcoming = meetings
    .filter(m => {
      const d = new Date(m.date);
      const now = new Date();
      const in7 = new Date(); in7.setDate(now.getDate() + 7);
      return d >= now && d <= in7 && m.status !== 'cancelled';
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', { weekday:'short', day:'2-digit', month:'short', year:'numeric' });
  };

  return (
    <div className="animate-fadeUp">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Meeting detail modal */}
      {detail && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:28, width:'100%', maxWidth:480, boxShadow:'0 8px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
              <h3 style={{ margin:0, fontSize:17, fontWeight:700, color:'#1a2f1e' }}>{detail.title}</h3>
              <button onClick={() => setDetail(null)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9ca3af' }}>×</button>
            </div>
            {(() => {
              const sc = STATUS_COLORS[detail.status] || STATUS_COLORS.scheduled;
              return (
                <span style={{ ...sc, padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600, display:'inline-block', marginBottom:16 }}>
                  {detail.status}
                </span>
              );
            })()}
            <div style={{ display:'flex', flexDirection:'column', gap:10, fontSize:13, color:'#374151' }}>
              <div><span style={{ fontWeight:600, color:'#6b7280' }}>📅 Date: </span>{formatDate(detail.date)}</div>
              <div><span style={{ fontWeight:600, color:'#6b7280' }}>⏰ Time: </span>{detail.startTime} – {detail.endTime}</div>
              <div><span style={{ fontWeight:600, color:'#6b7280' }}>📍 Location: </span>{detail.location || 'Online'}</div>
              {detail.meetingLink && (
                <div>
                  <span style={{ fontWeight:600, color:'#6b7280' }}>🔗 Link: </span>
                  <a href={detail.meetingLink} target="_blank" rel="noreferrer" style={{ color:'#1D9E75' }}>{detail.meetingLink}</a>
                </div>
              )}
              {detail.description && (
                <div><span style={{ fontWeight:600, color:'#6b7280' }}>📝 Agenda: </span>{detail.description}</div>
              )}
              {detail.participants?.length > 0 && (
                <div>
                  <span style={{ fontWeight:600, color:'#6b7280' }}>👥 Participants: </span>
                  {detail.participants.map(p => p.name || p).join(', ')}
                </div>
              )}
              {detail.notes && (
                <div><span style={{ fontWeight:600, color:'#6b7280' }}>🗒️ Notes: </span>{detail.notes}</div>
              )}
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:20 }}>
              <button onClick={() => setDetail(null)}
                style={{ padding:'8px 20px', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Day meetings modal */}
      {selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:24, width:'100%', maxWidth:400, boxShadow:'0 8px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ margin:0, fontSize:16, fontWeight:700 }}>Meetings on this day</h3>
              <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9ca3af' }}>×</button>
            </div>
            {selected.meetings.length === 0 ? (
              <p style={{ color:'#9ca3af', fontSize:13 }}>No meetings scheduled.</p>
            ) : selected.meetings.map(m => (
              <div key={m._id}
                onClick={() => { setDetail(m); setSelected(null); }}
                style={{ padding:'10px 14px', borderRadius:8, border:'1px solid #e5e7eb', marginBottom:8, cursor:'pointer', transition:'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background='#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background='#fff'}
              >
                <div style={{ fontWeight:600, fontSize:13 }}>{m.title}</div>
                <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{m.startTime} – {m.endTime} · {m.location || 'Online'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:24 }}>
        {/* Calendar */}
        <div>
          {loading ? (
            <div style={{ padding:60, textAlign:'center' }}><div className="spinner" style={{ margin:'0 auto' }}/></div>
          ) : (
            <CalendarView
              meetings={meetings}
              onDayClick={(day, dayMeetings) => setSelected({ day, meetings: dayMeetings })}
            />
          )}
        </div>

        {/* Upcoming sidebar */}
        <div>
          <div className="card">
            <div className="card-header"><div className="card-title">📅 Upcoming (7 days)</div></div>
            <div style={{ padding:'0 0 8px' }}>
              {upcoming.length === 0 ? (
                <div style={{ padding:'20px 20px', color:'#9ca3af', fontSize:13 }}>No upcoming meetings.</div>
              ) : upcoming.map(m => {
                const sc = STATUS_COLORS[m.status] || STATUS_COLORS.scheduled;
                return (
                  <div key={m._id}
                    onClick={() => setDetail(m)}
                    style={{ padding:'12px 20px', borderBottom:'1px solid #f9fafb', cursor:'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background='#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background='#fff'}
                  >
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                      <div style={{ fontWeight:600, fontSize:13, color:'#111' }}>{m.title}</div>
                      <span style={{ ...sc, padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:600, whiteSpace:'nowrap' }}>
                        {m.status}
                      </span>
                    </div>
                    <div style={{ fontSize:11, color:'#9ca3af', marginTop:4 }}>
                      {formatDate(m.date)} · {m.startTime}
                    </div>
                    <div style={{ fontSize:11, color:'#9ca3af' }}>📍 {m.location || 'Online'}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All meetings count */}
          <div className="card" style={{ marginTop:16 }}>
            <div className="card-body">
              {[
                ['Scheduled', meetings.filter(m=>m.status==='scheduled').length, '#dbeafe','#1d4ed8'],
                ['Completed', meetings.filter(m=>m.status==='completed').length, '#dcfce7','#166534'],
                ['Cancelled', meetings.filter(m=>m.status==='cancelled').length, '#fee2e2','#991b1b'],
              ].map(([label, count, bg, color]) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f9fafb' }}>
                  <span style={{ fontSize:13, color:'#6b7280' }}>{label}</span>
                  <span style={{ fontSize:13, fontWeight:700, background:bg, color, padding:'1px 10px', borderRadius:20 }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}