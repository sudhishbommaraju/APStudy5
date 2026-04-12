import React, { useState, useEffect, useRef } from 'react';

const AP_EXAM_DATES_2026 = [
  { subject: 'AP Human Geography',  date: '2026-05-05' },
  { subject: 'AP Chemistry',        date: '2026-05-05' },
  { subject: 'AP Psychology',       date: '2026-05-06' },
  { subject: 'AP US History',       date: '2026-05-07' },
  { subject: 'AP Calculus AB',      date: '2026-05-11' },
  { subject: 'AP Calculus BC',      date: '2026-05-11' },
  { subject: 'AP Physics 1',        date: '2026-05-12' },
  { subject: 'AP Statistics',       date: '2026-05-13' },
  { subject: 'AP Biology',          date: '2026-05-14' },
  { subject: 'AP World History',    date: '2026-05-14' },
  { subject: 'AP English Language', date: '2026-05-15' },
  { subject: 'AP US Gov & Politics',date: '2026-05-18' },
  { subject: 'AP Macroeconomics',   date: '2026-05-19' },
  { subject: 'AP Physics C',        date: '2026-05-19' },
  { subject: 'AP English Lit',      date: '2026-05-20' },
];

function getDaysUntil(dateStr) {
  return Math.max(0, Math.ceil((new Date(dateStr) - new Date()) / 86400000));
}

function getDayColor(days) {
  if (days <= 14) return '#ef4444';
  if (days <= 30) return '#f59e0b';
  return '#3b82f6';
}

export default function APExamCountdown({ theme }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const listRef = useRef(null);
  const itemRefs = useRef([]);

  const upcomingExams = AP_EXAM_DATES_2026
    .map(e => ({ ...e, days: getDaysUntil(e.date) }))
    .filter(e => e.days >= 0)
    .sort((a, b) => a.days - b.days);

  useEffect(() => {
    if (paused || upcomingExams.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex(i => (i + 1) % upcomingExams.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [paused, upcomingExams.length]);

  useEffect(() => {
    const el = itemRefs.current[activeIndex];
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeIndex]);

  return (
    <div style={{
      background: theme.card,
      border: `1px solid ${theme.border}`,
      borderRadius: 16,
      padding: 20,
      boxShadow: theme.isDark ? '0 0 0 1px #1f2937' : '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
          Upcoming AP Exams
        </p>
        <span style={{ fontSize: 11, color: theme.textMuted }}>2026 Schedule</span>
      </div>

      <div
        ref={listRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}
      >
        {upcomingExams.map((exam, i) => {
          const isActive = i === activeIndex;
          const dayColor = getDayColor(exam.days);
          return (
            <div
              key={exam.subject}
              ref={el => itemRefs.current[i] = el}
              onClick={() => setActiveIndex(i)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
                background: isActive
                  ? theme.isDark ? 'rgba(59,130,246,0.1)' : 'rgba(37,99,235,0.07)'
                  : 'transparent',
                borderLeft: isActive ? `3px solid ${dayColor}` : '3px solid transparent',
                transition: 'all 200ms ease',
              }}
            >
              <div>
                <p style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, color: theme.text, margin: 0 }}>
                  {exam.subject}
                </p>
                <p style={{ fontSize: 11, color: theme.textMuted, margin: '1px 0 0' }}>
                  {new Date(exam.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: dayColor, lineHeight: 1 }}>{exam.days}</span>
                <p style={{ fontSize: 10, color: theme.textMuted, margin: 0 }}>days</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}