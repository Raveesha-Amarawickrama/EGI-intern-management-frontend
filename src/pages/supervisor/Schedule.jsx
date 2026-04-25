import React, { useState, useEffect, useCallback } from 'react';
import CalendarView  from '../../components/shared/Calendarview.jsx';
import MeetingModal  from '../../components/shared/Meetingmodal.jsx';
import { Toast }     from '../../components/shared/index.jsx';
import { useAuth }   from '../../hooks/useAuth';

const BASE     = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('egi_token');
const authHdrs = () => ({
  Authorization: `Bearer ${getToken()}`,
  'Content-Type': 'application/json',
});

const STATUS_COLORS = {
  scheduled: { bg:'#dbeafe', color:'#1d4ed8' },
  completed: { bg:'#dcfce7', color:'#166534' },
  cancelled: { bg:'#fee2e2', color:'#991b1b' },
};

export default function SupervisorSchedulePage() {
  const { user }   = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState(null);
  const [showModal,  setShowModal]  = useState(false);
  const [editMeeting, setEditMeeting] = useState(null);
  const [selected,   setSelected]   = useState(null);
  const [detail,     setDetail]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, uRes] = await Promise.all([
        fetch(`${BASE}/meetings`, { headers: { Authorization:`Bearer ${getToken()}` } }),
        fetch(`${BASE}/users`,    { headers: { Authorization:`Bearer ${getToken()}` } }),
      ]);
      const mData = await mRes.json();
      const uData = await uRes.json();
      setMeetings(mData.meetings || []);
      setUsers(uData.users || []);
    } catch {
      setToast({ msg:'Failed to load data', type:'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    try {
      const url    = editMeeting ? `${BASE}/meetings/${editMeeting._id}` : `${BASE}/meetings`;
      const method = editMeeting ? 'PATCH' : 'POST';
      const res    = await fetch(url, { method, headers: authHdrs(), body: JSON.stringify(form) });
      const data   = await res.json();
      if (!res.ok) throw new Error(data.message || 'Save failed');
      if (editMeeting) {
        setMeetings(ms => ms.map(m => m._id === editMeeting._id ? data.meeting : m));
        setToast({ msg:'Meeting updated!', type:'success' });
      } else {
        setMeetings(ms => [data.meeting, ...ms]);
        setToast({ msg:'Meeting scheduled!', type:'success' });
      }
      setShowModal(false);
      setEditMeeting(null);
    } catch (e) {
      setToast({ msg: e.message, type:'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this meeting?')) return;
    try {
      const res = await fetch(`${BASE}/meetings/${id}`, {
        method:'DELETE', headers:{ Authorization:`Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      setMeetings(ms => ms.filter(m => m._id !== id));
      setDetail(null);
      setToast({ msg:'Meeting deleted.', type:'success' });
    } catch (e) {
      setToast({ msg: e.message, type:'error' });
    }
  };

  const handleStatus = async (id, status) => {
    try {
      const res  = await fetch(`${BASE}/meetings/${id}/status`, {
        method:'PATCH', headers: authHdrs(), body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMeetings(ms => ms.map(m => m._id === id ? data.meeting : m));
      setDetail(data.meeting);
    } catch (e) {
      setToast({ msg: e.message, type:'error' });
    }
  };

  const upcoming = meetings
    .filter(m => {
      const d   = new Date(m.date);
      const now = new Date();
      const in7 = new Date(); in7.setDate(now.getDate() + 7);
      return d >= now && d <= in7 && m.status !== 'cancelled';
    })
    .sort((a,b) => new Date(a.date) - new Date(b.date));

  const formatDate = (ds) => !ds ? '' :
    new Date(ds).toLocaleDateString('en-GB', { weekday:'short', day:'2-digit', month:'short', year:'numeric' });

  return (
    <div className="animate-fadeUp">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {showModal && (
        <MeetingModal
          meeting={editMeeting}
          users={users}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditMeeting(null); }}
        />
      )}

      {/* Meeting detail modal */}
      {detail && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:28, width:'100%', maxWidth:520, boxShadow:'0 8px 40px rgba(0,0,0,0.15)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
              <h3 style={{ margin:0, fontSize:17, fontWeight:700, color:'#1a2f1e' }}>{detail.title}</h3>
              <button onClick={() => setDetail(null)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9ca3af' }}>×</button>
            </div>

            {/* Status badges + change */}
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
              {['scheduled','completed','cancelled'].map(s => {
                const sc = STATUS_COLORS[s] || STATUS_COLORS.scheduled;
                return (
                  <button key={s} onClick={() => handleStatus(detail._id, s)} style={{
                    ...sc, padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:600,
                    border: detail.status === s ? '2px solid currentColor' : '1px solid transparent',
                    cursor:'pointer', fontFamily:'inherit',
                  }}>
                    {s.charAt(0).toUpperCase()+s.slice(1)}
                  </button>
                );
              })}
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:10, fontSize:13, color:'#374151' }}>
              <div><span style={{ fontWeight:600, color:'#6b7280' }}>📅 Date: </span>{formatDate(detail.date)}</div>
              <div><span style={{ fontWeight:600, color:'#6b7280' }}>⏰ Time: </span>{detail.startTime} – {detail.endTime}</div>
              <div><span style={{ fontWeight:600, color:'#6b7280' }}>📍 Location: </span>{detail.location || 'Online'}</div>
              {detail.meetingLink && (
                <div><span style={{ fontWeight:600, color:'#6b7280' }}>🔗 Link: </span>
                  <a href={detail.meetingLink} target="_blank" rel="noreferrer" style={{ color:'#1D9E75' }}>{detail.meetingLink}</a>
                </div>
              )}
              {detail.description && <div><span style={{ fontWeight:600, color:'#6b7280' }}>📝 Agenda: </span>{detail.description}</div>}
              {detail.participants?.length > 0 && (
                <div><span style={{ fontWeight:600, color:'#6b7280' }}>👥 Participants: </span>
                  {detail.participants.map(p => p.name || p).join(', ')}
                </div>
              )}
            </div>

            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:20 }}>
              <button onClick={() => handleDelete(detail._id)}
                style={{ padding:'8px 16px', borderRadius:8, border:'1px solid #fecaca', background:'#fff5f5', color:'#991b1b', cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>
                🗑 Delete
              </button>
              <button onClick={() => { setEditMeeting(detail); setDetail(null); setShowModal(true); }}
                style={{ padding:'8px 16px', borderRadius:8, border:'1px solid #e5e7eb', background:'#f9fafb', cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>
                ✏️ Edit
              </button>
              <button onClick={() => setDetail(null)}
                style={{ padding:'8px 20px', borderRadius:8, border:'none', background:'#1a2f1e', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit' }}>
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
              <h3 style={{ margin:0, fontSize:16, fontWeight:700 }}>Meetings</h3>
              <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#9ca3af' }}>×</button>
            </div>
            {selected.meetings.length === 0 ? (
              <p style={{ color:'#9ca3af', fontSize:13 }}>No meetings. <button onClick={() => { setSelected(null); setShowModal(true); }} style={{ color:'#1D9E75', background:'none', border:'none', cursor:'pointer', fontWeight:600, fontFamily:'inherit' }}>Schedule one?</button></p>
            ) : selected.meetings.map(m => (
              <div key={m._id}
                onClick={() => { setDetail(m); setSelected(null); }}
                style={{ padding:'10px 14px', borderRadius:8, border:'1px solid #e5e7eb', marginBottom:8, cursor:'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background='#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background='#fff'}
              >
                <div style={{ fontWeight:600, fontSize:13 }}>{m.title}</div>
                <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{m.startTime} – {m.endTime}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:20 }}>
        <button className="btn btn-primary" onClick={() => { setEditMeeting(null); setShowModal(true); }}>
          + Schedule Meeting
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:24 }}>
        {loading ? (
          <div style={{ padding:60, textAlign:'center' }}><div className="spinner" style={{ margin:'0 auto' }}/></div>
        ) : (
          <CalendarView
            meetings={meetings}
            onDayClick={(day, dayMeetings) => setSelected({ day, meetings: dayMeetings })}
          />
        )}

        <div>
          <div className="card" style={{ marginBottom:16 }}>
            <div className="card-header"><div className="card-title">📅 Upcoming</div></div>
            {upcoming.length === 0 ? (
              <div style={{ padding:'16px 20px', color:'#9ca3af', fontSize:13 }}>None in next 7 days.</div>
            ) : upcoming.map(m => {
              const sc = STATUS_COLORS[m.status] || STATUS_COLORS.scheduled;
              return (
                <div key={m._id}
                  onClick={() => setDetail(m)}
                  style={{ padding:'12px 20px', borderBottom:'1px solid #f9fafb', cursor:'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background='#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.background='#fff'}
                >
                  <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
                    <div style={{ fontWeight:600, fontSize:13 }}>{m.title}</div>
                    <span style={{ ...sc, padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:600, whiteSpace:'nowrap' }}>{m.status}</span>
                  </div>
                  <div style={{ fontSize:11, color:'#9ca3af', marginTop:3 }}>{formatDate(m.date)} · {m.startTime}</div>
                </div>
              );
            })}
          </div>

          <div className="card">
            <div className="card-body">
              {[['All',meetings.length,'#f3f4f6','#374151'],['Scheduled',meetings.filter(m=>m.status==='scheduled').length,'#dbeafe','#1d4ed8'],['Completed',meetings.filter(m=>m.status==='completed').length,'#dcfce7','#166534'],['Cancelled',meetings.filter(m=>m.status==='cancelled').length,'#fee2e2','#991b1b']].map(([l,n,bg,c]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f9fafb' }}>
                  <span style={{ fontSize:13, color:'#6b7280' }}>{l}</span>
                  <span style={{ fontSize:13, fontWeight:700, background:bg, color:c, padding:'1px 10px', borderRadius:20 }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}