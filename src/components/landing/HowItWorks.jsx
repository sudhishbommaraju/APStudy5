import React, { useEffect, useRef, useState } from 'react';
import { Search, Sparkles, TrendingUp } from 'lucide-react';

const STEPS = [
  { icon: Search, step: '01', title: 'AI Analyzes Weaknesses', desc: 'Take a diagnostic session. The AI maps exactly which skills need the most work.' },
  { icon: Sparkles, step: '02', title: 'Generates Personalized Practice', desc: 'Questions, notes, and flashcards are generated specifically for your gaps — not a generic curriculum.' },
  { icon: TrendingUp, step: '03', title: 'Tracks Mastery Over Time', desc: 'Every session feeds the model. Watch mastery rise week over week with clear data.' },
];

export default function HowItWorks({ isDark }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  const bg = isDark ? '#0b0f14' : '#ffffff';
  const text = isDark ? '#e5e7eb' : '#0f172a';
  const muted = isDark ? '#6b7280' : '#64748b';
  const border = isDark ? '#1f2937' : '#e2e8f0';
  const accent = isDark ? '#3b82f6' : '#2563eb';

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} id="how-it-works" className="py-24" style={{ background: bg }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div
          className="text-center mb-16 transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)' }}
        >
          <h2
            className="text-4xl font-bold mb-3"
            style={{ color: text, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
          >
            How it works
          </h2>
          <p style={{ color: muted }}>Three steps from scattered studying to measurable mastery.</p>
        </div>

        {/* Timeline */}
        <div className="relative flex flex-col md:flex-row items-start md:items-stretch gap-8 md:gap-0">
          {STEPS.map(({ icon: Icon, step, title, desc }, i) => (
            <div
              key={step}
              className="flex-1 relative transition-all duration-700"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(28px)',
                transitionDelay: `${i * 150}ms`,
              }}
            >
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div
                  className="hidden md:block absolute top-8 left-1/2 w-full h-px"
                  style={{ background: border, zIndex: 0 }}
                />
              )}

              <div className="relative flex flex-col items-center text-center px-6 z-10">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                  style={{
                    background: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.08)',
                    border: `2px solid ${accent}`,
                    boxShadow: isDark ? `0 0 20px rgba(59,130,246,0.2)` : 'none',
                  }}
                >
                  <Icon className="w-7 h-7" style={{ color: accent }} />
                </div>
                <span className="text-xs font-bold mb-2" style={{ color: accent }}>STEP {step}</span>
                <h3 className="text-base font-semibold mb-2" style={{ color: text }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: muted, maxWidth: '240px' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}