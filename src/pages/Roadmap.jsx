import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import AIChat from '@/components/dashboard/AIChat';
import { Loader2, Map, RefreshCw, CheckCircle2, Circle, Flame } from 'lucide-react';

export default function Roadmap() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('proofly_theme') === 'dark');
  const [activeNav, setActiveNav] = useState('roadmap');
  const [user, setUser] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [examType, setExamType] = useState('SAT');

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

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const generateRoadmap = async () => {
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert ${examType} tutor. Generate a realistic 14-day personalized study roadmap for a student preparing for the ${examType}.

The student's profile:
- Exam: ${examType}
- Current estimated score: ${examType === 'SAT' ? '1180' : examType === 'ACT' ? '23' : '3.2 avg'}
- Goal score: ${examType === 'SAT' ? '1400' : examType === 'ACT' ? '30' : '4.5 avg'}
- Weak areas: Math (algebra, geometry), Reading (inference questions)

Generate a day-by-day plan. For each day include:
- A focus topic/unit
- Specific number of practice questions
- Estimated study time
- A brief tip or motivation

Return as JSON.`,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          summary: { type: 'string' },
          days: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                day: { type: 'number' },
                date_label: { type: 'string' },
                focus: { type: 'string' },
                topic: { type: 'string' },
                questions: { type: 'number' },
                study_time: { type: 'string' },
                tip: { type: 'string' },
                difficulty: { type: 'string' }
              }
            }
          }
        }
      }
    });
    setRoadmap(result);
    setLoading(false);
  };

  const difficultyColor = (d) => {
    if (!d) return '#6b7280';
    if (d.toLowerCase().includes('easy')) return '#10b981';
    if (d.toLowerCase().includes('hard')) return '#ef4444';
    return '#f59e0b';
  };

  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg, fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <DashboardSidebar
          theme={theme} activeNav={activeNav} setActiveNav={setActiveNav}
          user={user} isDark={isDark} onToggleTheme={() => setIsDark(p => !p)}
        />

        <div style={{ flex: 1, marginLeft: 240, padding: '40px 40px 80px', overflow: 'auto' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${theme.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Map size={22} color={theme.accent} />
                </div>
                <div>
                  <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: theme.text }}>Study Roadmap</h1>
                  <p style={{ margin: 0, fontSize: 14, color: theme.textMuted }}>AI-generated day-by-day study plan</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {/* Exam selector */}
                <div style={{ display: 'flex', background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 10, overflow: 'hidden' }}>
                  {['SAT', 'ACT', 'AP'].map(e => (
                    <button key={e} onClick={() => setExamType(e)} style={{
                      padding: '7px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      background: examType === e ? theme.accent : 'transparent',
                      color: examType === e ? '#fff' : theme.textMuted,
                      transition: 'all 150ms',
                    }}>{e}</button>
                  ))}
                </div>

                <button onClick={generateRoadmap} disabled={loading} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 20px', borderRadius: 10, border: 'none',
                  background: theme.accent, color: '#fff', fontSize: 13, fontWeight: 600,
                  cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1,
                  transition: 'all 150ms',
                }}>
                  {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={14} />}
                  {roadmap ? 'Regenerate' : 'Generate Roadmap'}
                </button>
              </div>
            </div>

            {/* Empty state */}
            {!roadmap && !loading && (
              <div style={{
                background: theme.card, border: `1px dashed ${theme.border}`, borderRadius: 20,
                padding: '64px 32px', textAlign: 'center',
              }}>
                <Map size={48} color={theme.textMuted} style={{ marginBottom: 16, opacity: 0.4 }} />
                <h3 style={{ fontSize: 18, fontWeight: 600, color: theme.text, marginBottom: 8 }}>No roadmap yet</h3>
                <p style={{ color: theme.textMuted, fontSize: 14, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                  Click "Generate Roadmap" to create a personalized 14-day study plan based on your weak areas and score goals.
                </p>
                <button onClick={generateRoadmap} style={{
                  padding: '10px 24px', borderRadius: 10, border: 'none',
                  background: theme.accent, color: '#fff', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer',
                }}>
                  Generate My Roadmap
                </button>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <Loader2 size={36} color={theme.accent} style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
                <p style={{ color: theme.textMuted, fontSize: 15 }}>Analyzing your performance and generating your roadmap...</p>
              </div>
            )}

            {/* Roadmap */}
            {roadmap && !loading && (
              <>
                {/* Summary card */}
                <div style={{
                  background: `${theme.accent}12`, border: `1px solid ${theme.accent}33`,
                  borderRadius: 16, padding: '20px 24px', marginBottom: 28,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Flame size={16} color={theme.accent} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{roadmap.title || `${examType} 14-Day Roadmap`}</span>
                  </div>
                  <p style={{ fontSize: 14, color: theme.textMuted, margin: 0, lineHeight: 1.6 }}>{roadmap.summary}</p>
                </div>

                {/* Days grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {(roadmap.days || []).map((day, i) => (
                    <DayCard key={i} day={day} theme={theme} difficultyColor={difficultyColor} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <AIChat theme={theme} />
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </ProtectedRoute>
  );
}

function DayCard({ day, theme, difficultyColor }) {
  const [done, setDone] = useState(false);
  const isToday = day.day === 1;

  return (
    <div style={{
      background: theme.card,
      border: `1px solid ${done ? '#10b981' : isToday ? theme.accent + '55' : theme.border}`,
      borderRadius: 16, padding: '18px 20px',
      opacity: done ? 0.6 : 1,
      transition: 'all 200ms',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: isToday ? theme.accent : theme.textMuted,
              background: isToday ? `${theme.accent}18` : 'transparent',
              padding: isToday ? '2px 8px' : '0', borderRadius: 999,
            }}>
              {isToday ? '📍 Day 1 — Today' : `Day ${day.day}`}
            </span>
            {day.difficulty && (
              <span style={{ fontSize: 10, fontWeight: 600, color: difficultyColor(day.difficulty), background: difficultyColor(day.difficulty) + '18', padding: '2px 8px', borderRadius: 999 }}>
                {day.difficulty}
              </span>
            )}
          </div>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: theme.text }}>{day.focus}</h4>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: theme.textMuted }}>{day.topic}</p>
        </div>
        <button onClick={() => setDone(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
          {done ? <CheckCircle2 size={20} color="#10b981" /> : <Circle size={20} color={theme.border} />}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: theme.textMuted }}>📝 {day.questions} questions</span>
        <span style={{ fontSize: 12, color: theme.textMuted }}>⏱ {day.study_time}</span>
      </div>

      {day.tip && (
        <p style={{
          margin: 0, fontSize: 12, color: theme.textMuted, lineHeight: 1.5,
          borderLeft: `3px solid ${theme.accent}`, paddingLeft: 10,
          fontStyle: 'italic',
        }}>
          {day.tip}
        </p>
      )}
    </div>
  );
}