import React, { useEffect, useState } from 'react';
import { BarChart2, Target, Flame } from 'lucide-react';

const ICONS = { chart: BarChart2, target: Target, flame: Flame };
const ICON_COLORS = { chart: '#3b82f6', target: '#10b981', flame: '#f97316' };

export default function KPIRow({ theme, kpis }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 80); }, [kpis]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
      {kpis.map((kpi, i) => (
        <KPICard key={kpi.label} kpi={kpi} theme={theme} visible={visible} delay={i * 80} />
      ))}
    </div>
  );
}

function KPICard({ kpi, theme, visible, delay }) {
  const [hovered, setHovered] = useState(false);
  const Icon = ICONS[kpi.icon];
  const iconColor = ICON_COLORS[kpi.icon];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: theme.card, border: `1px solid ${theme.border}`,
        borderRadius: 16, padding: '20px 20px 18px',
        boxShadow: hovered
          ? theme.isDark ? '0 0 0 1px #3b82f6, 0 4px 20px rgba(59,130,246,0.12)' : '0 4px 20px rgba(0,0,0,0.08)'
          : theme.isDark ? '0 0 0 1px #1f2937' : '0 1px 3px rgba(0,0,0,0.05)',
        transform: hovered ? 'translateY(-3px)' : visible ? 'translateY(0)' : 'translateY(16px)',
        opacity: visible ? 1 : 0,
        transition: `all 400ms ease ${delay}ms`,
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: `${iconColor}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} color={iconColor} />
        </div>
        <span style={{
          fontSize: 11, fontWeight: 600, color: '#10b981',
          background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 999,
        }}>
          {kpi.trend}
        </span>
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: theme.text, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 4 }}>
        {kpi.value}
      </div>
      <p style={{ fontSize: 13, color: theme.textMuted, margin: 0, fontWeight: 500 }}>{kpi.label}</p>
    </div>
  );
}