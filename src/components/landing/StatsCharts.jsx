import React, { useEffect, useRef, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

const scoreData = [
  { month: 'Jan', score: 1180 }, { month: 'Feb', score: 1230 }, { month: 'Mar', score: 1275 },
  { month: 'Apr', score: 1310 }, { month: 'May', score: 1350 }, { month: 'Jun', score: 1390 },
];

const studyTimeData = [
  { day: 'Mon', mins: 45 }, { day: 'Tue', mins: 70 }, { day: 'Wed', mins: 55 },
  { day: 'Thu', mins: 80 }, { day: 'Fri', mins: 65 }, { day: 'Sat', mins: 95 }, { day: 'Sun', mins: 40 },
];

const masteryData = [
  { week: 'W1', mastery: 38 }, { week: 'W2', mastery: 47 }, { week: 'W3', mastery: 56 },
  { week: 'W4', mastery: 62 }, { week: 'W5', mastery: 71 }, { week: 'W6', mastery: 79 }, { week: 'W7', mastery: 86 },
];

function ChartCard({ isDark, title, subtitle, children }) {
  const bg = isDark ? '#111827' : '#f8fafc';
  const border = isDark ? '#1f2937' : '#e2e8f0';
  const text = isDark ? '#e5e7eb' : '#0f172a';
  const muted = isDark ? '#6b7280' : '#94a3b8';

  return (
    <div
      className="rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1"
      style={{
        background: bg,
        border: `1px solid ${border}`,
        boxShadow: isDark ? '0 0 0 1px rgba(59,130,246,0.08), 0 8px 32px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.06)',
      }}
    >
      <p className="text-sm font-semibold mb-0.5" style={{ color: text }}>{title}</p>
      <p className="text-xs mb-5" style={{ color: muted }}>{subtitle}</p>
      {children}
    </div>
  );
}

export default function StatsCharts({ isDark }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const bg = isDark ? '#0b0f14' : '#ffffff';
  const muted = isDark ? '#374151' : '#e2e8f0';
  const mutedText = isDark ? '#6b7280' : '#94a3b8';
  const text = isDark ? '#e5e7eb' : '#0f172a';
  const accent = isDark ? '#3b82f6' : '#2563eb';

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const tooltipStyle = {
    contentStyle: { background: isDark ? '#1f2937' : '#fff', border: `1px solid ${muted}`, borderRadius: 8, fontSize: 12 },
    labelStyle: { color: text },
  };

  return (
    <section ref={ref} className="py-24" style={{ background: bg }} id="analytics">
      <div className="max-w-[1200px] mx-auto px-6">
        <div
          className="text-center mb-14 transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)' }}
        >
          <h2
            className="text-4xl font-bold mb-3"
            style={{ color: text, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
          >
            Results that speak for themselves
          </h2>
          <p className="text-base" style={{ color: mutedText }}>Real data from real students on the platform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Score improvement */}
          <div
            className="transition-all duration-700"
            style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)', transitionDelay: '100ms' }}
          >
            <ChartCard isDark={isDark} title="Avg. Score Improvement" subtitle="SAT composite over 6 months">
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={muted} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: mutedText }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: mutedText }} axisLine={false} tickLine={false} domain={[1100, 1450]} />
                  <Tooltip {...tooltipStyle} />
                  <Line
                    type="monotone" dataKey="score" stroke={accent} strokeWidth={2.5}
                    dot={{ fill: accent, r: 3 }} animationDuration={1800}
                    isAnimationActive={visible}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Study time */}
          <div
            className="transition-all duration-700"
            style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)', transitionDelay: '200ms' }}
          >
            <ChartCard isDark={isDark} title="Daily Study Time" subtitle="Average minutes per day">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={studyTimeData} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke={muted} vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: mutedText }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: mutedText }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="mins" fill={accent} radius={[4, 4, 0, 0]} isAnimationActive={visible} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Mastery */}
          <div
            className="transition-all duration-700"
            style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)', transitionDelay: '300ms' }}
          >
            <ChartCard isDark={isDark} title="Mastery Progression" subtitle="% mastery over 7 weeks">
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={masteryData}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={accent} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={muted} />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: mutedText }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: mutedText }} axisLine={false} tickLine={false} domain={[30, 100]} />
                  <Tooltip {...tooltipStyle} />
                  <Area
                    type="monotone" dataKey="mastery" stroke={accent} strokeWidth={2.5}
                    fill="url(#g1)" isAnimationActive={visible} animationDuration={1800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      </div>
    </section>
  );
}