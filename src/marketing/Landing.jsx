import React from 'react';
import { Link } from 'react-router-dom';
import {
  NotebookPen,
  Layers,
  Dumbbell,
  Timer,
  BarChart3,
  FileText,
  Sparkles,
  GraduationCap,
  ArrowUpRight,
} from 'lucide-react';
import MarketingLayout from './MarketingLayout';
import StudyKitDemo from './StudyKitDemo';
import { Reveal, AnimatedCounter, TiltCard, SERIF } from './MarketingBits';

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4';

const FEATURES = [
  { icon: NotebookPen, title: 'AI notes in LaTeX', desc: 'Beautifully structured notes with every formula in crisp LaTeX — read it, download the .tex.' },
  { icon: Layers, title: 'Flashcards', desc: 'High-yield decks generated for you, with spaced repetition that times your reviews.' },
  { icon: Dumbbell, title: 'Adaptive practice', desc: 'AP-style questions with instant feedback and explanations that adapt to you.' },
  { icon: FileText, title: 'FRQ & full tests', desc: 'Free-response simulators and full-length exams aligned to the College Board.' },
  { icon: Timer, title: 'Focus mode', desc: 'A built-in Pomodoro to keep you in deep work and your streak alive.' },
  { icon: BarChart3, title: 'Analytics', desc: 'See your strengths, weak spots, and mastery climb over time.' },
];

const SUBJECTS = [
  'Calculus BC', 'Physics C', 'Chemistry', 'Biology', 'US History', 'Statistics',
  'Computer Science A', 'Psychology', 'World History', 'Macroeconomics', 'English Lang',
  'Environmental Science', 'Precalculus', 'Human Geography', 'European History',
];

export default function Landing() {
  return (
    <MarketingLayout>
      {/* ---------------- HERO ---------------- */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
        <video
          className="absolute inset-0 z-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          poster=""
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
        <div className="video-scrim absolute inset-0 z-[1]" />

        <div className="relative z-10 flex flex-col items-center pt-28">
          <div className="animate-fade-rise liquid-glass mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs text-white/80">
            <Sparkles className="h-3.5 w-3.5" /> The AI study companion for every AP
          </div>

          <h1
            className="animate-fade-rise max-w-5xl text-5xl font-normal leading-[0.95] tracking-[-2px] text-white sm:text-7xl md:text-8xl"
            style={SERIF}
          >
            Where knowledge rises{' '}
            <em className="not-italic text-white/55">through the noise.</em>
          </h1>

          <p className="animate-fade-rise-delay mt-8 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
            Proofly turns a PDF, a lecture, or a YouTube video into AP-ready notes, flashcards, and
            practice — in seconds. Built for deep thinkers, bold creators, and quiet rebels who want
            to study with sharp focus.
          </p>

          <div className="animate-fade-rise-delay-2 mt-12 flex flex-col items-center gap-4 sm:flex-row">
            <Link
              to="/signin"
              className="liquid-glass flex items-center gap-2 rounded-full px-12 py-5 text-base text-white transition-transform hover:scale-[1.03]"
            >
              Start studying free <ArrowUpRight className="h-5 w-5" />
            </Link>
            <Link
              to="/features"
              className="rounded-full px-8 py-5 text-base text-white/70 transition-colors hover:text-white"
            >
              Explore features
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-xs text-white/40">
          Scroll to see it in action
        </div>
      </section>

      {/* ---------------- INTERACTIVE DEMO ---------------- */}
      <section className="relative z-10 px-6 py-24">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-4xl tracking-tight text-white sm:text-5xl" style={SERIF}>
            One upload. <em className="not-italic text-white/55">A whole study kit.</em>
          </h2>
          <p className="mt-4 text-white/60">
            Pick an input, watch what Proofly makes. This demo is interactive — try it.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <StudyKitDemo />
        </Reveal>
      </section>

      {/* ---------------- STATS ---------------- */}
      <section className="relative z-10 px-6 py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 md:grid-cols-4">
          {[
            { n: 25, s: '', label: 'AP subjects' },
            { n: 3, s: '', label: 'Outputs per upload' },
            { n: 30, s: 's', label: 'To a full study set' },
            { n: 100, s: '%', label: 'LaTeX-perfect math' },
          ].map((stat) => (
            <Reveal key={stat.label} className="text-center">
              <div className="text-5xl text-white sm:text-6xl" style={SERIF}>
                <AnimatedCounter to={stat.n} suffix={stat.s} />
              </div>
              <p className="mt-2 text-sm text-white/55">{stat.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- FEATURES ---------------- */}
      <section className="relative z-10 px-6 py-24">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-4xl tracking-tight text-white sm:text-5xl" style={SERIF}>
            Everything you need to <em className="not-italic text-white/55">actually learn.</em>
          </h2>
        </Reveal>
        <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={(i % 3) * 0.08}>
                <TiltCard className="liquid-glass h-full rounded-3xl p-7">
                  <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl text-white" style={SERIF}>
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{f.desc}</p>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ---------------- SUBJECT MARQUEE ---------------- */}
      <section className="relative z-10 overflow-hidden py-12">
        <Reveal className="mb-8 text-center">
          <p className="text-xs uppercase tracking-widest text-white/40">All 25 AP subjects, ready to go</p>
        </Reveal>
        <div className="relative flex select-none overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
          <div className="flex animate-marquee gap-4 pr-4">
            {[...SUBJECTS, ...SUBJECTS].map((s, i) => (
              <span
                key={i}
                className="liquid-glass flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm text-white/80"
              >
                <GraduationCap className="h-4 w-4 text-white/50" /> {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- FINAL CTA ---------------- */}
      <section className="relative z-10 px-6 py-28">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="text-5xl leading-[1] tracking-tight text-white sm:text-7xl" style={SERIF}>
            Study with <em className="not-italic text-white/55">Proofly.</em>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-white/65">
            Your next study session is one upload away. No clutter, no chaos — just you, your
            material, and a kit built to make it stick.
          </p>
          <Link
            to="/signin"
            className="liquid-glass mt-10 inline-flex items-center gap-2 rounded-full px-12 py-5 text-base text-white transition-transform hover:scale-[1.03]"
          >
            Begin your journey <ArrowUpRight className="h-5 w-5" />
          </Link>
        </Reveal>
      </section>
    </MarketingLayout>
  );
}
