import React, { useEffect, useRef, useState } from 'react';
import { Brain, Layers, ClipboardList, FileText, BarChart2, Calendar } from 'lucide-react';

const FEATURES = [
  {
    icon: Brain, title: 'AI Practice',
    desc: 'Adaptive questions calibrated to your current skill level and weak points.',
    accent: '#6366f1', emoji: '🧠',
  },
  {
    icon: Layers, title: 'Smart Flashcards',
    desc: 'Spaced repetition system that surfaces cards exactly when you need them.',
    accent: '#10b981', emoji: '🃏',
  },
  {
    icon: ClipboardList, title: 'Exam Mode',
    desc: 'Full-length timed simulations under real exam conditions.',
    accent: '#f59e0b', emoji: '📋',
  },
  {
    icon: FileText, title: 'AI Notes',
    desc: 'Upload PDFs or YouTube videos — AI turns them into structured study notes.',
    accent: '#3b82f6', emoji: '📄',
  },
  {
    icon: BarChart2, title: 'Progress Analytics',
    desc: 'Skill-level breakdowns, accuracy trends, and score projections.',
    accent: '#ec4899', emoji: '📈',
  },
  {
    icon: Calendar, title: 'Study Planner',
    desc: 'AI-generated study plans with daily goals and exam countdown.',
    accent: '#14b8a6', emoji: '📅',
  },
];

export default function FeaturesGrid({ theme }) {
  return (
    <section id="features" style={{
      padding: '100px 24px',
      background: theme.isDark ? '#080c12' : '#f8fafc',
    }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <span style={{
            display: 'inline-block', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: theme.accent,
            background: theme.isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.08)',
            padding: '5px 14px', borderRadius: 999, marginBottom: 16,
          }}>
            Platform Features
          </span>
          <h2 style={{
            fontSize: 38, fontWeight: 800, lineHeight: 1.15,
            color: theme.text, letterSpacing: '-0.03em', margin: '0 0 14px',
          }}>
            Everything you need to ace your exams
          </h2>
          <p style={{ fontSize: 17, color: theme.textMuted, maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
            One platform. Every tool you need.
          </p>
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 18,
        }} className="features-grid">
          {FEATURES.map((f, i) => (
            <FeatureCard key={i} feature={f} theme={theme} delay={i * 70} />
          ))}
        </div>
      </div>

      <style>{`
        @media(max-width: 900px) { .features-grid { grid-template-columns: 1fr 1fr !important; } }
        @media(max-width: 560px) { .features-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}

function FeatureCard({ feature, theme, delay }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const Icon = feature.icon;

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: theme.isDark
          ? hovered ? '#141c2a' : '#0f1623'
          : hovered ? '#ffffff' : '#ffffff',
        border: `1px solid ${hovered ? feature.accent + '55' : theme.isDark ? '#1a2236' : '#e8ecf2'}`,
        borderRadius: 20,
        padding: '28px 26px',
        cursor: 'default',
        transform: hovered ? 'translateY(-5px)' : visible ? 'translateY(0)' : 'translateY(28px)',
        opacity: visible ? 1 : 0,
        transition: `transform 500ms ease ${delay}ms, opacity 500ms ease ${delay}ms, border-color 200ms, box-shadow 200ms, background 200ms`,
        boxShadow: hovered
          ? theme.isDark
            ? `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${feature.accent}22`
            : `0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px ${feature.accent}22`
          : theme.isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      {/* Icon row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 13, flexShrink: 0,
          background: feature.accent + '14',
          border: `1px solid ${feature.accent}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={feature.accent} strokeWidth={1.8} />
        </div>
        <span style={{
          fontSize: 20, lineHeight: 1,
          filter: hovered ? 'none' : 'grayscale(30%)',
          transition: 'filter 200ms',
        }}>{feature.emoji}</span>
      </div>

      {/* Text */}
      <h3 style={{
        fontSize: 16, fontWeight: 700,
        color: theme.text, margin: '0 0 8px',
        letterSpacing: '-0.01em',
      }}>
        {feature.title}
      </h3>
      <p style={{
        fontSize: 14, color: theme.textMuted,
        lineHeight: 1.65, margin: 0,
      }}>
        {feature.desc}
      </p>

      {/* Bottom accent line on hover */}
      <div style={{
        height: 2, borderRadius: 999, marginTop: 20,
        background: feature.accent,
        width: hovered ? '100%' : '0%',
        transition: 'width 300ms ease',
        opacity: 0.5,
      }} />
    </div>
  );
}