import React, { useEffect, useRef, useState } from 'react';

export default function AboutSection({ theme }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="about" ref={ref} style={{ padding: '80px 24px', background: theme.bgSecondary }}>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }} className="about-grid">
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 600ms ease' }}>
          <span style={{
            fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: theme.accent, marginBottom: 16, display: 'block',
          }}>Our Story</span>
          <h2 style={{ fontSize: 30, fontWeight: 700, color: theme.text, marginBottom: 20, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Why We Built Proofly
          </h2>
          <p style={{ fontSize: 15, color: theme.textMuted, lineHeight: 1.8, marginBottom: 16 }}>
            Students today jump between too many tools — YouTube, Quizlet, Khan Academy, random PDFs — with no unified system and no feedback loop. They study hard, but they don't know what's actually working.
          </p>
          <p style={{ fontSize: 15, color: theme.textMuted, lineHeight: 1.8 }}>
            Proofly was built to solve that problem: one intelligent platform that analyzes what you know, identifies exactly where you're weak, and generates targeted practice to close the gap — measurably.
          </p>
        </div>

        {/* Founder card */}
        <div style={{
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 600ms ease 150ms',
          background: theme.bgCard,
          border: `1px solid ${theme.border}`, borderRadius: 16, padding: 28,
          boxShadow: theme.shadow,
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>P</span>
            </div>
            <div>
              <p style={{ fontWeight: 600, color: theme.text, fontSize: 15, margin: 0 }}>Proofly Team</p>
              <p style={{ fontSize: 13, color: theme.textMuted, margin: 0 }}>Builders & Students</p>
            </div>
          </div>
          <p style={{ fontSize: 14, color: theme.textMuted, lineHeight: 1.7, fontStyle: 'italic', margin: 0 }}>
            "We built the platform we wish existed when we were studying. The goal is simple: make every hour of study count."
          </p>
          <div style={{ marginTop: 20, display: 'flex', gap: 20 }}>
            {[{ label: '1,000+', sub: 'Students' }, { label: '40+', sub: 'AP Subjects' }, { label: '+200pts', sub: 'Avg SAT Gain' }].map((s, i) => (
              <div key={i}>
                <p style={{ fontSize: 18, fontWeight: 700, color: theme.text, margin: 0 }}>{s.label}</p>
                <p style={{ fontSize: 12, color: theme.textMuted, margin: 0 }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@media(max-width:768px){ .about-grid { grid-template-columns: 1fr !important; gap: 32px !important; } }`}</style>
    </section>
  );
}