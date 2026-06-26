import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Sparkles,
  NotebookPen,
  Layers,
  Dumbbell,
  Check,
  RotateCw,
} from 'lucide-react';

const STAGES = [
  { at: 0, label: 'Reading your document…' },
  { at: 22, label: 'Extracting key concepts…' },
  { at: 46, label: 'Writing LaTeX notes…' },
  { at: 68, label: 'Building flashcards…' },
  { at: 86, label: 'Generating practice…' },
  { at: 100, label: 'Study kit ready' },
];

const RESULTS = [
  { icon: NotebookPen, label: 'Notes', meta: '4 sections · LaTeX' },
  { icon: Layers, label: 'Flashcards', meta: '12 cards' },
  { icon: Dumbbell, label: 'Practice', meta: '8 questions' },
];

function stageFor(p) {
  let s = STAGES[0].label;
  for (const st of STAGES) if (p >= st.at) s = st.label;
  return s;
}

export default function BuildDemo() {
  const [progress, setProgress] = useState(0);
  const [runId, setRunId] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    let start = null;
    const DURATION = 4200;
    const tick = (ts) => {
      if (start === null) start = ts;
      const elapsed = ts - start;
      const p = Math.min(100, Math.round((elapsed / DURATION) * 100));
      setProgress(p);
      if (p < 100) {
        raf.current = requestAnimationFrame(tick);
      } else {
        // hold the finished state, then auto-replay
        raf.current = setTimeout(() => setRunId((r) => r + 1), 4500);
      }
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (typeof raf.current === 'number') cancelAnimationFrame(raf.current);
      clearTimeout(raf.current);
    };
  }, [runId]);

  const done = progress >= 100;

  return (
    <div className="liquid-glass liquid-glass-strong mx-auto max-w-3xl overflow-hidden rounded-[28px] p-6 sm:p-8">
      {/* Source file */}
      <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <motion.div
          key={`file-${runId}`}
          initial={{ y: -18, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          className="grid h-12 w-12 place-items-center rounded-xl bg-white/10"
        >
          <FileText className="h-6 w-6 text-white" />
        </motion.div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">Chapter 4 — Kinematics.pdf</p>
          <p className="text-xs text-white/45">Dropped into Proofly</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/55">
          <Sparkles className="h-3.5 w-3.5" /> AI
        </div>
      </div>

      {/* Progress */}
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-white/70">
            {!done && (
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white/80" />
            )}
            {stageFor(progress)}
          </span>
          <span className="tabular-nums font-medium text-white">{progress}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-white/60 to-white"
            style={{ width: `${progress}%` }}
            transition={{ ease: 'linear' }}
          />
        </div>
      </div>

      {/* Result tiles */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {RESULTS.map((r, i) => {
          const Icon = r.icon;
          const reached = progress >= [50, 75, 95][i];
          return (
            <motion.div
              key={`${r.label}-${runId}`}
              animate={{
                opacity: reached ? 1 : 0.35,
                scale: reached ? 1 : 0.97,
              }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
            >
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-white" />
                <AnimatePresence>
                  {reached && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="grid h-5 w-5 place-items-center rounded-full bg-emerald-400 text-[hsl(201,100%,13%)]"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <p className="mt-3 text-sm font-semibold text-white">{r.label}</p>
              <p className="text-xs text-white/45">{r.meta}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between">
        <AnimatePresence mode="wait">
          <motion.p
            key={done ? 'done' : 'building'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-white/55"
          >
            {done ? 'Built in seconds — your kit is ready to study.' : 'Proofly is building your study kit…'}
          </motion.p>
        </AnimatePresence>
        <button
          onClick={() => setRunId((r) => r + 1)}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white transition-colors hover:bg-white/20"
        >
          <RotateCw className="h-3.5 w-3.5" /> Replay
        </button>
      </div>
    </div>
  );
}
