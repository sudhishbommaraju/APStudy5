import React, { useState } from 'react';
import { motion } from 'framer-motion';

const SYSTEMS = [
  {
    id: 'learn',
    label: '01 — Learn',
    title: 'Rich notes that actually teach.',
    body: 'Proofly transforms any content into structured, textbook-quality notes with rendered equations, embedded diagrams, worked examples, and AP exam traps.',
    bullets: ['Rendered LaTeX equations', 'Collapsible sections', 'Embedded diagrams', 'AP trap callouts'],
    visual: <LearnVisual />,
  },
  {
    id: 'recall',
    label: '02 — Recall',
    title: 'Retain more with active recall.',
    body: 'Go beyond passive rereading. Proofly uses spaced repetition and active recall to move knowledge into long-term memory.',
    bullets: ['Smart flashcard decks', 'Spaced repetition engine', 'Active recall sessions', 'Recall analytics'],
    visual: <RecallVisual />,
  },
  {
    id: 'practice',
    label: '03 — Practice',
    title: 'AP-style questions, on demand.',
    body: 'Generate rigorous AP-style multiple choice and free response questions from your notes. Adaptive difficulty based on your performance.',
    bullets: ['AP-style MCQ + FRQ', 'Timed exam mode', 'Adaptive difficulty', 'Detailed explanations'],
    visual: <PracticeVisual />,
  },
  {
    id: 'analyze',
    label: '04 — Analyze',
    title: 'Know exactly where you stand.',
    body: 'Proofly tracks mastery across every unit and skill, surfacing weak points before they cost you on exam day.',
    bullets: ['Per-unit mastery scores', 'Weak point detection', 'Study streaks', 'Score projections'],
    visual: <AnalyzeVisual />,
  },
];

