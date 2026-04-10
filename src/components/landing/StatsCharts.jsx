import React, { useEffect, useRef, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

const scoreData = [
  { month: 'Jan', score: 1180 }, { month: 'Feb', score: 1220 }, { month: 'Mar', score: 1260 },
  { month: 'Apr', score: 1295 }, { month: 'May', score: 1330 }, { month: 'Jun', score: 1380 },
];

const studyData = [
  { day: 'Mon', mins: 45 }, { day: 'Tue', mins: 60 }, { day: 'Wed', mins: 30 },
  { day: 'Thu', mins: 75 }, { day: 'Fri', mins: 50 }, { day: 'Sat', mins: 90 }, { day: 'Sun', mins: 40 },
];

const masteryData = [
  { week: 'W1', mastery: 38 }, { week: 'W2', mastery: 47 }, { week: 'W3', mastery: 55 },
  { week: 'W4', mastery: 62 }, { week: 'W5', mastery: 70 }, { week: 'W6', mastery: 78 },
];

function ChartCard({ title, subtitle, children, theme, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{
      background: theme.bgCard,
      border: `1px solid ${theme.border}`,
      borderRadius: 16, padding: 24,
      boxShadow: theme.shadow,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: `all 600ms ease ${delay}ms`,
    }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 4 }}>{title}</p>
      <p style={{ fontSize: 12, color: theme.textMuted, marginBottom: 20 }}>{subtitle}</p>
      {children}
    </div>
  );
}

const tooltipStyle = (theme) => ({
  contentStyle: {
    background: theme.bgCard, border: `1px solid ${theme.border}`,
    borderRadius: 8, fontSize: 12, color: theme.text,
  }
});

export default function StatsCharts({ theme }) {
  const gridColor = theme.isDark ? '#1f2937' : '#f1f5f9';

  return (
    <section style={{ padding: '80px 24px', background: theme.bgSecondary }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: theme.text, textAlign: 'center', marginBottom: 8, letterSpacing: '-0.02em' }}>
          Results you can measure
        </h2>
        <p style={{ color: theme.textMuted, textAlign: 'center', marginBottom: 48, fontSize: 16 }}>
          Real data from students using Proofly consistently
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="stats-grid">
          <ChartCard title="Score Improvement" subtitle="Avg SAT score over 6 months" theme={theme} delay={0}>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={scoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: theme.textMuted }} axisLine={false} tickLine={false} />
                <YAxis domain={[1100, 1450]} tick={{ fontSize: 11, fill: theme.textMuted }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle(theme)} formatter={v => [v, 'Score']} />
                <Line type="monotone" dataKey="score" stroke={theme.accent} strokeWidth={2.5} dot={{ r: 4, fill: theme.accent }} animationDuration={1500} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Daily Study Time" subtitle="Average minutes studied per day" theme={theme} delay={100}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={studyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: theme.textMuted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: theme.textMuted }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle(theme)} formatter={v => [`${v} min`, 'Study Time']} />
                <Bar dataKey="mins" fill={theme.accent} radius={[4, 4, 0, 0]} animationDuration={1200} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Mastery Progression" subtitle="% mastery gained over 6 weeks" theme={theme} delay={200}>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={masteryData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: theme.textMuted }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: theme.textMuted }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle(theme)} formatter={v => [`${v}%`, 'Mastery']} />
                <Area type="monotone" dataKey="mastery" stroke={theme.accent} strokeWidth={2.5}
                  fill={theme.isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.08)'} animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
      <style>{`@media(max-width:768px){ .stats-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}