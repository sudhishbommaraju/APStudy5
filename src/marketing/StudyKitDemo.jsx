import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Youtube, Type, NotebookPen, Layers, Dumbbell, Check, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const INPUTS = [
  { key: 'pdf', label: 'PDF', icon: FileText, sample: 'Chapter 4 — Kinematics.pdf' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, sample: 'youtu.be/AP-physics-lecture' },
  { key: 'text', label: 'Text', icon: Type, sample: 'Pasted lecture notes…' },
];

const OUTPUTS = [
  { key: 'notes', label: 'Notes', icon: NotebookPen },
  { key: 'cards', label: 'Flashcards', icon: Layers },
  { key: 'quiz', label: 'Practice', icon: Dumbbell },
];

function NotesPreview() {
  return (
    <div className="space-y-3 text-left">
      <p className="flex items-center gap-2 text-lg font-semibold text-white">📘 Newton's Second Law</p>
      <p className="text-sm leading-relaxed text-white/70">
        The net force on an object equals its mass times its acceleration:
      </p>
      <div className="rounded-xl bg-white/5 px-4 py-3 text-center text-white">
        <BlockMath math={'\\vec{F}_{net} = m\\vec{a}'} />
      </div>

      {/* AI-generated diagram */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <svg viewBox="0 0 240 96" className="mx-auto h-24 w-full">
          <rect x="78" y="34" width="52" height="42" rx="7" fill="#3b82f6" fillOpacity="0.85" />
          <text x="104" y="61" fontSize="15" fill="#fff" textAnchor="middle">m</text>
          <line x1="130" y1="55" x2="206" y2="55" stroke="#60a5fa" strokeWidth="3" />
          <polygon points="206,55 195,49 195,61" fill="#60a5fa" />
          <text x="172" y="46" fontSize="12" fill="#93c5fd" textAnchor="middle">F</text>
          <line x1="104" y1="80" x2="104" y2="92" stroke="#22d3ee" strokeWidth="2" />
          <polygon points="104,92 99,84 109,84" fill="#22d3ee" />
          <text x="120" y="90" fontSize="11" fill="#67e8f9" textAnchor="middle">a</text>
        </svg>
        <p className="mt-1 flex items-center justify-center gap-1 text-[11px] text-white/40">
          <ImageIcon className="h-3 w-3" /> AI diagram · free-body diagram
        </p>
      </div>

      {/* comparison table */}
      <table className="w-full overflow-hidden rounded-lg text-left text-xs">
        <thead>
          <tr className="bg-white/[0.06] text-white/60">
            <th className="px-3 py-2 font-medium">Change</th>
            <th className="px-3 py-2 font-medium">Effect on $a$</th>
          </tr>
        </thead>
        <tbody className="text-white/80">
          <tr className="border-t border-white/10">
            <td className="px-3 py-2">Force doubles</td>
            <td className="px-3 py-2">doubles</td>
          </tr>
          <tr className="border-t border-white/10">
            <td className="px-3 py-2">Mass doubles</td>
            <td className="px-3 py-2">halves</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function CardsPreview() {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="flex h-full items-center justify-center">
      <button
        onClick={() => setFlipped((f) => !f)}
        className="relative h-44 w-full max-w-xs"
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative h-full w-full transition-transform duration-500"
          style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'none' }}
        >
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white/5 p-5 text-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="mb-2 text-[10px] uppercase tracking-widest text-white/40">Question</span>
            <span className="text-white">State Newton's second law as an equation.</span>
            <span className="mt-3 text-xs text-white/35">Tap to flip</span>
          </div>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white/10 p-5 text-center"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <span className="mb-2 text-[10px] uppercase tracking-widest text-white/40">Answer</span>
            <span className="text-white text-xl">
              <InlineMath math={'\\vec{F} = m\\vec{a}'} />
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}

function QuizPreview() {
  const [picked, setPicked] = useState(null);
  const correct = 1;
  const options = ['It halves', 'It doubles', 'It stays the same', 'It quadruples'];
  return (
    <div className="text-left">
      <p className="mb-3 text-sm text-white/85">
        If net force doubles and mass is constant, what happens to acceleration?
      </p>
      <div className="space-y-2">
        {options.map((o, i) => {
          const revealed = picked !== null;
          const isCorrect = i === correct;
          const isChosen = picked === i;
          let cls = 'bg-white/5 hover:bg-white/10';
          if (revealed && isCorrect) cls = 'bg-emerald-500/20 ring-1 ring-emerald-400/50';
          else if (revealed && isChosen) cls = 'bg-red-500/15 ring-1 ring-red-400/40';
          return (
            <button
              key={i}
              disabled={revealed}
              onClick={() => setPicked(i)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/90 transition-all ${cls}`}
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white/10 text-xs">
                {String.fromCharCode(65 + i)}
              </span>
              {o}
              {revealed && isCorrect && <Check className="ml-auto h-4 w-4 text-emerald-300" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function StudyKitDemo() {
  const [input, setInput] = useState('pdf');
  const [output, setOutput] = useState('notes');
  const ActiveInput = INPUTS.find((i) => i.key === input);

  return (
    <div className="liquid-glass liquid-glass-strong mx-auto grid max-w-4xl gap-0 overflow-hidden rounded-[28px] md:grid-cols-[0.85fr_1.15fr]">
      {/* Input side */}
      <div className="border-b border-white/10 p-6 md:border-b-0 md:border-r">
        <p className="text-[11px] uppercase tracking-widest text-white/40">Drop anything</p>
        <div className="mt-4 flex gap-2">
          {INPUTS.map((i) => {
            const Icon = i.icon;
            return (
              <button
                key={i.key}
                onClick={() => setInput(i.key)}
                className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs transition-all ${
                  input === i.key ? 'bg-white text-[hsl(201,100%,13%)]' : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <Icon className="h-4 w-4" />
                {i.label}
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-6">
          <ActiveInput.icon className="h-5 w-5 text-white/60" />
          <span className="text-sm text-white/60">{ActiveInput.sample}</span>
        </div>
        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-white/40">
          <span className="animate-pulse">●</span> Proofly is reading & generating
        </div>
      </div>

      {/* Output side */}
      <div className="p-6">
        <div className="flex gap-2">
          {OUTPUTS.map((o) => {
            const Icon = o.icon;
            return (
              <button
                key={o.key}
                onClick={() => setOutput(o.key)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all ${
                  output === o.key ? 'bg-white text-[hsl(201,100%,13%)]' : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {o.label}
              </button>
            );
          })}
        </div>
        <div className="mt-5 min-h-[220px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={output + input}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
            >
              {output === 'notes' && <NotesPreview />}
              {output === 'cards' && <CardsPreview />}
              {output === 'quiz' && <QuizPreview />}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mt-4 flex items-center gap-1.5 text-xs text-white/45">
          Generated in seconds <ArrowRight className="h-3 w-3" /> ready to study
        </div>
      </div>
    </div>
  );
}
