import React from 'react';
import { AlertTriangle, Zap, Target, Lightbulb } from 'lucide-react';
import MathRenderer from '@/components/ui/MathRenderer';

// ── Colour palette ────────────────────────────────────────────────────────────
const C = {
  text:    '#C9C9C9',
  accent:  '#7BAE7F',
  danger:  '#C0534A',
  warn:    '#C9A05A',
};

// ── Standard concept paragraph / bullet ──────────────────────────────────────
export function ConceptBullet({ text }) {
  // Bold **text** support
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p style={{ fontSize: '1rem', color: C.text, lineHeight: 1.75, margin: '0 0 0.75rem 0' }}>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i} style={{ color: '#E8E5E0', fontWeight: 600 }}><MathRenderer text={p.slice(2, -2)} /></strong>
          : <MathRenderer key={i} text={p} />
      )}
    </p>
  );
}

// ── Block formula ─────────────────────────────────────────────────────────────
export function FormulaBlock({ text }) {
  return (
    <div style={{
      margin: '1.5rem 0',
      borderRadius: '10px',
      border: '1px solid rgba(123,174,127,0.18)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '0.35rem 1rem',
        background: 'rgba(123,174,127,0.07)',
        borderBottom: '1px solid rgba(123,174,127,0.1)',
        fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.18em', color: C.accent,
      }}>
        Formula
      </div>
      <div style={{
        padding: '1.25rem 1.5rem', background: '#141814',
        textAlign: 'center', overflowX: 'auto',
        color: '#D0C9B8', fontSize: '1.05rem',
      }}>
        <MathRenderer text={text} />
      </div>
    </div>
  );
}

// ── AP Trap block ─────────────────────────────────────────────────────────────
export function TrapBlock({ text }) {
  return (
    <div style={{
      margin: '1.5rem 0', borderRadius: '10px',
      border: '1px solid rgba(192,83,74,0.2)', background: 'rgba(192,83,74,0.04)',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.35rem 1rem',
        borderBottom: '1px solid rgba(192,83,74,0.1)',
      }}>
        <AlertTriangle style={{ width: '10px', height: '10px', color: C.danger }} />
        <span style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: C.danger }}>
          AP Trap
        </span>
      </div>
      <div style={{ padding: '0.875rem 1rem' }}>
        <p style={{ fontSize: '0.9rem', color: '#D4A09A', lineHeight: 1.7, margin: 0 }}>
          <MathRenderer text={text} />
        </p>
      </div>
    </div>
  );
}

// ── In-action example ─────────────────────────────────────────────────────────
export function ExampleBlock({ text }) {
  return (
    <div style={{
      margin: '1.5rem 0', borderRadius: '10px',
      border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.35rem 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <Lightbulb style={{ width: '10px', height: '10px', color: '#888' }} />
        <span style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#666' }}>
          In Action
        </span>
      </div>
      <div style={{ padding: '0.875rem 1rem' }}>
        <p style={{ fontSize: '0.9rem', color: '#AEAAA5', lineHeight: 1.7, margin: 0 }}>
          <MathRenderer text={text} />
        </p>
      </div>
    </div>
  );
}

// ── FRQ insight ───────────────────────────────────────────────────────────────
export function FRQBlock({ text }) {
  return (
    <div style={{
      margin: '1.5rem 0', borderRadius: '10px',
      border: '1px solid rgba(123,174,127,0.2)', background: 'rgba(123,174,127,0.04)',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.35rem 1rem',
        borderBottom: '1px solid rgba(123,174,127,0.1)',
      }}>
        <Target style={{ width: '10px', height: '10px', color: C.accent }} />
        <span style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: C.accent }}>
          FRQ Insight
        </span>
      </div>
      <div style={{ padding: '0.875rem 1rem' }}>
        <p style={{ fontSize: '0.9rem', color: '#A8CCA8', lineHeight: 1.7, margin: 0 }}>
          <MathRenderer text={text} />
        </p>
      </div>
    </div>
  );
}

// ── Key takeaway ──────────────────────────────────────────────────────────────
export function MemoryBlock({ text }) {
  return (
    <div style={{
      margin: '1.5rem 0', borderRadius: '10px',
      border: '1px solid rgba(123,174,127,0.22)', background: 'rgba(123,174,127,0.07)',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.35rem 1rem',
        borderBottom: '1px solid rgba(123,174,127,0.1)',
      }}>
        <Zap style={{ width: '10px', height: '10px', color: C.accent }} />
        <span style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: C.accent }}>
          Key Takeaway
        </span>
      </div>
      <div style={{ padding: '0.875rem 1rem' }}>
        <p style={{ fontSize: '0.9375rem', color: '#B8D4B8', lineHeight: 1.7, fontWeight: 500, margin: 0 }}>
          <MathRenderer text={text} />
        </p>
      </div>
    </div>
  );
}

// ── Smart router — default export ─────────────────────────────────────────────
export default function NoteBlocks({ text }) {
  if (!text) return null;
  const t = text.trim();
  const lower = t.toLowerCase();

  // Block formula: wrapped in $$ or lone $...$
  const isFormula =
    (t.startsWith('$$') && t.endsWith('$$')) ||
    (t.startsWith('$') && t.endsWith('$') && !t.slice(1, -1).includes('$') && t.length < 400);

  if (isFormula) return <FormulaBlock text={t} />;

  // AP trap
  if (
    lower.startsWith('⚠') ||
    /^(mistake:|common mistake:|trap:|ap trap:)/i.test(lower) ||
    lower.includes('students often') ||
    lower.includes('common error')
  ) {
    return <TrapBlock text={t.replace(/^(⚠\s*|mistake:|common mistake:|trap:|ap trap:)/i, '').trim()} />;
  }

  // In action / example
  if (/^(example:|in action:|e\.g\.:)/i.test(lower)) {
    return <ExampleBlock text={t.replace(/^(example:|in action:|e\.g\.:)/i, '').trim()} />;
  }

  // FRQ
  if (/^(frq:|frq insight:|on the frq)/i.test(lower) || lower.includes('free response')) {
    return <FRQBlock text={t.replace(/^(frq:|frq insight:|on the frq)/i, '').trim()} />;
  }

  // Key takeaway
  if (/^(key:|remember:|takeaway:|tldr:|tl;dr:)/i.test(lower)) {
    return <MemoryBlock text={t.replace(/^(key:|remember:|takeaway:|tldr:|tl;dr:)/i, '').trim()} />;
  }

  // Default: paragraph
  return <ConceptBullet text={t} />;
}