import React, { useEffect, useRef, useState } from 'react';

const TESTIMONIALS = [
  {
    quote: "Proofly's adaptive practice found my weak spots in SAT Math that I didn't even know I had. My score went from 1240 to 1450 in 8 weeks.",
    name: 'Maya R.',
    detail: 'SAT: 1240 → 1450',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop&crop=face',
  },
  {
    quote: "The AI study assistant explains concepts better than my textbook. I finally understand AP Calc BC and got a 5 on my exam.",
    name: 'Jason T.',
    detail: 'AP Calculus BC: 5',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&crop=face',
  },
  {
    quote: "I used to waste time studying things I already knew. Proofly tells me exactly what to focus on. My ACT composite went from 27 to 33.",
    name: 'Sofia L.',
    detail: 'ACT: 27 → 33',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop&crop=face',
  },
];

export default function Testimonials({ theme }) {
  return (
    <section style={{ padding: '80px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: theme.text, textAlign: 'center', marginBottom: 8, letterSpacing: '-0.02em' }}>
          Students who've improved
        </h2>
        <p style={{ color: theme.textMuted, textAlign: 'center', marginBottom: 48, fontSize: 16 }}>Real results from real students</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="testimonials-grid">
          {TESTIMONIALS.map((t, i) => <TestimonialCard key={i} t={t} theme={theme} delay={i * 100} />)}
        </div>
      </div>
      <style>{`@media(max-width:768px){ .testimonials-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}

function TestimonialCard({ t, theme, delay }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: theme.bgCard, border: `1px solid ${hovered ? theme.accent : theme.border}`,
        borderRadius: 16, padding: 24, boxShadow: theme.shadow,
        transform: hovered ? 'translateY(-4px)' : visible ? 'translateY(0)' : 'translateY(24px)',
        opacity: visible ? 1 : 0,
        transition: `all 500ms ease ${delay}ms`,
      }}>
      <p style={{ fontSize: 14, color: theme.textMuted, lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>
        "{t.quote}"
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src={t.avatar} alt={t.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
        <div>
          <p style={{ fontWeight: 600, fontSize: 14, color: theme.text, margin: 0 }}>{t.name}</p>
          <p style={{ fontSize: 12, color: theme.accent, fontWeight: 500, margin: 0 }}>{t.detail}</p>
        </div>
      </div>
    </div>
  );
}