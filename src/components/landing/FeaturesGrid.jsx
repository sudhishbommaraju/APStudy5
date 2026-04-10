import React, { useEffect, useRef, useState } from 'react';
import { Brain, Layers, ClipboardList, FileText, BarChart2, Calendar } from 'lucide-react';

const FEATURES = [
  { icon: Brain, title: 'AI Practice', desc: 'Adaptive questions calibrated to your current skill level and weak points.' },
  { icon: Layers, title: 'Smart Flashcards', desc: 'Spaced repetition system that surfaces cards exactly when you need them.' },
  { icon: ClipboardList, title: 'Exam Mode', desc: 'Full-length timed simulations under real exam conditions.' },
  { icon: FileText, title: 'AI Notes', desc: 'Upload PDFs or YouTube videos — AI turns them into structured study notes.' },
  { icon: BarChart2, title: 'Progress Analytics', desc: 'Skill-level breakdowns, accuracy trends, and score projections.' },
  { icon: Calendar, title: 'Study Planner', desc: 'AI-generated study plans with daily goals and exam countdown.' },
];

export default function FeaturesGrid({ theme }) {
  return (
    <section id="features" style={{ padding: '80px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: theme.text, textAlign: 'center', marginBottom: 8, letterSpacing: '-0.02em' }}>
          Everything you need to ace your exams
        </h2>
        <p style={{ color: theme.textMuted, textAlign: 'center', marginBottom: 48, fontSize: 16 }}>
          One platform. Every tool you need.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="features-grid">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return <FeatureCard key={i} feature={f} Icon={Icon} theme={theme} delay={i * 60} />;
          })}
        </div>
      </div>
      <style>{`@media(max-width:768px){ .features-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}

function FeatureCard({ feature, Icon, theme, delay }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: theme.bgCard,
        border: `1px solid ${hovered ? theme.accent : theme.border}`,
        borderRadius: 16, padding: 24,
        boxShadow: hovered ? theme.shadow : 'none',
        transform: hovered ? 'translateY(-4px)' : visible ? 'translateY(0)' : 'translateY(24px)',
        opacity: visible ? 1 : 0,
        transition: `all 500ms ease ${delay}ms`,
        cursor: 'default',
      }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: theme.isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
      }}>
        <Icon size={18} color={theme.accent} />
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: theme.text, marginBottom: 8 }}>{feature.title}</h3>
      <p style={{ fontSize: 14, color: theme.textMuted, lineHeight: 1.6, margin: 0 }}>{feature.desc}</p>
    </div>
  );
}