import React, { useEffect, useRef, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const data = [
  { week: 'Wk 1', calculus: 42, biology: 55, satMath: 60 },
  { week: 'Wk 2', calculus: 50, biology: 60, satMath: 65 },
  { week: 'Wk 3', calculus: 58, biology: 63, satMath: 72 },
  { week: 'Wk 4', calculus: 65, biology: 70, satMath: 76 },
  { week: 'Wk 5', calculus: 72, biology: 74, satMath: 81 },
  { week: 'Wk 6', calculus: 79, biology: 78, satMath: 86 },
];

const SUBJECTS = [
  { key: 'calculus', label: 'AP Calculus', color: '#3b82f6' },
  { key: 'biology', label: 'AP Biology', color: '#10b981' },
  { key: 'satMath', label: 'SAT Math', color: '#8b5cf6' },
];

export default function AnalyticsPreview({ theme }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(['calculus', 'biology', 'satMath']);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const toggleSubject = (key) => {
    setActive(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const gridColor = theme.isDark ? '#1f2937' : '#f1f5f9';

  return (
    <section id="analytics" ref={ref} style={{ padding: '80px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: theme.text, textAlign: 'center', marginBottom: 8, letterSpacing: '-0.02em' }}>
          Track mastery across every subject
        </h2>
        <p style={{ color: theme.textMuted, textAlign: 'center', marginBottom: 40, fontSize: 16 }}>
          See exactly how you're improving over time
        </p>

        {/* Subject toggles */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
          {SUBJECTS.map(s => (
            <button key={s.key} onClick={() => toggleSubject(s.key)} style={{
              padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 500,
              cursor: 'pointer', transition: 'all 200ms',
              background: active.includes(s.key) ? s.color : 'transparent',
              color: active.includes(s.key) ? '#fff' : theme.textMuted,
              border: `1.5px solid ${active.includes(s.key) ? s.color : theme.border}`,
            }}>
              {s.label}
            </button>
          ))}
        </div>

        <div style={{
          background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 20,
          padding: 32, boxShadow: theme.shadow,
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 700ms ease',
        }}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: theme.textMuted }} axisLine={false} tickLine={false} />
              <YAxis domain={[30, 100]} tick={{ fontSize: 12, fill: theme.textMuted }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip
                contentStyle={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 10, color: theme.text, fontSize: 13 }}
                formatter={(v, name) => [`${v}%`, SUBJECTS.find(s => s.key === name)?.label || name]}
              />
              {SUBJECTS.filter(s => active.includes(s.key)).map(s => (
                <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2.5}
                  dot={{ r: 5, fill: s.color, strokeWidth: 0 }} animationDuration={1200} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}