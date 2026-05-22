import React from 'react';
import { motion } from 'framer-motion';

const CHAOS_ITEMS = [
  { icon: '📄', label: 'AP Bio PDF', sub: '156 pages unread' },
  { icon: '🎬', label: 'Khan Academy Tab', sub: 'Paused at 12:04' },
  { icon: '📝', label: 'Scattered notes', sub: '3 Google Docs open' },
  { icon: '🗂️', label: 'Quizlet deck', sub: '400 cards, no system' },
  { icon: '⏰', label: 'Exam in 12 days', sub: 'No plan' },
];

const MASTERY_ITEMS = [
  { icon: '📖', color: '#7BAE7F', label: 'Structured notes', sub: 'AI-organized by unit' },
  { icon: '🃏', color: '#7BAE7F', label: 'Smart flashcards', sub: 'Spaced repetition' },
  { icon: '🎯', color: '#7BAE7F', label: 'AP practice', sub: 'Adaptive difficulty' },
  { icon: '📊', color: '#7BAE7F', label: 'Mastery tracking', sub: '72% — on track' },
];

export default function ChaosToMastery() {
  return (
    <section style={{ padding: '7rem 2rem', background: '#0B0D0E' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '4rem' }}
        >
          <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#7BAE7F', marginBottom: '1rem' }}>
            The Problem
          </p>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', fontWeight: 700, color: '#F5F5F2', letterSpacing: '-0.03em', marginBottom: '1rem', lineHeight: 1.1 }}>
            Stop studying reactively.
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#7D8580', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
            Proofly unifies your entire study workflow into one focused learning system.
          </p>
        </motion.div>

        {/* Two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}
          className="grid-cols-1 md:grid-cols-2">

          {/* Left — Chaos */}
          <motion.div
            initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C0534A' }} />
              <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#C0534A', margin: 0 }}>Before</p>
            </div>
            <div style={{
              background: '#131617', border: '1px solid rgba(192,83,74,0.15)', borderRadius: '14px', overflow: 'hidden',
            }}>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '0.35rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#C0534A' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#C9A05A' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#333' }} />
                <span style={{ fontSize: '0.65rem', color: '#444', marginLeft: '0.25rem' }}>Browser — 24 tabs open</span>
              </div>
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {CHAOS_ITEMS.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.625rem 0.875rem', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                    <div>
                      <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>{item.label}</p>
                      <p style={{ fontSize: '0.68rem', color: '#444', margin: 0 }}>{item.sub}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right — Mastery */}
          <motion.div
            initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7BAE7F' }} />
              <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#7BAE7F', margin: 0 }}>After Proofly</p>
            </div>
            <div style={{
              background: '#131617', border: '1px solid rgba(123,174,127,0.18)', borderRadius: '14px', overflow: 'hidden',
            }}>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#7BAE7F' }} />
                <span style={{ fontSize: '0.65rem', color: '#666', marginLeft: '0.25rem' }}>Proofly — Study workspace</span>
              </div>
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {MASTERY_ITEMS.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.08 + 0.2 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.625rem 0.875rem', borderRadius: '8px',
                      background: 'rgba(123,174,127,0.04)', border: '1px solid rgba(123,174,127,0.12)',
                    }}
                  >
                    <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                    <div>
                      <p style={{ fontSize: '0.8rem', color: '#C9C9C9', margin: 0, fontWeight: 500 }}>{item.label}</p>
                      <p style={{ fontSize: '0.68rem', color: '#7BAE7F', margin: 0 }}>{item.sub}</p>
                    </div>
                  </motion.div>
                ))}
                {/* Mastery bar */}
                <div style={{ padding: '0.875rem', borderRadius: '8px', background: 'rgba(123,174,127,0.06)', border: '1px solid rgba(123,174,127,0.1)', marginTop: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.72rem', color: '#888' }}>AP Physics 1 — Unit 3</span>
                    <span style={{ fontSize: '0.72rem', color: '#7BAE7F', fontWeight: 600 }}>72%</span>
                  </div>
                  <div style={{ height: '4px', borderRadius: '2px', background: '#1A1A1A', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} whileInView={{ width: '72%' }} viewport={{ once: true }}
                      transition={{ delay: 0.6, duration: 1.2, ease: 'easeOut' }}
                      style={{ height: '100%', background: '#7BAE7F', borderRadius: '2px' }} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}