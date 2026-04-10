import React, { useEffect, useRef, useState } from 'react';
import { Search, Zap, TrendingUp } from 'lucide-react';

const STEPS = [
  { num: '01', icon: Search, title: 'AI Analyzes Weaknesses', desc: 'Answer a short diagnostic. Our AI identifies exactly where your knowledge gaps are.' },
  { num: '02', icon: Zap, title: 'Generates Personalized Practice', desc: 'Adaptive questions and study materials targeted at your specific weak areas.' },
  { num: '03', icon: TrendingUp, title: 'Tracks Mastery Over Time', desc: 'Visual progress tracking shows your improvement with every session.' },
];

export default function HowItWorks({ theme }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="how-it-works" ref={ref} style={{ padding: '80px 24px', background: theme.bgSecondary }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: theme.text, textAlign: 'center', marginBottom: 8, letterSpacing: '-0.02em' }}>
          How it works
        </h2>
        <p style={{ color: theme.textMuted, textAlign: 'center', marginBottom: 64, fontSize: 16 }}>
          Three steps to measurable improvement
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, position: 'relative' }} className="steps-grid">
          {/* Connector line */}
          <div style={{
            position: 'absolute', top: 32, left: '16.5%', right: '16.5%', height: 2,
            background: `linear-gradient(90deg, ${theme.accent}, ${theme.isDark ? '#1f2937' : '#e2e8f0'})`,
            opacity: visible ? 1 : 0, transition: 'opacity 800ms ease 400ms',
          }} className="connector-line" />

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} style={{
                textAlign: 'center', padding: '0 32px',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(24px)',
                transition: `all 600ms ease ${i * 120}ms`,
              }}>
                {/* Icon circle */}
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: theme.bgCard,
                  border: `2px solid ${theme.accent}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 24px',
                  boxShadow: `0 0 0 6px ${theme.isDark ? 'rgba(59,130,246,0.08)' : 'rgba(37,99,235,0.06)'}`,
                  position: 'relative', zIndex: 1,
                }}>
                  <Icon size={24} color={theme.accent} />
                </div>

                <div style={{ fontSize: 11, fontWeight: 700, color: theme.accent, letterSpacing: '0.1em', marginBottom: 8 }}>
                  STEP {step.num}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 600, color: theme.text, marginBottom: 10 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: theme.textMuted, lineHeight: 1.7, margin: 0 }}>{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        @media(max-width:768px){ .steps-grid { grid-template-columns: 1fr !important; } .connector-line { display: none; } }
      `}</style>
    </section>
  );
}