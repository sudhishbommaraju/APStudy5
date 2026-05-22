import React from 'react';
import { motion } from 'framer-motion';

const STATS = [
  { value: '2,900+', label: 'Study sessions completed' },
  { value: '18 AP', label: 'Subjects supported' },
  { value: '4.8×', label: 'Longer information retention with active recall' },
  { value: '100%', label: 'Focused on exam mastery' },
];

const TESTIMONIALS = [
  {
    quote: "I went from a 3 to a 5 on AP Physics. The structured notes and daily recall sessions completely changed how I studied.",
    name: "Maya K.",
    tag: "AP Physics 1 · Score: 5",
  },
  {
    quote: "Proofly is the only tool that actually connects my notes to my practice. I can see exactly where my gaps are.",
    name: "David L.",
    tag: "AP Calc AB · Score: 5",
  },
  {
    quote: "I uploaded my lecture PDFs and had a full structured study system in minutes. Saved me 10+ hours of note-taking.",
    name: "Sophia R.",
    tag: "AP Biology · Score: 4",
  },
];

export default function SocialProof() {
  return (
    <section style={{ padding: '7rem 2rem', background: '#131617', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.05)', borderRadius: '14px', overflow: 'hidden', marginBottom: '5rem' }}
          className="grid-cols-2 md:grid-cols-4"
        >
          {STATS.map(({ value, label }, i) => (
            <div key={i} style={{ padding: '2rem 1.5rem', background: '#131617', textAlign: 'center' }}>
              <p style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 700, color: '#F5F5F2', letterSpacing: '-0.04em', margin: 0, marginBottom: '0.375rem' }}>
                {value}
              </p>
              <p style={{ fontSize: '0.78rem', color: '#7D8580', margin: 0, lineHeight: 1.5 }}>{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#7BAE7F' }}>
            Student Results
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}
          className="grid-cols-1 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              style={{
                padding: '1.75rem',
                background: '#1D2124',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '14px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}
            >
              {/* Stars */}
              <div style={{ display: 'flex', gap: '2px', marginBottom: '1rem' }}>
                {[...Array(5)].map((_, j) => (
                  <span key={j} style={{ color: '#7BAE7F', fontSize: '0.875rem' }}>★</span>
                ))}
              </div>
              <p style={{ fontSize: '0.9rem', color: '#B7BCB9', lineHeight: 1.7, marginBottom: '1.25rem', flex: 1 }}>
                "{t.quote}"
              </p>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#E8E5E0', margin: 0 }}>{t.name}</p>
                <p style={{ fontSize: '0.72rem', color: '#7BAE7F', margin: 0 }}>{t.tag}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}