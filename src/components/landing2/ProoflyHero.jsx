import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';

const TRUST_TAGS = ['AP Exams', 'SAT / ACT', 'STEM Courses', 'College Classes'];

// ── Animated product visual ───────────────────────────────────────────────────
function ProductVisual() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % 3), 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '520px' }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: '400px', height: '300px',
        background: 'radial-gradient(ellipse, rgba(123,174,127,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Step 0 — Input */}
      {step === 0 && (
        <motion.div
          key="input"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.5 }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <InputCards />
        </motion.div>
      )}

      {/* Step 1 — Processing */}
      {step === 1 && (
        <motion.div
          key="process"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.5 }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <ProcessingCards />
        </motion.div>
      )}

      {/* Step 2 — Workspace */}
      {step === 2 && (
        <motion.div
          key="workspace"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.5 }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <WorkspaceCards />
        </motion.div>
      )}

      {/* Step indicator */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: '0.5rem',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: i === step ? '20px' : '6px', height: '4px', borderRadius: '2px',
            background: i === step ? '#7BAE7F' : 'rgba(255,255,255,0.15)',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: '#1D2124',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      padding: '1rem 1.25rem',
      backdropFilter: 'blur(8px)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function InputCards() {
  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
        style={{ position: 'absolute', top: '20px', left: '0' }}>
        <Card>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#7BAE7F', marginBottom: '0.5rem' }}>PDF Upload</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '32px', height: '40px', borderRadius: '5px', background: '#C0534A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.55rem', fontWeight: 700, color: 'white' }}>PDF</span>
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: '#E0E0E0', margin: 0 }}>AP_Physics_Chapter5.pdf</p>
              <p style={{ fontSize: '0.7rem', color: '#555', margin: 0 }}>48 pages · 2.4 MB</p>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        style={{ position: 'absolute', top: '130px', right: '10px' }}>
        <Card>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#7BAE7F', marginBottom: '0.5rem' }}>YouTube Lecture</p>
          <div style={{ width: '220px', height: '60px', borderRadius: '8px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #222' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#C0534A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '10px', color: 'white', marginLeft: '2px' }}>▶</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: '#666', marginLeft: '0.6rem' }}>Khan Academy — Newton's Laws</p>
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
        style={{ position: 'absolute', bottom: '60px', left: '20px' }}>
        <Card>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#7BAE7F', marginBottom: '0.5rem' }}>AP Subject</p>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['AP Physics 1', 'AP Calc AB', 'AP Bio'].map(s => (
              <span key={s} style={{ padding: '0.2rem 0.5rem', borderRadius: '5px', background: '#222', border: '1px solid #333', fontSize: '0.7rem', color: '#999' }}>{s}</span>
            ))}
          </div>
        </Card>
      </motion.div>

      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#444', textAlign: 'center' }}>Add your content</p>
      </div>
    </div>
  );
}

function ProcessingCards() {
  const items = ['Structuring notes…', 'Generating diagrams…', 'Building flashcards…', 'Creating practice questions…'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0' }}>
      <Card style={{ width: '320px', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'rgba(123,174,127,0.15)', border: '1px solid rgba(123,174,127,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #7BAE7F', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#E0E0E0', margin: 0 }}>Proofly is analyzing</p>
            <p style={{ fontSize: '0.72rem', color: '#555', margin: 0 }}>AP_Physics_Chapter5.pdf</p>
          </div>
        </div>
        {items.map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0', borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.3 }}
              style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7BAE7F', flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: '#888' }}>{item}</span>
          </motion.div>
        ))}
      </Card>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function WorkspaceCards() {
  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {/* Main notes card */}
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7BAE7F' }} />
            <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#7BAE7F', margin: 0 }}>Newton's Laws of Motion</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.07)', width: '90%' }} />
            <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', width: '75%' }} />
            <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.07)', width: '85%' }} />
          </div>
          <div style={{ marginTop: '0.875rem', padding: '0.625rem', borderRadius: '8px', background: 'rgba(123,174,127,0.07)', border: '1px solid rgba(123,174,127,0.15)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.78rem', color: '#A8CCA8', margin: 0, fontStyle: 'italic' }}>F = ma</p>
          </div>
        </Card>
      </motion.div>

      {/* Mastery bar */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
        style={{ position: 'absolute', bottom: '120px', right: 0 }}>
        <Card style={{ width: '180px' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#7BAE7F', marginBottom: '0.5rem' }}>Mastery</p>
          <div style={{ height: '6px', borderRadius: '3px', background: '#1A1A1A', overflow: 'hidden', marginBottom: '0.35rem' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: '72%' }} transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
              style={{ height: '100%', background: '#7BAE7F', borderRadius: '3px' }} />
          </div>
          <p style={{ fontSize: '0.7rem', color: '#666', margin: 0 }}>72% — Proficient</p>
        </Card>
      </motion.div>

      {/* Flashcard count */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
        style={{ position: 'absolute', bottom: '60px', left: 0 }}>
        <Card style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '1.5rem' }}>🃏</div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#E0E0E0', margin: 0 }}>24 flashcards</p>
            <p style={{ fontSize: '0.7rem', color: '#555', margin: 0 }}>8 due for review</p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
export default function ProoflyHero() {
  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      padding: '6rem 2rem 4rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background radial glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse 80% 60% at 70% 40%, rgba(123,174,127,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      {/* Grain overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.03\'/%3E%3C/svg%3E")',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}
        className="grid-cols-1 md:grid-cols-2">

        {/* Left — Copy */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.3rem 0.75rem', borderRadius: '100px',
            background: 'rgba(123,174,127,0.1)', border: '1px solid rgba(123,174,127,0.2)',
            marginBottom: '1.75rem',
          }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#7BAE7F' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#7BAE7F', letterSpacing: '0.05em' }}>
              Built for serious students
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)',
            fontWeight: 800,
            color: '#F5F5F2',
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
            marginBottom: '1.5rem',
          }}>
            Study like<br />
            <span style={{ color: '#7BAE7F' }}>the top 1%.</span>
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: '1.1rem',
            color: '#B7BCB9',
            lineHeight: 1.7,
            marginBottom: '2.25rem',
            maxWidth: '480px',
          }}>
            Turn PDFs, YouTube lectures, and class notes into structured study systems with AI-powered recall, practice, and mastery tracking.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => base44.auth.redirectToLogin()}
              style={{
                padding: '0.75rem 1.75rem', fontSize: '0.9375rem', fontWeight: 700,
                color: '#0B0D0E', background: '#7BAE7F', border: 'none', cursor: 'pointer',
                borderRadius: '10px', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#8BC58F'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#7BAE7F'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Start Free →
            </button>
            <button
              style={{
                padding: '0.75rem 1.5rem', fontSize: '0.9375rem', fontWeight: 500,
                color: '#8A8A8A', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                borderRadius: '10px', transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#F5F5F2'}
              onMouseLeave={e => e.currentTarget.style.color = '#8A8A8A'}
            >
              Watch Demo
            </button>
          </div>

          {/* Trust tags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {TRUST_TAGS.map(tag => (
              <span key={tag} style={{
                padding: '0.25rem 0.625rem', borderRadius: '6px',
                fontSize: '0.72rem', fontWeight: 500, color: '#7D8580',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              }}>
                {tag}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Right — Product visual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <ProductVisual />
        </motion.div>
      </div>
    </section>
  );
}