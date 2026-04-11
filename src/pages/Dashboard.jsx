import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import KPIRow from '@/components/dashboard/KPIRow';
import ScoreChart from '@/components/dashboard/ScoreChart';
import ContinuePractice from '@/components/dashboard/ContinuePractice';
import ModuleGrid from '@/components/dashboard/ModuleGrid';
import AIChat from '@/components/dashboard/AIChat';
import XPBar from '@/components/dashboard/XPBar';

export default function Dashboard() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('proofly_theme') === 'dark');
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('dashboard_active_tab') || 'SAT');
  const [activeNav, setActiveNav] = useState('overview');
  const [selectedApSubject, setSelectedApSubject] = useState(() => localStorage.getItem('proofly_ap_subject') || null);
  const [user, setUser] = useState(null);
  const [totalXp, setTotalXp] = useState(0);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setTotalXp(u?.total_xp || 0);
      setPoints(u?.points || 0);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem('dashboard_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('proofly_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const handleSelectApSubject = (id) => {
    setSelectedApSubject(id);
    if (id) localStorage.setItem('proofly_ap_subject', id);
    else localStorage.removeItem('proofly_ap_subject');
  };

  const theme = {
    isDark,
    bg: isDark ? '#0b0f14' : '#f8fafc',
    card: isDark ? '#111827' : '#ffffff',
    text: isDark ? '#e5e7eb' : '#0f172a',
    textMuted: isDark ? '#6b7280' : '#64748b',
    accent: isDark ? '#3b82f6' : '#2563eb',
    border: isDark ? '#1f2937' : '#e2e8f0',
    sidebar: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.5)',
  };

  const examData = {
    SAT: {
      kpis: [
        { label: 'Score Estimate', value: '1320', trend: '+12', icon: 'chart' },
        { label: 'Accuracy', value: '78%', trend: '+5%', icon: 'target' },
        { label: 'Day Streak', value: '7', trend: '+2', icon: 'flame' },
      ],
      chartData: [
        { label: 'Wk 1', score: 1180 }, { label: 'Wk 2', score: 1220 },
        { label: 'Wk 3', score: 1255 }, { label: 'Wk 4', score: 1280 },
        { label: 'Wk 5', score: 1305 }, { label: 'Wk 6', score: 1320 },
      ],
      chartTitle: 'SAT Score Trajectory',
      practiceLabel: 'Continue SAT Practice',
      practiceSubtext: 'You\'re 80 points from your goal of 1400',
    },
    ACT: {
      kpis: [
        { label: 'Score Estimate', value: '28', trend: '+3', icon: 'chart' },
        { label: 'Accuracy', value: '72%', trend: '+8%', icon: 'target' },
        { label: 'Day Streak', value: '7', trend: '+2', icon: 'flame' },
      ],
      chartData: [
        { label: 'Wk 1', score: 23 }, { label: 'Wk 2', score: 24 },
        { label: 'Wk 3', score: 25 }, { label: 'Wk 4', score: 26 },
        { label: 'Wk 5', score: 27 }, { label: 'Wk 6', score: 28 },
      ],
      chartTitle: 'ACT Score Trajectory',
      practiceLabel: 'Continue ACT Practice',
      practiceSubtext: 'You\'re 5 points from your goal of 33',
    },
    AP: {
      kpis: [
        { label: 'Avg Score Est.', value: '4.1', trend: '+0.4', icon: 'chart' },
        { label: 'Mastery', value: '68%', trend: '+11%', icon: 'target' },
        { label: 'Day Streak', value: '7', trend: '+2', icon: 'flame' },
      ],
      chartData: [
        { label: 'Wk 1', score: 42 }, { label: 'Wk 2', score: 50 },
        { label: 'Wk 3', score: 58 }, { label: 'Wk 4', score: 63 },
        { label: 'Wk 5', score: 67 }, { label: 'Wk 6', score: 68 },
      ],
      chartTitle: 'AP Mastery Trajectory',
      practiceLabel: 'Continue AP Practice',
      practiceSubtext: 'Focus on your weak units to reach 80% mastery',
    },
  };

  const current = examData[activeTab];

  return (
    <ProtectedRoute>
      <div style={{
        display: 'flex', minHeight: '100vh', width: '100%',
        background: theme.bg, fontFamily: "'Inter', -apple-system, sans-serif",
        transition: 'background 200ms ease',
      }}>
        <DashboardSidebar
          theme={theme}
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          user={user}
          isDark={isDark}
          onToggleTheme={() => setIsDark(p => !p)}
          selectedApSubject={selectedApSubject}
          onSelectApSubject={handleSelectApSubject}
          activeTab={activeTab}
        />

        {/* Main content */}
        <div style={{ flex: 1, marginLeft: 240, minHeight: '100vh', overflow: 'auto' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px 48px' }}>
            <DashboardHeader
              theme={theme}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              user={user}
            />

            <XPBar theme={theme} totalXp={totalXp} points={points} />

            <KPIRow theme={theme} kpis={current.kpis} />

            <ScoreChart
              theme={theme}
              data={current.chartData}
              title={current.chartTitle}
              examType={activeTab}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              <ContinuePractice
                theme={theme}
                label={current.practiceLabel}
                subtext={current.practiceSubtext}
                examType={activeTab}
              />
              {/* Quick stats card */}
              <div style={{
                background: theme.card, border: `1px solid ${theme.border}`,
                borderRadius: 16, padding: 24,
                boxShadow: theme.isDark ? '0 0 0 1px #1f2937' : '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: theme.textMuted, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>This Week</p>
                {[
                  { label: 'Questions Answered', value: '142' },
                  { label: 'Study Sessions', value: '6' },
                  { label: 'Avg Session Length', value: '38 min' },
                  { label: 'Correct Rate', value: '78%' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 3 ? `1px solid ${theme.border}` : 'none' }}>
                    <span style={{ fontSize: 13, color: theme.textMuted }}>{s.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <ModuleGrid theme={theme} examType={activeTab} />
          </div>
        </div>
        <AIChat theme={theme} />
      </div>
    </ProtectedRoute>
  );
}