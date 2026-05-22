import React from 'react';
import { motion } from 'framer-motion';

const SECTIONS = [
  {
    number: '01',
    title: "Newton's First Law",
    content: [
      { type: 'para', text: 'An object at rest remains at rest, and an object in motion remains in motion at constant velocity, unless acted upon by a net external force. This property of matter is called **inertia**.' },
      { type: 'para', text: 'The magnitude of inertia is directly proportional to mass. A more massive object requires a greater force to change its motion.' },
    ],
  },
  {
    number: '02',
    title: "Newton's Second Law",
    content: [
      { type: 'para', text: 'The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass.' },
      { type: 'formula', text: 'ΣF = ma' },
      { type: 'trap', text: "Students often confuse 'net force' with individual forces. Always sum all forces before applying F = ma." },
      { type: 'example', text: 'A 10 kg box is pushed with 50 N east and 20 N west. Net force = 30 N east. Acceleration = 3 m/s² east.' },
    ],
  },
  {
    number: '03',
    title: "Newton's Third Law",
    content: [
      { type: 'para', text: 'For every action there is an equal and opposite reaction. These forces always act on **different objects** and never cancel each other.' },
      { type: 'trap', text: "The biggest AP trap: Newton's 3rd law pairs act on different objects — they never cancel, even though they're equal and opposite." },
    ],
  },
];

const KEY_TERMS = [
  { term: 'Inertia', def: 'Resistance to change in motion, proportional to mass.' },
  { term: 'Net Force (ΣF)', def: 'The vector sum of all forces acting on an object.' },
  { term: 'Normal Force', def: 'Perpendicular contact force from a surface.' },
];

function RenderContent({ item }) {
  if (item.type === 'para') {
    const parts = item.text.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p style={{ fontSize: '0.9375rem', color: '#B7BCB9', lineHeight: 1.8, margin: '0 0 0.75rem 0' }}>
        {parts.map((p, i) =>
          p.startsWith('**') ? <strong key={i} style={{ color: '#E8E5E0', fontWeight: 600 }}>{p.slice(2, -2)}</strong> : p
        )}
      </p>
    );
  }
  if (item.type === 'formula') {
    return (
      <div style={{ margin: '1rem 0', borderRadius: '10px', border: '1px solid rgba(123,174,127,0.18)', overflow: 'hidden' }}>
        <div style={{ padding: '0.3rem 1rem', background: 'rgba(123,174,127,0.07)', borderBottom: '1px solid rgba(123,174,127,0.1)' }}>
          <span style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#7BAE7F' }}>Formula</span>
        </div>
        <div style={{ padding: '1rem', background: '#0E1210', textAlign: 'center' }}>
          <span style={{ fontSize: '1.25rem', color: '#D0C9B8', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>{item.text}</span>
        </div>
      </div>
    );
  }
  if (item.type === 'trap') {
    return (
      <div style={{ margin: '1rem 0', borderRadius: '8px', border: '1px solid rgba(192,83,74,0.2)', background: 'rgba(192,83,74,0.04)', padding: '0.75rem 1rem' }}>
        <p style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#C0534A', marginBottom: '0.3rem' }}>⚠ AP Trap</p>
        <p style={{ fontSize: '0.875rem', color: '#D4A09A', lineHeight: 1.65, margin: 0 }}>{item.text}</p>
      </div>
    );
  }
  if (item.type === 'example') {
    return (
      <div style={{ margin: '1rem 0', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem' }}>
        <p style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#666', marginBottom: '0.3rem' }}>In Action</p>
        <p style={{ fontSize: '0.875rem', color: '#AEAAA5', lineHeight: 1.65, margin: 0 }}>{item.text}</p>
      </div>
    );
  }
  return null;
}

export default function NotesShowcase() {
  return (
    <section id="notes" style={{ padding: '7rem 2rem', background: '#131617', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ marginBottom: '3.5rem' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#7BAE7F', marginBottom: '0.875rem' }}>Premium Notes</p>
          <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', fontWeight: 700, color: '#F5F5F2', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '1rem' }}>
            Notes that actually teach.
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#7D8580', maxWidth: '540px', lineHeight: 1.7 }}>
            Not markdown dumps. Structured, typographically rich study documents with embedded equations, AP exam traps, and worked examples.
          </p>
        </motion.div>

        {/* Document preview */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          style={{
            background: '#1C1C1C',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          }}
        >
          {/* Chrome bar */}
          <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#181C1F' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#333' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#333' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#333' }} />
            <span style={{ marginLeft: '0.75rem', fontSize: '0.7rem', color: '#444' }}>AP Physics 1 — Unit 3: Newton's Laws</span>
          </div>

          {/* Two-col: nav + content */}
          <div style={{ display: 'flex' }}>
            {/* Left nav rail */}
            <div style={{ width: '180px', flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem 0' }}
              className="hidden md:block">
              <p style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#333', padding: '0 1rem', marginBottom: '0.75rem' }}>Contents</p>
              {SECTIONS.map((sec, i) => (
                <div key={i} style={{
                  padding: '0.35rem 1rem',
                  fontSize: '0.72rem', color: i === 1 ? '#7BAE7F' : '#444',
                  borderLeft: i === 1 ? '2px solid #7BAE7F' : '2px solid transparent',
                }}>
                  {sec.title}
                </div>
              ))}
              <div style={{ marginTop: '1.5rem', padding: '0.35rem 1rem', fontSize: '0.72rem', color: '#333', borderLeft: '2px solid transparent' }}>
                Key Terms
              </div>
            </div>

            {/* Content column */}
            <div style={{ flex: 1, padding: '2rem 2.5rem', maxHeight: '600px', overflowY: 'auto' }}>
              {/* Subject badge */}
              <div style={{ marginBottom: '1.75rem' }}>
                <span style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#7BAE7F' }}>AP Physics 1 · Unit 3</span>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#F4F4F2', letterSpacing: '-0.025em', lineHeight: 1.1, marginTop: '0.5rem', marginBottom: '0' }}>
                  Newton's Laws of Motion
                </h1>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#444' }}>8 min read</span>
                  <span style={{ fontSize: '0.72rem', color: '#7BAE7F' }}>72% mastery</span>
                </div>
              </div>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', marginBottom: '1.75rem' }} />

              {SECTIONS.map((sec, i) => (
                <div key={i} style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1.25rem', paddingTop: i > 0 ? '1.5rem' : 0, borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#2A2E2C', userSelect: 'none', width: '1.5rem', flexShrink: 0 }}>{sec.number}</span>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 650, color: '#F4F4F2', letterSpacing: '-0.015em', margin: 0 }}>{sec.title}</h2>
                  </div>
                  <div style={{ paddingLeft: '2.25rem' }}>
                    {sec.content.map((item, j) => <RenderContent key={j} item={item} />)}
                  </div>
                </div>
              ))}

              {/* Key terms */}
              <div style={{ paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#2A2E2C', userSelect: 'none', width: '1.5rem' }}>KT</span>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 650, color: '#F4F4F2', margin: 0 }}>Key Terms</h2>
                </div>
                <div style={{ paddingLeft: '2.25rem' }}>
                  {KEY_TERMS.map(({ term, def }) => (
                    <div key={term} style={{ display: 'flex', gap: '1.5rem', padding: '0.625rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <p style={{ width: '150px', flexShrink: 0, fontSize: '0.8rem', fontWeight: 600, color: '#7BAE7F', margin: 0 }}>{term}</p>
                      <p style={{ fontSize: '0.8rem', color: '#777', lineHeight: 1.65, margin: 0, flex: 1 }}>{def}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}