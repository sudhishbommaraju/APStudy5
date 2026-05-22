import React from 'react';
import { AlertTriangle, Zap, Target, Star } from 'lucide-react';
import MathRenderer from '@/components/ui/MathRenderer';

const C = {
  textSecondary: '#B7BCB9',
  textMuted:     '#7D8580',
  accent:        '#7BAE7F',
  accentText:    '#A8CCA8',
  danger:        '#C0534A',
  dangerText:    '#D4A09A',
  warn:          '#C9A05A',
  surface:       '#111416',
  elevated:      '#171B1D',
  border:        'rgba(255,255,255,0.08)',
};

// ── Plain concept bullet ──────────────────────────────────────────────────────
export function ConceptBullet({ text }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
      padding: '0.6rem 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{
        marginTop: '0.6rem',
        width: '4px',
        height: '4px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.15)',
        flexShrink: 0,
      }} />
      <p style={{
        fontSize: '0.9375rem',
        color: C.textSecondary,
        lineHeight: 1.8,
        margin: 0,
        flex: 1,
      }}>
        <MathRenderer text={text} />
      </p>
    </div>
  );
}

// ── Formula block ─────────────────────────────────────────────────────────────
export function FormulaBlock({ text }) {
  return (
    <div style={{
      margin: '1.25rem 0',
      borderRadius: '10px',
      overflow: 'hidden',
      border: '1px solid rgba(123,174,127,0.2)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.4rem 1rem',
        background: 'rgba(123,174,127,0.07)',
        borderBottom: '1px solid rgba(123,174,127,0.12)',
      }}>
        <span style={{
          fontSize: '0.58rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.18em',
          color: C.accent,
        }}>
          Formula
        </span>
      </div>
      <div style={{
        padding: '1.25rem 1.5rem',
        background: '#0E1210',
        textAlign: 'center',
        overflowX: 'auto',
        color: '#D0C9B8',
        fontSize: '1.05rem',
      }}>
        <MathRenderer text={text} />
      </div>
    </div>
  );
}

// ── Trap / Common Mistake block ───────────────────────────────────────────────
export function TrapBlock({ text }) {
  return (
    <div style={{
      margin: '1.25rem 0',
      borderRadius: '10px',
      overflow: 'hidden',
      border: '1px solid rgba(192,83,74,0.22)',
      background: 'rgba(192,83,74,0.05)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.4rem 1rem',
        borderBottom: '1px solid rgba(192,83,74,0.14)',
      }}>
        <AlertTriangle style={{ width: '0.7rem', height: '0.7rem', color: C.danger }} />
        <span style={{
          fontSize: '0.58rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.18em',
          color: C.danger,
        }}>
          AP Trap
        </span>
      </div>
      <div style={{ padding: '0.875rem 1rem' }}>
        <p style={{ fontSize: '0.875rem', color: C.dangerText, lineHeight: 1.7, margin: 0 }}>
          <MathRenderer text={text} />
        </p>
      </div>
    </div>
  );
}

// ── FRQ Insight block ─────────────────────────────────────────────────────────
export function FRQBlock({ text }) {
  return (
    <div style={{
      margin: '1.25rem 0',
      borderRadius: '10px',
      overflow: 'hidden',
      border: '1px solid rgba(123,174,127,0.22)',
      background: 'rgba(123,174,127,0.05)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.4rem 1rem',
        borderBottom: '1px solid rgba(123,174,127,0.12)',
      }}>
        <Target style={{ width: '0.7rem', height: '0.7rem', color: C.accent }} />
        <span style={{
          fontSize: '0.58rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.18em',
          color: C.accent,
        }}>
          FRQ Insight
        </span>
      </div>
      <div style={{ padding: '0.875rem 1rem' }}>
        <p style={{ fontSize: '0.875rem', color: C.accentText, lineHeight: 1.7, margin: 0 }}>
          <MathRenderer text={text} />
        </p>
      </div>
    </div>
  );
}

// ── Key Takeaway block ────────────────────────────────────────────────────────
export function MemoryBlock({ text }) {
  return (
    <div style={{
      margin: '1.25rem 0',
      borderRadius: '10px',
      overflow: 'hidden',
      border: '1px solid rgba(123,174,127,0.2)',
      background: 'rgba(123,174,127,0.08)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.4rem 1rem',
        borderBottom: '1px solid rgba(123,174,127,0.1)',
      }}>
        <Zap style={{ width: '0.7rem', height: '0.7rem', color: C.accent }} />
        <span style={{
          fontSize: '0.58rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.18em',
          color: C.accent,
        }}>
          Key Takeaway
        </span>
      </div>
      <div style={{ padding: '0.875rem 1rem' }}>
        <p style={{ fontSize: '0.9rem', color: '#B8D4B8', lineHeight: 1.7, fontWeight: 500, margin: 0 }}>
          <MathRenderer text={text} />
        </p>
      </div>
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────
export function SectionHeading({ children, index }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', margin: '3rem 0 1.5rem' }}>
      <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#2E3530', userSelect: 'none', width: '1.5rem', flexShrink: 0 }}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 650, color: '#F4F4F2', lineHeight: 1.2, letterSpacing: '-0.015em', margin: 0 }}>
        {children}
      </h2>
    </div>
  );
}

// ── Key term entry ────────────────────────────────────────────────────────────
export function KeyTermEntry({ term, definition }) {
  return (
    <div style={{
      display: 'flex',
      gap: '1.5rem',
      padding: '0.875rem 0.25rem',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{ width: '180px', flexShrink: 0 }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: C.accent, margin: 0 }}>
          <MathRenderer text={term} />
        </p>
      </div>
      <p style={{ fontSize: '0.875rem', color: '#A4A8A5', lineHeight: 1.7, margin: 0, flex: 1 }}>
        <MathRenderer text={definition || ''} />
      </p>
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider() {
  return <div style={{ margin: '3rem 0', height: '1px', background: 'rgba(255,255,255,0.05)' }} />;
}

// ── RichText alias ────────────────────────────────────────────────────────────
export function RichText({ text, className }) {
  if (!text) return null;
  return <MathRenderer text={String(text)} />;
}

// ── Smart bullet — routes to the right block type ─────────────────────────────
export default function NoteBlocks({ text }) {
  if (!text) return null;
  const lower = text.toLowerCase();

  const isTrap = lower.startsWith('⚠') || /^(mistake:|common mistake:|trap:|don't confuse)/.test(lower) || lower.includes('students often') || lower.includes('common error');
  const isFRQ  = /^(frq:|frq insight:|on the frq)/.test(lower) || lower.includes('free response');
  const isMemory = /^(key:|remember:|takeaway:|tldr:|tl;dr)/.test(lower);
  const isFormula = text.includes('$$') || (text.trim().startsWith('$') && text.trim().endsWith('$') && text.length < 300);

  if (isTrap)    return <TrapBlock   text={text.replace(/^(⚠|mistake:|common mistake:|trap:)/i, '').trim()} />;
  if (isFRQ)     return <FRQBlock    text={text.replace(/^(frq:|frq insight:|on the frq)/i, '').trim()} />;
  if (isMemory)  return <MemoryBlock text={text.replace(/^(key:|remember:|takeaway:|tldr:|tl;dr)/i, '').trim()} />;
  if (isFormula) return <FormulaBlock text={text} />;
  return <ConceptBullet text={text} />;
}