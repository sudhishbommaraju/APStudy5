import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload,
  Sparkles,
  GraduationCap,
  NotebookPen,
  Layers,
  Dumbbell,
  Timer,
  BarChart3,
  FileText,
  MessageSquare,
  ArrowUpRight,
} from 'lucide-react';
import MarketingLayout from './MarketingLayout';
import StudyKitDemo from './StudyKitDemo';
import BuildDemo from './BuildDemo';
import FocusSounds from '@/components/focus/FocusSounds';
import { Reveal, TiltCard, FlipCard, SERIF } from './MarketingBits';

const STEPS = [
  {
    icon: Upload,
    title: 'Drop your material',
    desc: 'A PDF, a Word doc, pasted notes, or a YouTube link. Proofly reads it all — even pulls the transcript from a lecture video automatically.',
  },
  {
    icon: Sparkles,
    title: 'AI builds your kit',
    desc: 'In seconds, Proofly writes structured notes, generates flashcards, and creates AP-style practice questions — every formula rendered in clean LaTeX.',
  },
  {
    icon: GraduationCap,
    title: 'Study and track',
    desc: 'Review with spaced repetition, drill with adaptive practice, focus with a Pomodoro, and watch your mastery climb in analytics.',
  },
];

const ALL_FEATURES = [
  { icon: NotebookPen, title: 'LaTeX notes', desc: 'Structured, downloadable as .tex or Markdown.' },
  { icon: Layers, title: 'Spaced-repetition flashcards', desc: 'Decks that schedule your reviews for retention.' },
  { icon: Dumbbell, title: 'Adaptive practice', desc: 'MCQs with explanations that adjust to your level.' },
  { icon: FileText, title: 'FRQ & full tests', desc: 'College Board-aligned free-response and exams.' },
  { icon: Timer, title: 'Pomodoro focus', desc: 'Deep-work timer with session tracking.' },
  { icon: BarChart3, title: 'Analytics', desc: 'Strengths, weak spots, and mastery over time.' },
  { icon: MessageSquare, title: 'AI tutor', desc: 'Ask anything; get clear, worked explanations.' },
  { icon: GraduationCap, title: '25 AP subjects', desc: 'Unit- and topic-aligned across every AP.' },
];

const CARDS = [
  { front: 'Chain rule for $\\frac{d}{dx}f(g(x))$?', back: "$f'(g(x))\\,g'(x)$" },
  { front: 'Units of acceleration?', back: '$m/s^2$' },
  { front: 'Quadratic formula', back: '$x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}$' },
];

export default function Features() {
  const [step, setStep] = useState(0);
  return (
    <MarketingLayout>
      {/* Header */}
      <section className="relative px-6 pb-12 pt-40 text-center">
        <Reveal>
          <p className="mb-4 text-xs uppercase tracking-widest text-white/40">Features</p>
          <h1 className="mx-auto max-w-4xl text-5xl leading-[0.98] tracking-[-1.5px] text-white sm:text-7xl" style={SERIF}>
            Built to turn material into <em className="not-italic text-white/55">mastery.</em>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-white/65">
            Every tool a serious AP student needs — in one calm, focused place.
          </p>
        </Reveal>
      </section>

      {/* Live build demo */}
      <section className="relative z-10 px-6 py-10">
        <Reveal className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-4xl tracking-tight text-white sm:text-5xl" style={SERIF}>
            Watch a study kit <em className="not-italic text-white/55">build itself.</em>
          </h2>
          <p className="mt-4 text-white/60">
            Drop material in, and Proofly assembles your notes, flashcards, and practice — live.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <BuildDemo />
        </Reveal>
      </section>

      {/* Interactive how-it-works */}
      <section className="relative z-10 px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <div className="space-y-3">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const active = step === i;
                return (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={`flex w-full items-start gap-4 rounded-3xl p-6 text-left transition-all ${
                      active ? 'liquid-glass liquid-glass-strong' : 'opacity-55 hover:opacity-90'
                    }`}
                  >
                    <div
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
                        active ? 'bg-white text-[hsl(201,100%,13%)]' : 'bg-white/10 text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/40">0{i + 1}</span>
                        <h3 className="text-xl text-white" style={SERIF}>
                          {s.title}
                        </h3>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-white/60">{s.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <StudyKitDemo />
          </Reveal>
        </div>
      </section>

      {/* Flashcard demo row */}
      <section className="relative z-10 px-6 py-16">
        <Reveal className="mb-10 text-center">
          <h2 className="text-4xl tracking-tight text-white sm:text-5xl" style={SERIF}>
            Flashcards that <em className="not-italic text-white/55">flip.</em>
          </h2>
          <p className="mt-3 text-white/55">Real LaTeX on both sides. Tap any card.</p>
        </Reveal>
        <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-3">
          {CARDS.map((c, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <FlipCard front={c.front} back={c.back} className="h-56 w-full" />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Focus Sounds */}
      <section className="relative z-10 px-6 py-16">
        <Reveal className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-3 text-xs uppercase tracking-widest text-white/40">Built-in focus music</p>
          <h2 className="text-4xl tracking-tight text-white sm:text-5xl" style={SERIF}>
            A soundtrack for <em className="not-italic text-white/55">deep work.</em>
          </h2>
          <p className="mt-4 text-white/60">
            Classical, electronic, binaural beats, 40 Hz gamma, white &amp; pink noise — generated
            live in your browser. Continuous, gapless, and completely ad-free. Press play.
          </p>
        </Reveal>
        <Reveal delay={0.1} className="mx-auto max-w-3xl">
          <FocusSounds variant="dark" />
        </Reveal>
      </section>

      {/* Full feature grid */}
      <section className="relative z-10 px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ALL_FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={(i % 4) * 0.06}>
                <TiltCard className="liquid-glass h-full rounded-3xl p-6">
                  <Icon className="mb-4 h-6 w-6 text-white" />
                  <h3 className="text-lg text-white" style={SERIF}>
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/55">{f.desc}</p>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 py-24 text-center">
        <Reveal>
          <Link
            to="/Dashboard"
            className="liquid-glass inline-flex items-center gap-2 rounded-full px-12 py-5 text-base text-white transition-transform hover:scale-[1.03]"
          >
            Try it now <ArrowUpRight className="h-5 w-5" />
          </Link>
        </Reveal>
      </section>
    </MarketingLayout>
  );
}
