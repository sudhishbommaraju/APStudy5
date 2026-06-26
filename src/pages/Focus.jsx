import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, SkipForward, Volume2, VolumeX, Music2 } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import FocusSounds from '@/components/focus/FocusSounds';

const MODES = {
  focus: { label: 'Focus', minutes: 25, accent: 'from-violet-600 to-fuchsia-600', icon: Brain },
  short: { label: 'Short Break', minutes: 5, accent: 'from-emerald-500 to-teal-500', icon: Coffee },
  long: { label: 'Long Break', minutes: 15, accent: 'from-sky-500 to-indigo-500', icon: Coffee },
};

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = 'sine';
    o.frequency.value = 660;
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    o.start();
    o.stop(ctx.currentTime + 0.9);
  } catch {
    /* ignore */
  }
}

export default function Focus() {
  const [mode, setMode] = useState('focus');
  const [secondsLeft, setSecondsLeft] = useState(MODES.focus.minutes * 60);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const intervalRef = useRef(null);

  const total = MODES[mode].minutes * 60;
  const progress = 1 - secondsLeft / total;

  const switchMode = useCallback((next) => {
    setRunning(false);
    setMode(next);
    setSecondsLeft(MODES[next].minutes * 60);
  }, []);

  const handleComplete = useCallback(() => {
    if (soundOn) beep();
    if (mode === 'focus') {
      const nextCount = completed + 1;
      setCompleted(nextCount);
      // Every 4th focus → long break
      switchMode(nextCount % 4 === 0 ? 'long' : 'short');
    } else {
      switchMode('focus');
    }
  }, [mode, completed, soundOn, switchMode]);

  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          handleComplete();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, handleComplete]);

  // Reflect timer in the tab title
  useEffect(() => {
    const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
    const ss = String(secondsLeft % 60).padStart(2, '0');
    document.title = `${mm}:${ss} — ${MODES[mode].label} · Proofly`;
    return () => {
      document.title = 'Proofly';
    };
  }, [secondsLeft, mode]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const Icon = MODES[mode].icon;

  const R = 130;
  const C = 2 * Math.PI * R;

  return (
    <AppShell title="Focus" subtitle="Pomodoro sessions to keep you in deep work.">
      <div className="mx-auto max-w-md">
        {/* Mode switch */}
        <div className="mb-8 grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-1.5">
          {Object.entries(MODES).map(([key, m]) => (
            <button
              key={key}
              onClick={() => switchMode(key)}
              className={[
                'rounded-xl px-3 py-2.5 text-sm font-semibold transition-all',
                mode === key
                  ? 'bg-brand-gradient text-white shadow-brand'
                  : 'text-muted-foreground hover:bg-secondary',
              ].join(' ')}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Timer dial */}
        <div className="card-elevated relative flex flex-col items-center overflow-hidden p-8">
          <div className="proofly-aurora pointer-events-none absolute inset-0" />
          <div className="relative">
            <svg width="300" height="300" viewBox="0 0 300 300" className="rotate-[-90deg]">
              <circle cx="150" cy="150" r={R} fill="none" stroke="hsl(var(--secondary))" strokeWidth="16" />
              <circle
                cx="150"
                cy="150"
                r={R}
                fill="none"
                stroke="url(#grad)"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - progress)}
                style={{ transition: 'stroke-dashoffset 0.5s linear' }}
              />
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#d946ef" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div
                className={`mb-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${MODES[mode].accent} px-3 py-1 text-xs font-semibold text-white`}
              >
                <Icon className="h-3.5 w-3.5" /> {MODES[mode].label}
              </div>
              <div className="font-display text-6xl font-extrabold tabular-nums tracking-tight text-foreground">
                {mm}:{ss}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {completed} session{completed === 1 ? '' : 's'} done
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="relative mt-6 flex items-center gap-3">
            <button
              onClick={() => setSecondsLeft(total)}
              className="grid h-12 w-12 place-items-center rounded-full border border-border bg-card text-foreground/70 hover:bg-secondary"
              title="Reset"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            <button
              onClick={() => setRunning((r) => !r)}
              className="grid h-16 w-16 place-items-center rounded-full bg-brand-gradient text-white shadow-brand transition-transform hover:scale-105"
            >
              {running ? <Pause className="h-7 w-7" /> : <Play className="ml-0.5 h-7 w-7" />}
            </button>
            <button
              onClick={handleComplete}
              className="grid h-12 w-12 place-items-center rounded-full border border-border bg-card text-foreground/70 hover:bg-secondary"
              title="Skip"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>

          <button
            onClick={() => setSoundOn((s) => !s)}
            className="relative mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            Chime {soundOn ? 'on' : 'off'}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Tip: 4 focus sessions then take a long break. Your timer keeps running in the tab title.
        </p>
      </div>

      {/* Focus Sounds */}
      <div className="mx-auto mt-10 max-w-3xl">
        <div className="mb-3 flex items-center gap-2">
          <Music2 className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-bold text-foreground">Focus sounds</h2>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
            continuous · ad-free
          </span>
        </div>
        <FocusSounds variant="light" />
      </div>
    </AppShell>
  );
}
