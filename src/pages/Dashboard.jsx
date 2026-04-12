import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { getUserStats } from '@/hooks/useProgression';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import KPIRow from '@/components/dashboard/KPIRow';
import APExamCountdown from '@/components/dashboard/APExamCountdown';
import ScoreChart from '@/components/dashboard/ScoreChart';
import ContinuePractice from '@/components/dashboard/ContinuePractice';
import ModuleGrid from '@/components/dashboard/ModuleGrid';
import AIChat from '@/components/dashboard/AIChat';
import XPBar from '@/components/dashboard/XPBar';
import PSATScoreCard from '@/components/dashboard/PSATScoreCard';
import APSubjectScoreAnalyzer from '@/components/dashboard/APSubjectScoreAnalyzer';

export default function Dashboard() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('proofly_theme') === 'dark');
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('dashboard_active_tab') || 'SAT');
  const [activeNav, setActiveNav] = useState('overview');
  const [selectedApSubject, setSelectedApSubject] = useState(() => localStorage.getItem('proofly_ap_subject') || null);
  const [user, setUser] = useState(null);
  const [totalXp, setTotalXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [attempts, setAttempts] = useState([]);
  const [psatScore, setPsatScore] = useState(null);

  useEffect(() => {
    base44.auth.me().then(async u => {
      setUser(u);
      const [stats, userAttempts] = await Promise.all([
        getUserStats(u.email),
        base44.entities.Attempt.filter({ created_by: u.email }, '-created_date', 500),
      ]);
      setTotalXp(stats.xp || 0);
      setStreak(stats.streak || 0);
      setAttempts(userAttempts || []);
      setPsatScore(u.psat_score || null);
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

  // Compute real stats from attempts
  const computeStats = (examType) => {
    const subjectFilter = examType === 'AP'
      ? (a) => !['sat', 'act'].includes((a.subject_id || '').toLowerCase())
      : (a) => (a.subject_id || '').toLowerCase().startsWith(examType.toLowerCase());
    const filtered = attempts.filter(subjectFilter);
    const total = filtered.length;
    const correct = filtered.filter(a => a.is_correct).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Score estimates
    let scoreEst = '—';
    if (examType === 'SAT') {
      // Blend PSAT baseline with practice performance
      const psatBase = psatScore ? Math.min(1600, Math.round(psatScore * 1.03 + 20)) : null;
      if (total > 0) {
        const practiceEst = Math.round(400 + (accuracy / 100) * 1200);
        scoreEst = psatBase
          ? Math.round(psatBase * 0.4 + practiceEst * 0.6).toString()
          : practiceEst.toString();
      } else if (psatBase) {
        scoreEst = psatBase.toString();
      }
    } else if (examType === 'ACT' && total > 0) {
      scoreEst = Math.round(1 + (accuracy / 100) * 35).toString();
    } else if (examType === 'AP' && total > 0) {
      scoreEst = (accuracy >= 90 ? 5 : accuracy >= 75 ? 4 : accuracy >= 60 ? 3 : accuracy >= 45 ? 2 : 1).toString();
    }

    // Weekly chart data (last 6 weeks of questions answered)
    const now = Date.now();
    const chartData = Array.from({ length: 6 }, (_, i) => {
      const weekStart = now - (5 - i) * 7 * 86400000;
      const weekEnd = weekStart + 7 * 86400000;
      const weekAttempts = filtered.filter(a => {
        const t = new Date(a.created_date).getTime();
        return t >= weekStart && t < weekEnd;
      });
      const wTotal = weekAttempts.length;
      const wCorrect = weekAttempts.filter(x => x.is_correct).length;
      const wAcc = wTotal > 0 ? Math.round((wCorrect / wTotal) * 100) : 0;
      let score = 0;
      if (examType === 'SAT') score = Math.round(400 + (wAcc / 100) * 1200);
      else if (examType === 'ACT') score = Math.round(1 + (wAcc / 100) * 35);
      else score = wAcc;
      return { label: `Wk ${i + 1}`, score: wTotal > 0 ? score : 0 };
    });

    return { accuracy, scoreEst, total, correct, chartData };
  };

  const buildKpis = (examType) => {
    const { accuracy, scoreEst } = computeStats(examType);
    const label = examType === 'AP' ? 'Avg Score Est.' : 'Score Estimate';
    return [
      { label, value: scoreEst, trend: '', icon: 'chart' },
      { label: 'Accuracy', value: accuracy > 0 ? `${accuracy}%` : '—', trend: '', icon: 'target' },
      { label: 'Day Streak', value: String(streak), trend: '', icon: 'flame' },
    ];
  };

  const examData = {
    SAT: {
      kpis: buildKpis('SAT'),
      chartData: computeStats('SAT').chartData,
      chartTitle: 'SAT Score Trajectory',
      practiceLabel: 'Continue SAT Practice',
      practiceSubtext: 'Answer more questions to improve your score estimate',
    },
    ACT: {
      kpis: buildKpis('ACT'),
      chartData: computeStats('ACT').chartData,
      chartTitle: 'ACT Score Trajectory',
      practiceLabel: 'Continue ACT Practice',
      practiceSubtext: 'Answer more questions to improve your score estimate',
    },
    AP: {
      kpis: buildKpis('AP'),
      chartData: computeStats('AP').chartData,
      chartTitle: 'AP Mastery Trajectory',
      practiceLabel: 'Continue AP Practice',
      practiceSubtext: 'Answer more questions to improve your mastery',
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

            <XPBar theme={theme} totalXp={totalXp} streak={streak} />

            {activeTab === 'SAT' && (
              <div style={{ marginBottom: 20 }}>
                <PSATScoreCard theme={theme} psatScore={psatScore} onUpdate={setPsatScore} />
              </div>
            )}

            {activeTab === 'AP' && (
              <APSubjectScoreAnalyzer theme={theme} attempts={attempts} />
            )}

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