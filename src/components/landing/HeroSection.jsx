import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { Flame, Target, TrendingUp } from 'lucide-react';

const masteryData = [
  { w: 'W1', score: 42 }, { w: 'W2', score: 55 }, { w: 'W3', score: 61 },
  { w: 'W4', score: 68 }, { w: 'W5', score: 74 }, { w: 'W6', score: 81 },
];

const subjects = [
  { name: 'AP Calculus', pct: 78, color: '#3b82f6' },
  { name: 'AP Biology', pct: 64, color: '#10b981' },
  { name: 'SAT Math', pct: 89, color: '#8b5cf6' },
];

export default function HeroSection({ theme }) {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  const handleCTA = async () => {
    const authed = await base44.auth.isAuthenticated();
    if (authed) { navigate('/Dashboard'); } else { base44.auth.redirectToLogin('/Dashboard'); }
  };

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const fade = {
    transition: 'opacity 600ms ease, transform 600ms ease',
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(24px)',
  };

  return (
    <section style={{ paddingTop: 120, paddingBottom: 80 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }} className="hero-grid">
        {/* Left */}
        <div>
          <div style={{ ...fade, transitionDelay: '0ms' }}>
            <span style={{
              display: 'inline-block', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
              color: theme.accent, background: theme.isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.08)',
              padding: '4px 12px', borderRadius: 999, marginBottom: 20, textTransform: 'uppercase',
            }}>
              AI-Powered Learning
            </span>
          </div>
          <h1 style={{
            ...fade, transitionDelay: '80ms',
            fontSize: 52, fontWeight: 700, lineHeight: 1.1,
            letterSpacing: '-0.03em', marginBottom: 20, color: theme.text,
          }}>
            Your AI-Powered<br />Study System
          </h1>
          <p style={{
            ...fade, transitionDelay: '160ms',
            fontSize: 18, color: theme.textMuted, lineHeight: 1.7, marginBottom: 36, maxWidth: 460,
          }}>
            Practice, notes, exams, analytics, and planning — all in one platform built to make you study smarter.
          </p>
          <div style={{ ...fade, transitionDelay: '240ms', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={handleCTA}
              style={{
                background: theme.accent, color: '#fff', border: 'none',
                borderRadius: 12, padding: '13px 28px', fontSize: 15, fontWeight: 600,
                cursor: 'pointer', transition: 'all 200ms',
              }}
              onMouseEnter={e => { e.target.style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { e.target.style.transform = 'scale(1)'; }}
            >
              Start Studying Free
            </button>
            <a href="#how-it-works">
              <button style={{
                background: 'transparent', color: theme.text,
                border: `1.5px solid ${theme.border}`, borderRadius: 12,
                padding: '13px 28px', fontSize: 15, fontWeight: 500,
                cursor: 'pointer', transition: 'all 200ms',
              }}
                onMouseEnter={e => { e.target.style.borderColor = theme.accent; }}
                onMouseLeave={e => { e.target.style.borderColor = theme.border; }}
              >
                See How It Works
              </button>
            </a>
          </div>
        </div>

        {/* Right: Dashboard Mockup */}
        <div style={{
          ...fade, transitionDelay: '300ms',
          background: theme.bgCard,
          borderRadius: 20,
          boxShadow: theme.shadow,
          border: `1px solid ${theme.border}`,
          padding: 24,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: theme.text }}>Study Dashboard</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ icon: Flame, label: '7', color: '#f97316' }, { icon: Target, label: '84%', color: '#10b981' }, { icon: TrendingUp, label: '+18', color: theme.accent }].map(({ icon: Icon, label, color }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color }}>
                  <Icon size={13} color={color} /> {label}
                </div>
              ))}
            </div>
          </div>

          {/* Mastery Graph */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: theme.textMuted, marginBottom: 8, fontWeight: 500 }}>Mastery Progress</p>
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={masteryData}>
                <Line type="monotone" dataKey="score" stroke={theme.accent} strokeWidth={2.5} dot={false} animationDuration={1500} />
                <Tooltip
                  contentStyle={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 12, color: theme.text }}
                  formatter={(v) => [`${v}%`, 'Mastery']}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Subject Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {subjects.map(s => (
              <div key={s.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: theme.textMuted, fontWeight: 500 }}>{s.name}</span>
                  <span style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: theme.isDark ? '#1f2937' : '#e2e8f0' }}>
                  <div style={{ height: '100%', width: `${s.pct}%`, borderRadius: 999, background: s.color, transition: 'width 1s ease' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Streak */}
          <div style={{
            marginTop: 20, padding: '12px 16px', borderRadius: 12,
            background: theme.isDark ? '#1a2234' : '#eff6ff',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Flame size={18} color="#f97316" />
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: theme.text, margin: 0 }}>7-day streak 🔥</p>
              <p style={{ fontSize: 11, color: theme.textMuted, margin: 0 }}>Keep it up! Study today to maintain your streak.</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hidden-mobile { display: none !important; }
        }
      `}</style>
    </section>
  );
}