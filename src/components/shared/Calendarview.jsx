import React, { useState } from 'react';

const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const CalendarView = ({ meetings = [], onDayClick }) => {
  const today         = new Date();
  const [cur, setCur] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const firstDay  = new Date(cur.year, cur.month, 1).getDay();
  const daysCount = new Date(cur.year, cur.month + 1, 0).getDate();

  const prev = () => setCur(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 });
  const next = () => setCur(c => c.month === 11 ? { year: c.year + 1, month: 0  } : { ...c, month: c.month + 1 });

  const getMeetingsForDay = (day) => {
    return meetings.filter(m => {
      const d = new Date(m.date);
      return (
        d.getFullYear() === cur.year &&
        d.getMonth()    === cur.month &&
        d.getDate()     === day
      );
    });
  };

  const isToday = (day) =>
    day === today.getDate() &&
    cur.month === today.getMonth() &&
    cur.year  === today.getFullYear();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysCount; d++) cells.push(d);

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>

      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: '#1a2f1e' }}>
        <button onClick={prev} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>‹</button>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>{MONTHS[cur.month]} {cur.year}</span>
        <button onClick={next} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>›</button>
      </div>

      {/* Day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#f9fafb' }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', padding: '8px 0', fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '.5px' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid — gridAutoRows locks every row to the same height */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 90, gap: 1, background: '#e5e7eb' }}>
        {cells.map((day, i) => {
          const dayMeetings = day ? getMeetingsForDay(day) : [];
          return (
            <div
              key={i}
              onClick={() => day && onDayClick && onDayClick(day, dayMeetings)}
              style={{
                background: '#fff',
                height: 90,
                boxSizing: 'border-box',
                padding: '6px 8px',
                overflow: 'hidden',
                cursor: day ? 'pointer' : 'default',
                transition: 'background .15s',
              }}
              onMouseEnter={e => { if (day) e.currentTarget.style.background = '#f9fafb'; }}
              onMouseLeave={e => { if (day) e.currentTarget.style.background = '#fff'; }}
            >
              {day && (
                <>
                  {/* Day number */}
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: isToday(day) ? 700 : 400,
                    background: isToday(day) ? '#1D9E75' : 'transparent',
                    color: isToday(day) ? '#fff' : '#374151',
                    marginBottom: 3,
                    flexShrink: 0,
                  }}>
                    {day}
                  </div>

                  {/* Meeting pills — max 2 visible */}
                  {dayMeetings.slice(0, 2).map((m, idx) => (
                    <div key={idx} style={{
                      background: '#e1f5ee',
                      color: '#0F6E56',
                      fontSize: 10,
                      padding: '2px 5px',
                      borderRadius: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: 2,
                    }}>
                      {m.title}
                    </div>
                  ))}

                  {dayMeetings.length > 2 && (
                    <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>
                      +{dayMeetings.length - 2} more
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;