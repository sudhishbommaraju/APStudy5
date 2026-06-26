import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Focus, Sparkles, HeartHandshake, ArrowUpRight } from 'lucide-react';
import MarketingLayout from './MarketingLayout';
import { Reveal, AnimatedCounter, TiltCard, SERIF } from './MarketingBits';

const VALUES = [
  { icon: Focus, title: 'Focus over noise', desc: 'Studying is hard enough. Our interfaces are calm, quiet, and free of clutter so your attention stays on the work.' },
  { icon: Sparkles, title: 'Substance over hype', desc: 'Accurate, curriculum-aligned material in real LaTeX, not flashy filler. If it is wrong, it does not ship.' },
  { icon: Compass, title: 'Guidance, not shortcuts', desc: 'Proofly helps you understand, not skip. Explanations, spaced repetition, and analytics build real mastery.' },
  { icon: HeartHandshake, title: 'For every student', desc: 'From the first AP to the fifth, Proofly meets you where you are and grows with you.' },
];

export default function About() {
  return (
    <MarketingLayout>
      {/* Hero statement */}
      <section className="relative px-6 pb-10 pt-40">
        <Reveal className="mx-auto max-w-4xl text-center">
          <p className="mb-4 text-xs uppercase tracking-widest text-white/40">About Proofly</p>
          <h1 className="text-5xl leading-[1.02] tracking-[-1.5px] text-white sm:text-7xl" style={SERIF}>
            We build digital spaces for <em className="not-italic text-white/55">sharp focus</em> and inspired work.
          </h1>
        </Reveal>
      </section>

      {/* Mission prose */}
      <section className="relative z-10 px-6 py-14">
        <Reveal className="mx-auto max-w-3xl">
          <p className="text-xl leading-relaxed text-white/75 sm:text-2xl" style={{ fontFamily: "'Inter', sans-serif" }}>
            Proofly started with my own story. As a teenager, I was playing a sport I loved while
            trying to keep up with hard classes. Practice ran late, the work piled up, and my grades
            tanked. It felt like I had to choose between the game and the classroom. Then I figured
            out how to actually study, the kind of focused, efficient studying that turns a mountain
            of material into something you can learn fast. My grades came back, and I realized other
            students needed the exact same thing.
          </p>
          <p className="mt-6 text-base leading-relaxed text-white/55">
            I built Proofly for students like me, especially student athletes who are stretched thin
            and still trying to stay on top of their AP classes and their grades. Drop in your
            material and Proofly hands back notes, flashcards, and practice that are accurate, clear,
            and ready in minutes. Less time drowning in pages, more time learning, so you can keep
            your grades up and still chase everything else you love.
          </p>
        </Reveal>
      </section>

      {/* Stats */}
      <section className="relative z-10 px-6 py-14">
        <div className="mx-auto grid max-w-4xl grid-cols-3 gap-8 text-center">
          {[
            { n: 25, s: '', label: 'AP subjects covered' },
            { n: 3, s: '', label: 'Study tools per upload' },
            { n: 100, s: '%', label: 'Math in real LaTeX' },
          ].map((s) => (
            <Reveal key={s.label}>
              <div className="text-5xl text-white sm:text-6xl" style={SERIF}>
                <AnimatedCounter to={s.n} suffix={s.s} />
              </div>
              <p className="mt-2 text-sm text-white/55">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="relative z-10 px-6 py-20">
        <Reveal className="mb-12 text-center">
          <h2 className="text-4xl tracking-tight text-white sm:text-5xl" style={SERIF}>
            What we <em className="not-italic text-white/55">believe.</em>
          </h2>
        </Reveal>
        <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2">
          {VALUES.map((v, i) => {
            const Icon = v.icon;
            return (
              <Reveal key={v.title} delay={(i % 2) * 0.08}>
                <TiltCard className="liquid-glass h-full rounded-3xl p-8">
                  <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl text-white" style={SERIF}>
                    {v.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{v.desc}</p>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 py-24 text-center">
        <Reveal>
          <h2 className="mx-auto max-w-2xl text-4xl tracking-tight text-white sm:text-5xl" style={SERIF}>
            Come build your <em className="not-italic text-white/55">focus.</em>
          </h2>
          <Link
            to="/Dashboard"
            className="liquid-glass mt-8 inline-flex items-center gap-2 rounded-full px-12 py-5 text-base text-white transition-transform hover:scale-[1.03]"
          >
            Start studying free <ArrowUpRight className="h-5 w-5" />
          </Link>
        </Reveal>
      </section>
    </MarketingLayout>
  );
}
