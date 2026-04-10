import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight, TrendingUp } from 'lucide-react';

const PRACTICE_ROUTES = { SAT: 'SATPractice', ACT: 'ACTPractice', AP: 'APPractice' };

export default function ContinuePractice({ theme, label, subtext, examType }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = React.useState(false);

  return (
    <div style={{
      background: theme.isDark
        ? 'linear-gradient(135deg, #0f172a 0%, #1e2a3a 100%)'
        : 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)',
      border: `1px solid ${theme.isDark ? '#1e3a5f' : '#bfdbfe'}`,
      borderRadius: 16, padding: 24,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <TrendingUp size={20} color={theme.accent} />
          <span style={{
            fontSize: 11, fontWeight: 600, color: '#10b981',
            background: 'rgba(16,185,129,0.12)', padding: '2px 8px', borderRadius: 999,
          }}>In Progress</span>
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 6 }}>{label}</h3>
        <p style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.5 }}>{subtext}</p>
      </div>

      <button
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => navigate(createPageUrl(PRACTICE_ROUTES[examType]))}
        style={{
          marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: theme.accent, color: '#fff', border: 'none',
          borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600,
          cursor: 'pointer',
          transform: hovered ? 'scale(1.02)' : 'scale(1)',
          transition: 'transform 200ms ease',
        }}
      >
        Resume Practice
        <ArrowRight size={15} />
      </button>
    </div>
  );
}