import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function ScoreChart({ theme, data, title, examType }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(false); setTimeout(() => setVisible(true), 100); }, [examType]);

  const gridColor = theme.isDark ? '#1e2a3a' : '#f1f5f9';
  const minVal = Math.min(...data.map(d => d.score));
  const maxVal = Math.max(...data.map(d => d.score));
  const pad = (maxVal - minVal) * 0.3;

  return (
    <div style={{
      background: theme.card, border: `1px solid ${theme.border}`,
      borderRadius: 20, padding: 28, marginBottom: 24,
      boxShadow: theme.isDark ? '0 0 0 1px #1f2937' : '0 1px 4px rgba(0,0,0,0.06)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(12px)',
      transition: 'all 500ms ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: theme.text, margin: 0, marginBottom: 2 }}>{title}</h2>
          <p style={{ fontSize: 13, color: theme.textMuted, margin: 0 }}>6-week performance</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{
            fontSize: 22, fontWeight: 800, color: theme.text,
            letterSpacing: '-0.02em',
          }}>
            {data[data.length - 1]?.score}
            {examType === 'AP' ? '%' : ''}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 600, color: '#10b981',
            background: 'rgba(16,185,129,0.1)', padding: '4px 8px',
            borderRadius: 999, alignSelf: 'center',
          }}>
            +{data[data.length - 1]?.score - data[0]?.score}
            {examType === 'AP' ? 'pp' : ' pts'}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: theme.textMuted }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            domain={[Math.floor(minVal - pad), Math.ceil(maxVal + pad)]}
            tick={{ fontSize: 12, fill: theme.textMuted }}
            axisLine={false} tickLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: theme.card, border: `1px solid ${theme.border}`,
              borderRadius: 10, fontSize: 13, color: theme.text,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            formatter={(v) => [v, examType === 'AP' ? 'Mastery %' : 'Score']}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke={theme.accent}
            strokeWidth={3}
            dot={{ r: 5, fill: theme.accent, strokeWidth: 2, stroke: theme.card }}
            activeDot={{ r: 7, fill: theme.accent }}
            animationDuration={1200}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}