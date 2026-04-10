import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingCTA({ theme }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} style={{ padding: '80px 24px', background: theme.bgSecondary }}>
      <div style={{
        maxWidth: 700, margin: '0 auto', textAlign: 'center',
        background: theme.bgCard, border: `1px solid ${theme.border}`,
        borderRadius: 24, padding: '56px 48px', boxShadow: theme.shadow,
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'all 700ms ease',
      }}>
        <h2 style={{ fontSize: 34, fontWeight: 700, color: theme.text, marginBottom: 12, letterSpacing: '-0.02em' }}>
          Start studying smarter today
        </h2>
        <p style={{ fontSize: 16, color: theme.textMuted, marginBottom: 32 }}>
          No credit card required. Free forever for students.
        </p>
        <button
          onClick={() => navigate('/Dashboard')}
          style={{
            background: theme.accent, color: '#fff', border: 'none',
            borderRadius: 12, padding: '14px 32px', fontSize: 16, fontWeight: 600,
            cursor: 'pointer', transition: 'all 200ms',
          }}
          onMouseEnter={e => { e.target.style.transform = 'scale(1.04)'; e.target.style.opacity = '0.92'; }}
          onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.opacity = '1'; }}
        >
          Create Free Account
        </button>
        <p style={{ fontSize: 13, color: theme.textMuted, marginTop: 16 }}>
          Join 1,000+ students already improving their scores
        </p>
      </div>
    </section>
  );
}