import React from 'react';
import { AlertTriangle, Zap, Target, Star } from 'lucide-react';
import MathRenderer from '@/components/ui/MathRenderer';

// ── Inline math-aware text renderer ──────────────────────────────────────────
export function RichText({ text, className = '' }) {
  if (!text) return null;
  return <MathRenderer text={String(text)} className={className} />;
}

// ── Section heading ───────────────────────────────────────────────────────────
export function SectionHeading({ children, index }) {
  return (
    <div className="flex items-baseline gap-3 mb-5 mt-12 first:mt-0">
      <span className="text-[0.625rem] font-mono text-[#3A3A3A] select-none w-5 shrink-0 tabular-nums">
        {String(index + 1).padStart(2, '0')}
      </span>
      <h2 className="text-[1.2rem] font-semibold text-[#F0EDE8] leading-snug tracking-tight">
        {children}
      </h2>
    </div>
  );
}

// ── Concept bullet (default) ──────────────────────────────────────────────────
export function ConceptBullet({ text }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0 group">
      <span className="mt-[9px] w-1 h-1 rounded-full bg-[#333] shrink-0 group-hover:bg-[#7BAE7F] transition-colors" />
      <p className="text-[0.9375rem] text-[#B8B2AA] leading-[1.8] flex-1 group-hover:text-[#D0CBC2] transition-colors">
        <RichText text={text} />
      </p>
    </div>
  );
}

// ── Formula block ─────────────────────────────────────────────────────────────
export function FormulaBlock({ text }) {
  return (
    <div className="my-4 rounded-lg overflow-hidden border border-[rgba(123,174,127,0.15)]">
      <div className="flex items-center gap-2 px-4 py-2 bg-[rgba(123,174,127,0.06)] border-b border-[rgba(123,174,127,0.1)]">
        <span className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-[#7BAE7F]">Formula</span>
      </div>
      <div className="px-6 py-5 bg-[#0D0D0D] overflow-x-auto">
        <div className="text-center text-[#D0C9B8]">
          <MathRenderer text={text} />
        </div>
      </div>
    </div>
  );
}

// ── AP Trap / Common Mistake block ────────────────────────────────────────────
export function TrapBlock({ text }) {
  return (
    <div className="my-4 rounded-lg border border-[rgba(192,83,74,0.2)] bg-[rgba(192,83,74,0.05)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[rgba(192,83,74,0.15)]">
        <AlertTriangle className="w-3 h-3 text-[#C0534A]" />
        <span className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-[#C0534A]">Common Mistake</span>
      </div>
      <div className="px-4 py-3.5">
        <p className="text-[0.875rem] text-[#D4A09A] leading-relaxed">
          <RichText text={text} />
        </p>
      </div>
    </div>
  );
}

// ── FRQ Insight block ─────────────────────────────────────────────────────────
export function FRQBlock({ text }) {
  return (
    <div className="my-4 rounded-lg border border-[rgba(123,174,127,0.2)] bg-[rgba(123,174,127,0.05)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[rgba(123,174,127,0.12)]">
        <Target className="w-3 h-3 text-[#7BAE7F]" />
        <span className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-[#7BAE7F]">FRQ Insight</span>
      </div>
      <div className="px-4 py-3.5">
        <p className="text-[0.875rem] text-[#A8C8A8] leading-relaxed">
          <RichText text={text} />
        </p>
      </div>
    </div>
  );
}

// ── Key Takeaway block ────────────────────────────────────────────────────────
export function MemoryBlock({ text }) {
  return (
    <div className="my-4 rounded-lg border border-[rgba(123,174,127,0.18)] bg-[rgba(123,174,127,0.07)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[rgba(123,174,127,0.1)]">
        <Zap className="w-3 h-3 text-[#7BAE7F]" />
        <span className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-[#7BAE7F]">Key Takeaway</span>
      </div>
      <div className="px-4 py-3.5">
        <p className="text-[0.875rem] text-[#B8D4B8] leading-relaxed font-medium">
          <RichText text={text} />
        </p>
      </div>
    </div>
  );
}

// ── Frequently Tested badge ───────────────────────────────────────────────────
export function FrequentlyTested() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-bold uppercase tracking-[0.15em]"
      style={{ background: 'rgba(168,125,58,0.12)', border: '1px solid rgba(168,125,58,0.25)', color: '#C9A05A' }}>
      <Star className="w-2.5 h-2.5" /> Frequently Tested
    </span>
  );
}

// ── Key term entry ────────────────────────────────────────────────────────────
export function KeyTermEntry({ term, definition }) {
  return (
    <div className="flex gap-4 py-3 border-b border-[rgba(255,255,255,0.04)] last:border-0 group hover:bg-[rgba(255,255,255,0.015)] rounded px-1 transition-colors">
      <div className="w-[160px] shrink-0">
        <p className="text-[0.875rem] font-semibold text-[#7BAE7F]">
          <RichText text={term} />
        </p>
      </div>
      <p className="text-[0.875rem] text-[#A8A29A] leading-relaxed flex-1">
        <RichText text={definition || ''} />
      </p>
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider() {
  return <div className="my-10 h-px bg-[rgba(255,255,255,0.05)]" />;
}

// ── Smart bullet: auto-detects block type from content ────────────────────────
export function SmartBullet({ text }) {
  if (!text) return null;
  const lower = text.toLowerCase();

  const isTrap = lower.startsWith('⚠') || lower.startsWith('mistake:') || lower.startsWith('common mistake:') || lower.startsWith('trap:') || lower.startsWith("don't confuse") || lower.includes('students often') || lower.includes('common error');
  const isFRQ  = lower.startsWith('frq:') || lower.startsWith('frq insight:') || lower.startsWith('on the frq') || lower.includes('free response');
  const isMemory = lower.startsWith('key:') || lower.startsWith('remember:') || lower.startsWith('takeaway:') || lower.startsWith('tldr:') || lower.startsWith('tl;dr');
  const isFormula = (text.includes('$$') || (text.startsWith('$') && text.endsWith('$'))) && text.length < 200;

  if (isTrap)   return <TrapBlock   text={text.replace(/^(⚠|mistake:|common mistake:|trap:)/i, '').trim()} />;
  if (isFRQ)    return <FRQBlock    text={text.replace(/^(frq:|frq insight:|on the frq)/i, '').trim()} />;
  if (isMemory) return <MemoryBlock text={text.replace(/^(key:|remember:|takeaway:|tldr:|tl;dr)/i, '').trim()} />;
  if (isFormula) return <FormulaBlock text={text} />;
  return <ConceptBullet text={text} />;
}