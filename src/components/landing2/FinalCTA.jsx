import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function FinalCTA() {
  return (
    <section style={{
      padding: '9rem 2rem',
      background: '#0B0D0E',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      position: 'relative',
      overflow: 'hidden',
      textAlign: 'center',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: '600px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(123,174,127,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.7 }}
        style={{ position: 'relative', maxWidth: '700px', margin: '0 auto' }}
      >
        <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#7BAE7F', marginBottom: '1.75rem' }}>
          Start today
        </p>
        <h2 style={{
          fontSize: 'clamp(2.5rem, 6vw, 5rem)',
          fontWeight: 800, color: '#F5F5F2',
          letterSpacing: '-0.045em', lineHeight: 1.0,
          marginBottom: '1.5rem',
        }}>
          Master exams<br />
          <span style={{ color: '#7BAE7F' }}>intentionally.</span>
        </h2>
        <p style={{ fontSize: '1.1rem', color: '#7D8580', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '480px', margin: '0 auto 2.5rem' }}>
          Join students using Proofly to study smarter, track mastery, and walk into exams with confidence.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => base44.auth.redirectToLogin()}
            style={{
              padding: '0.875rem 2.25rem', fontSize: '1rem', fontWeight: 700,
              color: '#0B0D0E', background: '#7BAE7F',
              border: 'none', cursor: 'pointer', borderRadius: '12px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#8BC58F'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(123,174,127,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#7BAE7F'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            Start Free — No credit card
          </button>
        </div>

        <p style={{ marginTop: '1.5rem', fontSize: '0.78rem', color: '#3A3A3A' }}>
          Free to start · AP, SAT, ACT supported
        </p>
      </motion.div>
    </section>
  );
}