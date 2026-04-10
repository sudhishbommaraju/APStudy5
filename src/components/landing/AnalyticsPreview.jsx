import React, { useEffect, useRef, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from 'recharts';

const data = [
  { week: 'W1', Biology: 42, Calculus: 55, History: 38 },
  { week: 'W2', Biology: 51, Calculus: 60, History: 45 },
  { week: 'W3', Biology: 60, Calculus: 65, History: 52 },
  { week: 'W4', Biology: 68, Calculus: 72, History: 58 },
  { week: 'W5', Biology: 74, Calculus: 78, History: 65 },
  { week: 'W6', Biology: 81, Calculus: 83, History: 71 },
  { week: 'W7', Biology: 86, Calculus: 88, History: 78 },
];

const SUBJECTS = ['Biology', 'Calculus', 'History'];
const COLORS = { Biology: '#3b82f6', Calculus: '#8b5cf6', History: '#10b981' };

export default function AnalyticsPreview({ isDark }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(new Set(SUBJECTS));

  const bg = isDark ? '#0d1117' : '#f8fafc';
  const card = isDark ? '#111827' : '#ffffff';
  const text = isDark ? '#e5e7eb' : '#0f172a';
  const muted = isDark ? '#6b7280' : '#64748b';
  const border = isDark ? '#1f2937' : '#e2e8f0';
  const gridColor = isDark ? '#1f2937' : '#e2e8f0';

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const toggle = (s) => setActive(prev => {
    const next = new Set(prev);
    next.has(s) ? next.delete(s) : next.add(s);
    return next;
  });

  return (
    <section ref={ref} className="py-24" style={{ background: bg }} id="analytics-preview">
      <div className="max-w-[1200px] mx-auto px-6">
        <div
          className="text-center mb-12 transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)' }}
        >
          <h2
            className="text-4xl font-bold mb-3"
            style={{ color: text, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
          >
            Live mastery tracking
          </h2>
          <p style={{ color: muted }}>Watch your progress across every subject in real time.</p>
        </div>

        <div
          className="rounded-2xl p-8 transition-all duration-700"
          style={{
            background: card,
            border: `1px solid ${border}`,
            boxShadow: isDark ? '0 0 40px rgba(59,130,246,0.08)' : '0 8px 40px rgba(0,0,0,0.06)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(24px)',
            transitionDelay: '150ms',
          }}
        >
          {/* Subject toggles */}
          <div className="flex flex-wrap gap-3 mb-8">
            {SUBJECTS.map(s => (
              <button
                key={s}
                onClick={() => toggle(s)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: active.has(s) ? COLORS[s] + (isDark ? '22' : '15') : 'transparent',
                  color: active.has(s) ? COLORS[s] : muted,
                  border: `1.5px solid ${active.has(s) ? COLORS[s] : border}`,
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: muted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: muted }} axisLine={false} tickLine={false} domain={[30, 100]} />
              <Tooltip
                contentStyle={{ background: card, border: `1px solid ${border}`, borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: text, fontWeight: 600 }}
              />
              {SUBJECTS.filter(s => active.has(s)).map(s => (
                <Line
                  key={s}
                  type="monotone"
                  dataKey={s}
                  stroke={COLORS[s]}
                  strokeWidth={2.5}
                  dot={{ fill: COLORS[s], r: 4 }}
                  activeDot={{ r: 6 }}
                  animationDuration={1600}
                  isAnimationActive={visible}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}