import React, { useState, useMemo } from 'react';
import { AP_SUBJECTS } from '@/components/studyhub/AP_SUBJECTS';
import { ChevronDown, BookOpen } from 'lucide-react';

const CATEGORY_ORDER = ['Math & CS', 'Science', 'History & Social Studies', 'English & Arts', 'World Languages'];

function getAPScore(accuracy, total) {
  if (total === 0) return null;
  if (accuracy >= 90) return 5;
  if (accuracy >= 75) return 4;
  if (accuracy >= 60) return 3;
  if (accuracy >= 45) return 2;
  return 1;
}

const SCORE_COLORS = { 5: '#16a34a', 4: '#2563eb', 3: '#f59e0b', 2: '#f97316', 1: '#dc2626' };
const SCORE_LABELS = { 5: 'Excellent', 4: 'Proficient', 3: 'Adequate', 2: 'Developing', 1: 'Needs Work' };

export default function APSubjectScoreAnalyzer({ theme, attempts }) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Compute per-subject scores from attempts
  const subjectStats = useMemo(() => {
    const map = {};
    for (const a of attempts) {
      const sid = (a.subject_id || '').toLowerCase();
      if (!sid || ['sat', 'act'].some(x => sid.startsWith(x))) continue;
      if (!map[sid]) map[sid] = { total: 0, correct: 0 };
      map[sid].total += 1;
      if (a.is_correct) map[sid].correct += 1;
    }
    return map;
  }, [attempts]);

  const groupedSubjects = useMemo(() => {
    const groups = {};
    for (const cat of CATEGORY_ORDER) {
      const subs = AP_SUBJECTS.filter(s => s.category === cat).map(s => {
        const stats = subjectStats[s.id] || { total: 0, correct: 0 };
        const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
        const score = getAPScore(accuracy, stats.total);
        return { ...s, accuracy, total: stats.total, score };
      });
      if (subs.length) groups[cat] = subs;
    }
    return groups;
  }, [subjectStats]);

  const selected = selectedId
    ? AP_SUBJECTS.find(s => s.id === selectedId)
    : null;

  const selectedStats = selectedId ? (subjectStats[selectedId] || { total: 0, correct: 0 }) : null;
  const selectedAccuracy = selectedStats && selectedStats.total > 0
    ? Math.round((selectedStats.correct / selectedStats.total) * 100) : 0;
  const selectedScore = selectedStats ? getAPScore(selectedAccuracy, selectedStats.total) : null;

  return (
    <div style={{
      background: theme.card, border: `1px solid ${theme.border}`,
      borderRadius: 16, padding: 20, marginBottom: 20,
      boxShadow: theme.isDark ? '0 0 0 1px #1f2937' : '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={15} color={theme.accent} />
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            AP Score Analyzer
          </p>
        </div>

        {/* Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setOpen(p => !p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 12px', borderRadius: 10,
              border: `1px solid ${theme.border}`,
              background: theme.isDark ? '#1f2937' : '#f8fafc',
              color: theme.text, cursor: 'pointer', fontSize: 13, fontWeight: 500,
              minWidth: 200,
            }}
          >
            <span style={{ flex: 1, textAlign: 'left' }}>
              {selected ? selected.subject : 'Select a subject…'}
            </span>
            <ChevronDown size={14} color={theme.textMuted} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
          </button>

          {open && (
            <div style={{
              position: 'absolute', top: '110%', right: 0, zIndex: 100,
              background: theme.isDark ? '#111827' : '#ffffff',
              border: `1px solid ${theme.border}`, borderRadius: 12,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              minWidth: 260, maxHeight: 360, overflowY: 'auto',
            }}>
              {Object.entries(groupedSubjects).map(([cat, subs]) => (
                <div key={cat}>
                  <p style={{
                    fontSize: 10, fontWeight: 700, color: theme.textMuted,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    padding: '10px 14px 4px', margin: 0,
                  }}>{cat}</p>
                  {subs.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedId(s.id); setOpen(false); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                        background: selectedId === s.id
                          ? theme.isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.07)'
                          : 'transparent',
                        color: theme.text, fontSize: 13,
                        transition: 'background 100ms',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = selectedId === s.id
                        ? theme.isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.07)'
                        : 'transparent'}
                    >
                      <span>{s.subject}</span>
                      {s.score !== null ? (
                        <span style={{
                          fontSize: 12, fontWeight: 700, color: SCORE_COLORS[s.score],
                          background: SCORE_COLORS[s.score] + '18',
                          padding: '2px 8px', borderRadius: 999,
                        }}>{s.score}</span>
                      ) : (
                        <span style={{ fontSize: 11, color: theme.textMuted }}>No data</span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Score display */}
      {selected && selectedStats ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          {selectedScore !== null ? (
            <>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 52, fontWeight: 900, color: SCORE_COLORS[selectedScore], margin: 0, lineHeight: 1 }}>{selectedScore}</p>
                <p style={{ fontSize: 11, color: theme.textMuted, margin: '4px 0 0' }}>AP Score Est.</p>
              </div>
              <div style={{ width: 1, height: 60, background: theme.border }} />
              <div>
                <p style={{ fontSize: 20, fontWeight: 700, color: theme.text, margin: 0 }}>{selectedAccuracy}%</p>
                <p style={{ fontSize: 11, color: theme.textMuted, margin: '2px 0 0' }}>Accuracy</p>
              </div>
              <div style={{ width: 1, height: 60, background: theme.border }} />
              <div>
                <p style={{ fontSize: 20, fontWeight: 700, color: theme.text, margin: 0 }}>{selectedStats.total}</p>
                <p style={{ fontSize: 11, color: theme.textMuted, margin: '2px 0 0' }}>Questions Done</p>
              </div>
              <div style={{ width: 1, height: 60, background: theme.border }} />
              <div style={{ flex: 1, minWidth: 160 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: SCORE_COLORS[selectedScore], margin: '0 0 4px' }}>{SCORE_LABELS[selectedScore]}</p>
                {/* Score scale bar */}
                <div style={{ display: 'flex', gap: 3 }}>
                  {[1,2,3,4,5].map(n => (
                    <div key={n} style={{
                      flex: 1, height: 8, borderRadius: 4,
                      background: n <= selectedScore ? SCORE_COLORS[selectedScore] : theme.isDark ? '#1f2937' : '#e2e8f0',
                      transition: 'background 300ms',
                    }} />
                  ))}
                </div>
                <p style={{ fontSize: 11, color: theme.textMuted, margin: '6px 0 0' }}>
                  Keep practicing to raise your score!
                </p>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 13, color: theme.textMuted }}>
              No practice data yet for <strong style={{ color: theme.text }}>{selected.subject}</strong>. Start practicing to see your analyzed score!
            </p>
          )}
        </div>
      ) : (
        <p style={{ fontSize: 13, color: theme.textMuted, margin: 0 }}>
          Select an AP subject above to see your analyzed score for that subject.
        </p>
      )}
    </div>
  );
}