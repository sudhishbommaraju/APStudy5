import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, animate, useMotionValue, useMotionValueEvent } from 'framer-motion';
import MathRenderer from '@/components/ui/MathRenderer';

const serif = { fontFamily: "'Instrument Serif', serif" };
export const SERIF = serif;

/* Scroll-reveal wrapper */
export function Reveal({ children, delay = 0, y = 28, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* Count-up number when scrolled into view */
export function AnimatedCounter({ to, suffix = '', duration = 1.6, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState('0');

  useMotionValueEvent(mv, 'change', (v) => {
    setDisplay(Math.round(v).toLocaleString());
  });

  useEffect(() => {
    if (inView) {
      const controls = animate(mv, to, { duration, ease: [0.22, 1, 0.36, 1] });
      return controls.stop;
    }
  }, [inView, to, duration, mv]);

  return (
    <span ref={ref} className={className}>
      {display}
      {suffix}
    </span>
  );
}

/* Mouse-tracking tilt card */
export function TiltCard({ children, className = '' }) {
  const ref = useRef(null);
  const [t, setT] = useState({ rx: 0, ry: 0 });

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setT({ rx: -py * 8, ry: px * 8 });
  };
  const reset = () => setT({ rx: 0, ry: 0 });

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{
        transform: `perspective(900px) rotateX(${t.rx}deg) rotateY(${t.ry}deg)`,
        transition: 'transform 0.2s ease-out',
      }}
      className={className}
    >
      {children}
    </div>
  );
}

/* 3D flip flashcard */
export function FlipCard({ front, back, className = '' }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      onClick={() => setFlipped((f) => !f)}
      className={`group relative ${className}`}
      style={{ perspective: '1200px' }}
      aria-label="Flip flashcard"
    >
      <div
        className="relative h-full w-full transition-transform duration-500"
        style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'none' }}
      >
        <div
          className="liquid-glass absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl px-6 py-7 text-center"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">Question</span>
          <div className="flex flex-1 items-center justify-center text-lg leading-relaxed text-white">
            <MathRenderer text={front} />
          </div>
          <span className="text-xs text-white/35">Tap to flip</span>
        </div>
        <div
          className="liquid-glass liquid-glass-strong absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl px-6 py-7 text-center"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">Answer</span>
          <div className="flex flex-1 items-center justify-center text-2xl leading-relaxed text-white">
            <MathRenderer text={back} />
          </div>
        </div>
      </div>
    </button>
  );
}
