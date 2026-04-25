import React, { useState, useEffect } from 'react';

const inputStyle = {
  width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #ddd',
  fontSize: 13, outline: 'none', boxSizing: 'border-box', marginTop: 4,
};

const MeetingModal = ({ meeting, users, onSave, onClose }) => {
  const [form, setForm] = useState({
    title: '', description: '', date: '', startTime: '', endTime: '',
    location: 'Online', meetingLink: '', participants: [], notes: '',
  });

  useEffect(() => {
    if (meeting) {
      setForm({
        ...meeting,
        date: meeting.date ? new Date(meeting.date).toISOString().split('T')[0] : '',
        participants: meeting.participants?.map(p => p._id || p) || [],
      });
    }
  }, [meeting]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleParticipant = (id) => {
    setForm(f => ({
      ...f,
      participants: f.participants.includes(id)
        ? f.participants.filter(p => p !== id)
        : [...f.participants, id],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17 }}>{meeting ? 'Edit Meeting' : 'Schedule Meeting'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' }}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>Title *</label>
            <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} required placeholder="Meeting title" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>Date *</label>
              <input style={inputStyle} type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>Start *</label>
              <input style={inputStyle} type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>End *</label>
              <input style={inputStyle} type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} required />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>Location</label>
            <input style={inputStyle} value={form.location} onChange={e => set('location', e.target.value)} placeholder="Online / Office" />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>Meeting Link</label>
            <input style={inputStyle} value={form.meetingLink} onChange={e => set('meetingLink', e.target.value)} placeholder="https://meet.google.com/..." />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Participants</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {users.map(u => (
                <label key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer',
                  padding: '4px 10px', borderRadius: 20, border: '1px solid',
                  borderColor: form.participants.includes(u._id) ? '#1D9E75' : '#ddd',
                  background: form.participants.includes(u._id) ? '#e1f5ee' : '#fff',
                  color: form.participants.includes(u._id) ? '#0F6E56' : '#555' }}>
                  <input type="checkbox" style={{ display: 'none' }}
                    checked={form.participants.includes(u._id)}
                    onChange={() => toggleParticipant(u._id)} />
                  {u.name} ({u.role})
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>Description</label>
            <textarea style={{ ...inputStyle, height: 70, resize: 'vertical' }}
              value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Agenda or description..." />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose}
              style={{ padding: '8px 20px', borderRadius: 7, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 13 }}>
              Cancel
            </button>
            <button type="submit"
              style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: '#1a2f1e', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              {meeting ? 'Update' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MeetingModal;