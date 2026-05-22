import React from 'react';
import { motion } from 'framer-motion';

const PRINCIPLES = [
  {
    number: '01',
    title: 'Deep focus, not feature overload.',
    body: 'Proofly is designed around one mission: helping you master exam content. Every feature exists to serve that goal. Nothing else.',
  },
  {
    number: '02',
    title: 'Systems over sessions.',
    body: "One late-night cram doesn't build mastery. Proofly creates a system — structured notes, recurring recall, tracked progress — that compounds over time.",
  },
  {
    number: '03',
    title: 'Stop collecting. Start mastering.',
    body: 'Most students accumulate resources: PDFs, videos, Quizlet decks. Proofly collapses the whole stack into one disciplined workflow.',
  },
];

export default function BuiltForPerformers() {
  return (
    <section style={{ padding: '7rem 2rem', background: '#0B0D0E', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ maxWidth: '640px', marginBottom: '4.5rem' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#7BAE7F', marginBottom: '1rem' }}>
            Philosophy
          </p>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', fontWeight: 700, color: '#F5F5F2', letterSpacing: '-0.035em', lineHeight: 1.08, marginBottom: '1.25rem' }}>
            Built for students who actually want 5s.
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#7D8580', lineHeight: 1.7 }}>
            We didn't build another notes app. We built a performance system for serious students who want to compete at the highest academic level.
          </p>
        </motion.div>

        {/* Principles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}
          className="grid-cols-1 md:grid-cols-3">
          {PRINCIPLES.map((p, i) => (
            <motion.div
              key={p.number}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              style={{
                padding: '1.75rem', borderRadius: '14px',
                background: '#131617', border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: '#2A2E2C', letterSpacing: '0.05em', display: 'block', marginBottom: '1.25rem' }}>
                {p.number}
              </span>
              <h3 style={{ fontSize: '1rem', fontWeight: 650, color: '#F5F5F2', letterSpacing: '-0.015em', lineHeight: 1.3, marginBottom: '0.75rem' }}>
                {p.title}
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#7D8580', lineHeight: 1.75, margin: 0 }}>
                {p.body}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Big quote */}
        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
          style={{ marginTop: '5rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '4rem' }}
        >
          <p style={{ fontSize: 'clamp(1.25rem, 3vw, 2rem)', fontWeight: 600, color: '#F5F5F2', letterSpacing: '-0.025em', lineHeight: 1.4, maxWidth: '700px', margin: '0 auto' }}>
            "The students who get 5s don't study more. They study{' '}
            <em style={{ color: '#7BAE7F', fontStyle: 'italic' }}>better</em>."
          </p>
        </motion.div>
      </div>
    </section>
  );
}