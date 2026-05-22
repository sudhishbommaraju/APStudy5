import React, { useState } from 'react';
import { Check, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import MathRenderer from '@/components/ui/MathRenderer';
import NoteBlocks from './NoteBlocks';

// ── Colours ───────────────────────────────────────────────────────────────────
const C = {
  text:          '#F0EDE8',
  textSecondary: '#C9C9C9',
  textMuted:     '#8A8A8A',
  accent:        '#7BAE7F',
  border:        'rgba(255,255,255,0.08)',
  borderSubtle:  'rgba(255,255,255,0.05)',
};

// ── Reading width wrapper ─────────────────────────────────────────────────────
const ReadingColumn = ({ children }) => (
  <div style={{
    maxWidth: '860px',
    margin: '0 auto',
    padding: '3rem 2rem 8rem',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  }}>
    {children}
  </div>
);

// ── Note title + meta ─────────────────────────────────────────────────────────
function NoteHero({ note }) {
  const subjectLabel = note.subject_id
    ? note.subject_id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : null;

  const nd = note.notes_data || {};
  const allWords = [
    ...(Array.isArray(nd.summary) ? nd.summary : nd.summary ? [nd.summary] : []),
    ...(nd.sections || []).flatMap(s => [...(s.bullets || []), ...(s.content || [])]),
  ].join(' ').split(/\s+/).filter(Boolean).length;
  const readMins = Math.max(3, Math.round(allWords / 200));

  return (
    <header style={{ marginBottom: '3rem' }}>
      {/* Overline breadcrumb */}
      {(subjectLabel || note.unit_id) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.875rem' }}>
          {subjectLabel && (
            <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: C.accent }}>
              {subjectLabel}
            </span>
          )}
          {subjectLabel && note.unit_id && <span style={{ color: '#333', fontSize: '0.7rem' }}>·</span>}
          {note.unit_id && (
            <span style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#555' }}>
              {note.unit_id.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      )}

      {/* Title */}
      <h1 style={{
        fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
        fontWeight: 700,
        color: C.text,
        lineHeight: 1.1,
        letterSpacing: '-0.03em',
        marginBottom: '1.25rem',
      }}>
        {note.title}
      </h1>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <span style={{ fontSize: '0.75rem', color: '#555' }}>{readMins} min read</span>
        {note.mastery_percentage > 0 && (
          <span style={{ fontSize: '0.75rem', color: C.accent, fontWeight: 600 }}>
            {note.mastery_percentage}% mastery
          </span>
        )}
        {note.source_type && note.source_type !== 'ai' && (
          <span style={{ fontSize: '0.72rem', color: '#555' }}>
            {note.source_type === 'youtube' ? '📺 YouTube' : '📄 Upload'}
          </span>
        )}
      </div>

      {/* Rule */}
      <div style={{ height: '1px', background: C.borderSubtle, marginBottom: '2.5rem' }} />

      {/* Summary */}
      <SummaryBlock note={note} />
    </header>
  );
}

function SummaryBlock({ note }) {
  const nd = note.notes_data || {};
  const bullets = Array.isArray(nd.summary) ? nd.summary : nd.summary ? [nd.summary] : [];
  if (bullets.length === 0) return null;
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <p style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#444', marginBottom: '1rem' }}>
        Overview
      </p>
      {bullets.map((b, i) => (
        <div key={i} style={{ display: 'flex', gap: '0.875rem', marginBottom: '0.75rem' }}>
          <span style={{ color: C.accent, fontSize: '0.8rem', marginTop: '0.3rem', flexShrink: 0, lineHeight: 1 }}>→</span>
          <p style={{ fontSize: '1rem', color: C.textSecondary, lineHeight: 1.75, margin: 0 }}>
            <MathRenderer text={b} />
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Collapsible section ───────────────────────────────────────────────────────
function NoteSection({ section, index, editMode, onBulletChange }) {
  const [open, setOpen] = useState(true);
  const bullets = section.bullets || section.content || [];

  return (
    <section id={`note-section-${index}`} style={{ marginBottom: '0.25rem' }}>
      {/* Section heading — clickable to collapse */}
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          width: '100%',
          textAlign: 'left',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '2rem 0 1rem',
          borderTop: index === 0 ? 'none' : `1px solid ${C.borderSubtle}`,
          marginTop: index === 0 ? 0 : '1rem',
        }}
      >
        <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#2E3530', userSelect: 'none', width: '1.5rem', flexShrink: 0 }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <h2 style={{
          fontSize: '1.15rem',
          fontWeight: 650,
          color: C.text,
          lineHeight: 1.2,
          letterSpacing: '-0.015em',
          margin: 0,
          flex: 1,
        }}>
          {section.title}
        </h2>
        {open
          ? <ChevronDown style={{ width: '14px', height: '14px', color: '#444', flexShrink: 0 }} />
          : <ChevronRight style={{ width: '14px', height: '14px', color: '#444', flexShrink: 0 }} />
        }
      </button>

      {open && (
        <div style={{ paddingLeft: '2.25rem', paddingBottom: '0.5rem' }}>
          {editMode
            ? bullets.map((b, j) => (
                <textarea
                  key={j}
                  value={b}
                  onChange={e => onBulletChange(j, e.target.value)}
                  rows={2}
                  style={{
                    display: 'block', width: '100%', margin: '0.35rem 0',
                    background: '#0F1214', border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: '7px', padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem', color: '#C8C3BB', outline: 'none',
                    resize: 'none', lineHeight: 1.65, fontFamily: 'inherit',
                  }}
                />
              ))
            : bullets.map((b, j) => <NoteBlocks key={j} text={b} />)
          }
        </div>
      )}
    </section>
  );
}

// ── Key terms glossary ────────────────────────────────────────────────────────
function KeyTermsSection({ keyTerms }) {
  const [open, setOpen] = useState(true);
  return (
    <section style={{ marginTop: '1rem' }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
          textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer',
          padding: '2rem 0 1rem', borderTop: `1px solid ${C.borderSubtle}`,
        }}
      >
        <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#2E3530', userSelect: 'none', width: '1.5rem', flexShrink: 0 }}>KT</span>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 650, color: C.text, margin: 0, flex: 1 }}>Key Terms</h2>
        {open
          ? <ChevronDown style={{ width: '14px', height: '14px', color: '#444', flexShrink: 0 }} />
          : <ChevronRight style={{ width: '14px', height: '14px', color: '#444', flexShrink: 0 }} />
        }
      </button>
      {open && (
        <div style={{ paddingLeft: '2.25rem' }}>
          {keyTerms.map((k, i) => {
            const term = typeof k === 'string' ? k : k.term;
            const def  = typeof k === 'string' ? '' : k.definition;
            return (
              <div key={i} style={{
                display: 'flex', gap: '1.5rem', padding: '0.75rem 0',
                borderBottom: `1px solid ${C.borderSubtle}`,
              }}>
                <p style={{ width: '180px', flexShrink: 0, fontSize: '0.875rem', fontWeight: 600, color: C.accent, margin: 0 }}>
                  <MathRenderer text={term} />
                </p>
                <p style={{ fontSize: '0.875rem', color: '#9A9E9B', lineHeight: 1.7, margin: 0, flex: 1 }}>
                  <MathRenderer text={def || ''} />
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── Main NoteBody export ──────────────────────────────────────────────────────
export default function NoteBody({ note, editMode, editedSections, onBulletChange, onSave, saving }) {
  const nd = note.notes_data || {};
  const sections = nd.sections || [];
  const keyTerms = nd.keyTerms || [];

  const displaySections = editMode
    ? editedSections
    : sections.map(s => ({ ...s, bullets: s.bullets || s.content || [] }));

  return (
    <ReadingColumn>
      <NoteHero note={note} />

      {displaySections.map((sec, i) => (
        <NoteSection
          key={i}
          section={sec}
          index={i}
          editMode={editMode}
          onBulletChange={(bi, val) => onBulletChange(i, bi, val)}
        />
      ))}

      {keyTerms.length > 0 && <KeyTermsSection keyTerms={keyTerms} />}

      {displaySections.length === 0 && keyTerms.length === 0 && (
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
          <p style={{ color: '#444', fontSize: '0.875rem' }}>No structured content found.</p>
        </div>
      )}

      {editMode && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem' }}>
          <button
            onClick={onSave}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.625rem 1.5rem', borderRadius: '100px',
              background: 'rgba(123,174,127,0.12)', border: '1px solid rgba(123,174,127,0.28)',
              color: '#7BAE7F', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? <Loader2 style={{ width: '14px', height: '14px' }} className="animate-spin" /> : <Check style={{ width: '14px', height: '14px' }} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}
    </ReadingColumn>
  );
}