function LearnVisual() {
  return (
    <div style={{ background: '#1D2124', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1.25rem', height: '280px', overflow: 'hidden' }}>
      <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#7BAE7F', marginBottom: '0.875rem' }}>Newton's Laws of Motion</p>
      {['Understanding inertia as a property of mass, not a force.', 'The net force on an object equals mass times acceleration.'].map((line, i) => (
        <p key={i} style={{ fontSize: '0.78rem', color: '#9A9E9B', lineHeight: 1.7, marginBottom: '0.4rem' }}>{line}</p>
      ))}
      <div style={{ margin: '0.875rem 0', padding: '0.625rem', borderRadius: '8px', background: 'rgba(123,174,127,0.07)', border: '1px solid rgba(123,174,127,0.15)', textAlign: 'center' }}>
        <p style={{ fontStyle: 'italic', color: '#A8CCA8', fontSize: '0.875rem', margin: 0 }}>ΣF = ma</p>
      </div>
      <div style={{ padding: '0.5rem 0.75rem', borderRadius: '7px', background: 'rgba(192,83,74,0.06)', border: '1px solid rgba(192,83,74,0.18)' }}>
        <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#C0534A', marginBottom: '0.3rem' }}>AP Trap</p>
        <p style={{ fontSize: '0.72rem', color: '#D4A09A', margin: 0 }}>Confusing "equal and opposite" with canceling — they act on different objects.</p>
      </div>
    </div>
  );
}

function RecallVisual() {
  return (
    <div style={{ background: '#1D2124', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1.25rem', height: '280px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#7BAE7F', margin: 0 }}>Flashcard Review</p>
        <span style={{ fontSize: '0.7rem', color: '#555' }}>Card 3 / 24</span>
      </div>
      <div style={{ background: '#131617', borderRadius: '10px', padding: '1.25rem', textAlign: 'center', marginBottom: '0.875rem', border: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ fontSize: '0.72rem', color: '#555', marginBottom: '0.5rem' }}>What is Newton's Second Law?</p>
        <p style={{ fontSize: '0.875rem', color: '#C9C9C9', fontStyle: 'italic', margin: 0 }}>F = ma</p>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {['Again', 'Hard', 'Good', 'Easy'].map((label, i) => (
          <div key={i} style={{ flex: 1, padding: '0.35rem', borderRadius: '7px', background: '#181C1F', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.65rem', color: '#666', margin: 0 }}>{label}</p>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '1rem', height: '4px', borderRadius: '2px', background: '#1A1A1A', overflow: 'hidden' }}>
        <div style={{ width: '42%', height: '100%', background: '#7BAE7F', borderRadius: '2px' }} />
      </div>
    </div>
  );
}

function PracticeVisual() {
  return (
    <div style={{ background: '#1D2124', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1.25rem', height: '280px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
        <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#7BAE7F', margin: 0 }}>AP Practice</p>
        <span style={{ fontSize: '0.7rem', color: '#555' }}>Q 2 / 10</span>
      </div>
      <p style={{ fontSize: '0.8rem', color: '#C9C9C9', lineHeight: 1.65, marginBottom: '0.875rem' }}>
        A 5 kg block is pushed with a force of 20 N. What is the acceleration?
      </p>
      {['A. 4 m/s²', 'B. 2 m/s²', 'C. 100 m/s²', 'D. 0.25 m/s²'].map((opt, i) => (
        <div key={i} style={{
          padding: '0.45rem 0.75rem', borderRadius: '7px', marginBottom: '0.3rem',
          background: i === 0 ? 'rgba(123,174,127,0.1)' : 'transparent',
          border: `1px solid ${i === 0 ? 'rgba(123,174,127,0.3)' : 'rgba(255,255,255,0.05)'}`,
          cursor: 'pointer',
        }}>
          <p style={{ fontSize: '0.78rem', color: i === 0 ? '#7BAE7F' : '#666', margin: 0 }}>{opt}</p>
        </div>
      ))}
    </div>
  );
}

function AnalyzeVisual() {
  const skills = [
    { name: 'Newton\'s Laws', pct: 88 },
    { name: 'Energy & Work', pct: 64 },
    { name: 'Momentum', pct: 41 },
    { name: 'Waves', pct: 72 },
  ];
  return (
    <div style={{ background: '#1D2124', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1.25rem', height: '280px', overflow: 'hidden' }}>
      <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#7BAE7F', marginBottom: '1rem' }}>Skill Mastery</p>
      {skills.map(({ name, pct }) => (
        <div key={name} style={{ marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#888' }}>{name}</span>
            <span style={{ fontSize: '0.72rem', color: pct >= 70 ? '#7BAE7F' : pct >= 50 ? '#C9A05A' : '#C0534A', fontWeight: 600 }}>{pct}%</span>
          </div>
          <div style={{ height: '4px', borderRadius: '2px', background: '#1A1A1A', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', borderRadius: '2px', background: pct >= 70 ? '#7BAE7F' : pct >= 50 ? '#C9A05A' : '#C0534A' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CoreSystems() {
  const [active, setActive] = useState(0);
  const sys = SYSTEMS[active];

  return (
    <section id="features" style={{ padding: '7rem 2rem', background: '#0B0D0E', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          style={{ marginBottom: '3.5rem' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#7BAE7F', marginBottom: '0.875rem' }}>Core Systems</p>
          <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', fontWeight: 700, color: '#F5F5F2', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Four systems. One mastery loop.
          </h2>
        </motion.div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0' }}
          className="overflow-x-auto">
          {SYSTEMS.map((s, i) => (
            <button key={s.id} onClick={() => setActive(i)} style={{
              padding: '0.625rem 1.25rem', fontSize: '0.8rem', fontWeight: 500,
              color: active === i ? '#7BAE7F' : '#555',
              background: 'transparent', border: 'none', cursor: 'pointer',
              borderBottom: active === i ? '2px solid #7BAE7F' : '2px solid transparent',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
              marginBottom: '-1px',
            }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}
          className="grid-cols-1 md:grid-cols-2"
        >
          <div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#F5F5F2', letterSpacing: '-0.025em', marginBottom: '1rem', lineHeight: 1.2 }}>
              {sys.title}
            </h3>
            <p style={{ fontSize: '1rem', color: '#B7BCB9', lineHeight: 1.75, marginBottom: '1.5rem' }}>{sys.body}</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {sys.bullets.map(b => (
                <li key={b} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(123,174,127,0.15)', border: '1px solid rgba(123,174,127,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '8px', color: '#7BAE7F' }}>✓</span>
                  </span>
                  <span style={{ fontSize: '0.875rem', color: '#9A9E9B' }}>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>{sys.visual}</div>
        </motion.div>
      </div>
    </section>
  );
}