import React from 'react';
import { AlertTriangle, Lightbulb, BookOpen, Star, Zap, Target } from 'lucide-react';
import MathRenderer from '@/components/ui/MathRenderer';

// ── Inline math-aware text renderer ────────────────────────────────────────
export function RichText({ text, className = '' }) {
  if (!text) return null;
  return <MathRenderer text={String(text)} className={className} />;
}

// ── Section heading ─────────────────────────────────────────────────────────
export function SectionHeading({ children, index }) {
  return (
    <div className="flex items-baseline gap-3 mb-5 mt-12 first:mt-0">
      <span className="text-xs font-mono text-[#555] select-none w-5 shrink-0">{String(index + 1).padStart(2, '0')}</span>
      <h2 className="text-[1.35rem] font-bold text-[#F0EDE8] leading-tight tracking-tight">{children}</h2>
    </div>
  );
}

// ── Concept bullet ───────────────────────────────────────────────────────────
export function ConceptBullet({ text }) {
  return (
    <div className="flex items-start gap-3 mb-3.5">
      <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-[#8A8A8A] shrink-0" />
      <p className="text-[0.95rem] text-[#C8C3BB] leading-[1.8] flex-1">
        <RichText text={text} />
      </p>
    </div>
  );
}

// ── Formula block ────────────────────────────────────────────────────────────
export function FormulaBlock({ text }) {
  const isBlock = text.includes('$$') || (text.trim().startsWith('$') && text.trim().endsWith('$') && text.length > 4);
  return (
    <div className="my-5 px-6 py-4 bg-[#0F0F0F] border border-[#2C2C2C] rounded-xl overflow-x-auto">
      <div className="text-center text-[#D6B98C]">
        <MathRenderer text={text} />
      </div>
    </div>
  );
}

// ── AP Trap block ────────────────────────────────────────────────────────────
export function TrapBlock({ text }) {
  return (
    <div className="my-5 flex gap-3 px-4 py-4 bg-[#1A0E0E] border border-[#4A1A1A] rounded-xl">
      <AlertTriangle className="w-4 h-4 text-[#E05252] shrink-0 mt-0.5" />
      <div>
        <p className="text-[0.7rem] font-bold uppercase tracking-widest text-[#E05252] mb-1.5">Common Mistake</p>
        <p className="text-[0.875rem] text-[#DDAAAA] leading-relaxed"><RichText text={text} /></p>
      </div>
    </div>
  );
}

// ── FRQ Insight block ────────────────────────────────────────────────────────
export function FRQBlock({ text }) {
  return (
    <div className="my-5 flex gap-3 px-4 py-4 bg-[#0C1320] border border-[#1E3A5F] rounded-xl">
      <Target className="w-4 h-4 text-[#5B9BD5] shrink-0 mt-0.5" />
      <div>
        <p className="text-[0.7rem] font-bold uppercase tracking-widest text-[#5B9BD5] mb-1.5">FRQ Insight</p>
        <p className="text-[0.875rem] text-[#A8C8E8] leading-relaxed"><RichText text={text} /></p>
      </div>
    </div>
  );
}

// ── Memory / Key Takeaway block ──────────────────────────────────────────────
export function MemoryBlock({ text }) {
  return (
    <div className="my-5 flex gap-3 px-4 py-4 bg-[#0E1510] border border-[#1E4A28] rounded-xl">
      <Zap className="w-4 h-4 text-[#4CAF6E] shrink-0 mt-0.5" />
      <div>
        <p className="text-[0.7rem] font-bold uppercase tracking-widest text-[#4CAF6E] mb-1.5">Key Takeaway</p>
        <p className="text-[0.875rem] text-[#A0D4B0] leading-relaxed font-medium"><RichText text={text} /></p>
      </div>
    </div>
  );
}

// ── Frequently Tested tag ────────────────────────────────────────────────────
export function FrequentlyTested() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#1A1500] border border-[#4A3D00] rounded-full text-[0.65rem] font-bold uppercase tracking-widest text-[#D4A800]">
      <Star className="w-2.5 h-2.5" /> Frequently Tested
    </span>
  );
}

// ── Key term entry ────────────────────────────────────────────────────────────
export function KeyTermEntry({ term, definition }) {
  return (
    <div className="py-3.5 border-b border-[#1E1E1E] last:border-0 flex gap-3">
      <div className="w-[180px] shrink-0">
        <p className="text-[0.875rem] font-semibold text-[#D6B98C]"><RichText text={term} /></p>
      </div>
      <p className="text-[0.875rem] text-[#B0AAA0] leading-relaxed flex-1"><RichText text={definition || ''} /></p>
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider() {
  return <div className="my-8 border-t border-[#1C1C1C]" />;
}

// ── Smart bullet parser: detects trap / frq / formula / memory patterns ──────
export function SmartBullet({ text }) {
  if (!text) return null;
  const lower = text.toLowerCase();

  const isTrap = lower.startsWith('⚠') || lower.startsWith('mistake:') || lower.startsWith('common mistake:') || lower.startsWith('trap:') || lower.startsWith('don\'t confuse') || lower.includes('students often') || lower.includes('common error');
  const isFRQ = lower.startsWith('frq:') || lower.startsWith('frq insight:') || lower.startsWith('on the frq') || lower.includes('free response');
  const isMemory = lower.startsWith('key:') || lower.startsWith('remember:') || lower.startsWith('takeaway:') || lower.startsWith('tldr:') || lower.startsWith('tl;dr');
  const isFormula = (text.includes('$$') || (text.startsWith('$') && text.endsWith('$'))) && text.length < 200;

  if (isTrap) return <TrapBlock text={text.replace(/^(⚠|mistake:|common mistake:|trap:)/i, '').trim()} />;
  if (isFRQ) return <FRQBlock text={text.replace(/^(frq:|frq insight:|on the frq)/i, '').trim()} />;
  if (isMemory) return <MemoryBlock text={text.replace(/^(key:|remember:|takeaway:|tldr:|tl;dr)/i, '').trim()} />;
  if (isFormula) return <FormulaBlock text={text} />;
  return <ConceptBullet text={text} />;
}