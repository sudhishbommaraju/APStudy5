import React from 'react';
import { Clock, Target } from 'lucide-react';
import NoteBlocks from './NoteBlocks';
import MathRenderer from '@/components/ui/MathRenderer';

// ── Shared text colours ───────────────────────────────────────────────────────
const C = {
  textPrimary:   '#F4F4F2',
  textSecondary: '#B7BCB9',
  textMuted:     '#7D8580',
  accent:        '#7BAE7F',
  border:        'rgba(255,255,255,0.08)',
  borderSubtle:  'rgba(255,255,255,0.05)',
  surface:       '#111416',
  elevated:      '#171B1D',
};

// ── Inline math-aware text ────────────────────────────────────────────────────
export function RichText({ text, style }) {
  if (!text) return null;
  return (
    <span style={style}>
      <MathRenderer text={String(text)} />
    </span>
  );
}

// ── Hero header ───────────────────────────────────────────────────────────────
export function NoteHeroHeader({ note, summaryBullets }) {
  const subjectLabel = note.subject_id
    ? note.subject_id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : null;

  // Rough reading time: ~200 words/min
  const nd = note.notes_data || {};
  const allText = [
    ...(Array.isArray(nd.summary) ? nd.summary : nd.summary ? [nd.summary] : []),
    ...(nd.sections || []).flatMap(s => s.bullets || s.content || []),
  ].join(' ');
  const wordCount = allText.split(/\s+/).filter(Boolean).length;
  const readMins = Math.max(3, Math.round(wordCount / 200));

  return (
    <header style={{ marginBottom: '3.5rem' }}>
      {/* Breadcrumb overline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        {subjectLabel && (
          <span style={{
            fontSize: '0.625rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            color: C.accent,
          }}>
            {subjectLabel}
          </span>
        )}
        {subjectLabel && note.unit_id && (
          <span style={{ color: C.textMuted, fontSize: '0.7rem' }}>·</span>
        )}
        {note.unit_id && (
          <span style={{
            fontSize: '0.625rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: C.textMuted,
          }}>
            {note.unit_id.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      {/* Title */}
      <h1 style={{
        fontSize: 'clamp(1.7rem, 4vw, 2.4rem)',
        fontWeight: 700,
        color: C.textPrimary,
        lineHeight: 1.1,
        letterSpacing: '-0.025em',
        marginBottom: '1.25rem',
      }}>
        {note.title}
      </h1>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Clock style={{ width: '0.8rem', height: '0.8rem', color: C.textMuted }} />
          <span style={{ fontSize: '0.78rem', color: C.textMuted }}>{readMins} min read</span>
        </div>
        {note.mastery_percentage > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Target style={{ width: '0.8rem', height: '0.8rem', color: C.accent }} />
            <span style={{ fontSize: '0.78rem', color: C.accent, fontWeight: 600 }}>
              {note.mastery_percentage}% mastery
            </span>
          </div>
        )}
        {note.source_type && note.source_type !== 'ai' && (
          <span style={{ fontSize: '0.72rem', color: C.textMuted }}>
            {note.source_type === 'youtube' ? '📺 YouTube' : '📄 Upload'}
          </span>
        )}
      </div>

      {/* Horizontal rule */}
      <div style={{
        height: '1px',
        background: `linear-gradient(to right, ${C.border}, rgba(255,255,255,0.02), transparent)`,
        marginBottom: '2.5rem',
      }} />

      {/* Summary / Overview */}
      {summaryBullets.length > 0 && (
        <section style={{ marginBottom: '2.5rem' }}>
          <p style={{
            fontSize: '0.6rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: C.textMuted,
            marginBottom: '1.25rem',
          }}>
            Overview
          </p>
          <div style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: '10px',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
          }}>
            {summaryBullets.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <span style={{ color: C.accent, fontSize: '0.75rem', marginTop: '0.25rem', flexShrink: 0 }}>→</span>
                <p style={{ fontSize: '0.9375rem', color: C.textSecondary, lineHeight: 1.75, margin: 0 }}>
                  <MathRenderer text={b} />
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </header>
  );
}

// ── Individual note section ───────────────────────────────────────────────────
export function NoteSection({ section, index, editMode, onBulletChange }) {
  const bullets = section.bullets || section.content || [];

  return (
    <section style={{ marginBottom: '0.5rem' }}>
      {/* Section heading */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '0.75rem',
        marginTop: index === 0 ? 0 : '3rem',
        marginBottom: '1.5rem',
      }}>
        <span style={{
          fontFamily: 'monospace',
          fontSize: '0.65rem',
          color: '#2E3530',
          userSelect: 'none',
          width: '1.5rem',
          flexShrink: 0,
          tabularNums: true,
        }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <h2 style={{
          fontSize: '1.2rem',
          fontWeight: 650,
          color: C.textPrimary,
          lineHeight: 1.2,
          letterSpacing: '-0.015em',
          margin: 0,
        }}>
          {section.title}
        </h2>
      </div>

      {/* Bullets / content */}
      <div style={{ paddingLeft: '2.25rem' }}>
        {editMode ? (
          bullets.map((b, j) => (
            <textarea
              key={j}
              value={b}
              onChange={e => onBulletChange(j, e.target.value)}
              rows={2}
              style={{
                display: 'block',
                width: '100%',
                margin: '0.4rem 0',
                background: '#0F1214',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                color: '#C8C3BB',
                outline: 'none',
                resize: 'none',
                lineHeight: 1.65,
                fontFamily: 'inherit',
              }}
            />
          ))
        ) : (
          bullets.map((b, j) => <NoteBlocks key={j} text={b} />)
        )}
      </div>
    </section>
  );
}

// ── Key terms section ─────────────────────────────────────────────────────────
export function KeyTermsSection({ keyTerms }) {
  return (
    <section style={{ marginTop: '2rem' }}>
      <p style={{
        fontSize: '0.6rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        color: C.textMuted,
        marginBottom: '1.25rem',
      }}>
        Key Terms
      </p>
      <div>
        {keyTerms.map((k, i) => {
          const term = typeof k === 'string' ? k : k.term;
          const def  = typeof k === 'string' ? '' : k.definition;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: '1.5rem',
                padding: '0.875rem 0.5rem',
                borderBottom: `1px solid ${C.borderSubtle}`,
              }}
            >
              <div style={{ width: '180px', flexShrink: 0 }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: C.accent, margin: 0 }}>
                  <MathRenderer text={term} />
                </p>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#A4A8A5', lineHeight: 1.7, margin: 0, flex: 1 }}>
                <MathRenderer text={def || ''} />
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Horizontal divider ────────────────────────────────────────────────────────
export function NoteDivider() {
  return (
    <div style={{
      margin: '3rem 0 2.5rem',
      height: '1px',
      background: C.borderSubtle,
    }} />
  );
}