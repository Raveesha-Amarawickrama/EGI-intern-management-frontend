import React, { useState } from 'react';

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const STATUS_COLORS = {
  draft:     { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af' },
  scheduled: { bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' },
  published: { bg: '#dcfce7', color: '#166534', dot: '#22c55e' },
  rejected:  { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
};

const PLATFORM_ICONS = {
  instagram: '📸',
  facebook:  '📘',
  twitter:   '🐦',
  linkedin:  '💼',
  tiktok:    '🎵',
  youtube:   '▶️',
  other:     '🌐',
};

const ContentCalendar = ({ posts = [], onDayClick, onPostClick }) => {
  const today         = new Date();
  const [cur, setCur] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const firstDay  = new Date(cur.year, cur.month, 1).getDay();
  const daysCount = new Date(cur.year, cur.month + 1, 0).getDate();

  const prev = () =>
    setCur(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 });
  const next = () =>
    setCur(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 });

  const getPostsForDay = (day) => {
    const dateStr = `${cur.year}-${String(cur.month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return posts.filter(p => {
      const d = p.scheduledDate ? p.scheduledDate.split('T')[0] : null;
      return d === dateStr;
    });
  };

  const isToday = (day) =>
    day === today.getDate() &&
    cur.month === today.getMonth() &&
    cur.year === today.getFullYear();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysCount; d++) cells.push(d);

  // Count by status for header summary
  const counts = { draft:0, scheduled:0, published:0, rejected:0 };
  posts.forEach(p => { if (counts[p.status] !== undefined) counts[p.status]++; });

  return (
    <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e5e7eb', overflow:'hidden' }}>
      {/* Top summary bar */}
      <div style={{ display:'flex', gap:16, padding:'10px 20px', borderBottom:'1px solid #f1f5f9', flexWrap:'wrap' }}>
        {Object.entries(counts).map(([st, n]) => {
          const c = STATUS_COLORS[st] || STATUS_COLORS.draft;
          return (
            <div key={st} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:c.dot, display:'inline-block' }}/>
              <span style={{ color:'#6b7280', textTransform:'capitalize' }}>{st}</span>
              <span style={{ fontWeight:700, color:'#111' }}>{n}</span>
            </div>
          );
        })}
      </div>

      {/* Month nav */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', background:'#1a2f1e' }}>
        <button onClick={prev} style={{ background:'none', border:'none', color:'#fff', fontSize:20, cursor:'pointer', lineHeight:1 }}>‹</button>
        <span style={{ color:'#fff', fontWeight:600, fontSize:15 }}>{MONTHS[cur.month]} {cur.year}</span>
        <button onClick={next} style={{ background:'none', border:'none', color:'#fff', fontSize:20, cursor:'pointer', lineHeight:1 }}>›</button>
      </div>

      {/* Day labels */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', background:'#f9fafb' }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign:'center', padding:'8px 0', fontSize:11, fontWeight:600, color:'#9ca3af', letterSpacing:'.5px' }}>{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:1, background:'#e5e7eb' }}>
        {cells.map((day, i) => {
          const dayPosts = day ? getPostsForDay(day) : [];
          return (
            <div
              key={i}
              onClick={() => day && onDayClick && onDayClick(day, dayPosts)}
              style={{
                background: '#fff',
                minHeight: 80,
                padding: '6px 6px 4px',
                cursor: day ? 'pointer' : 'default',
                transition: 'background .15s',
              }}
              onMouseEnter={e => { if (day) e.currentTarget.style.background = '#f9fafb'; }}
              onMouseLeave={e => { if (day) e.currentTarget.style.background = '#fff'; }}
            >
              {day && (
                <>
                  <div style={{
                    width:24, height:24, borderRadius:'50%',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:12, fontWeight: isToday(day) ? 700 : 400,
                    background: isToday(day) ? '#1D9E75' : 'transparent',
                    color: isToday(day) ? '#fff' : '#374151',
                    marginBottom:3,
                  }}>{day}</div>
                  {dayPosts.slice(0, 2).map((p, idx) => {
                    const c   = STATUS_COLORS[p.status] || STATUS_COLORS.draft;
                    const ico = PLATFORM_ICONS[p.platform] || '🌐';
                    return (
                      <div
                        key={idx}
                        onClick={e => { e.stopPropagation(); onPostClick && onPostClick(p); }}
                        style={{
                          background: c.bg, color: c.color,
                          fontSize:10, padding:'2px 5px', borderRadius:4,
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                          marginBottom:2, cursor:'pointer',
                        }}
                      >
                        {ico} {p.title || p.content?.slice(0,20) || 'Post'}
                      </div>
                    );
                  })}
                  {dayPosts.length > 2 && (
                    <div style={{ fontSize:10, color:'#9ca3af' }}>+{dayPosts.length - 2} more</div>
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

export default ContentCalendar;