import React, { useEffect, useRef, useState } from 'react';
import { Zap, CreditCard, FileText, BookOpen, BarChart2, Calendar } from 'lucide-react';

const FEATURES = [
  { icon: Zap, title: 'AI Practice', desc: 'Adaptive questions calibrated to your weak points, updated after every session.' },
  { icon: CreditCard, title: 'Smart Flashcards', desc: 'Spaced repetition flashcards that surface what you need most, right when you need it.' },
  { icon: FileText, title: 'Exam Mode', desc: 'Full-length timed simulations that replicate real exam conditions and scoring.' },
  { icon: BookOpen, title: 'AI Notes', desc: 'Upload PDFs or YouTube links and get structured, AI-generated study notes instantly.' },
  { icon: BarChart2, title: 'Progress Analytics', desc: 'Detailed dashboards tracking accuracy, streaks, mastery levels, and score projections.' },
  { icon: Calendar, title: 'Study Planner', desc: 'AI builds a personalized weekly study plan around your exam dates and weak areas.' },
];

export default function FeaturesGrid({ isDark }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  const bg = isDark ? '#0b0f14' : '#ffffff';
  const card = isDark ? '#111827' : '#f8fafc';
  const text = isDark ? '#e5e7eb' : '#0f172a';
  const muted = isDark ? '#6b7280' : '#64748b';
  const border = isDark ? '#1f2937' : '#e2e8f0';
  const accent = isDark ? '#3b82f6' : '#2563eb';

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-24" style={{ background: isDark ? '#0d1117' : '#f8fafc' }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div
          className="text-center mb-14 transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)' }}
        >
          <h2
            className="text-4xl font-bold mb-3"
            style={{ color: text, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
          >
            Everything you need to excel
          </h2>
          <p style={{ color: muted }}>Six powerful tools, one unified platform.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className="rounded-2xl p-6 cursor-default transition-all duration-200 hover:-translate-y-1.5"
              style={{
                background: card,
                border: `1px solid ${border}`,
                boxShadow: isDark
                  ? '0 0 0 1px rgba(59,130,246,0.06), 0 4px 20px rgba(0,0,0,0.3)'
                  : '0 2px 12px rgba(0,0,0,0.05)',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(24px)',
                transition: `all 0.5s ease ${i * 80}ms`,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.08)' }}
              >
                <Icon className="w-5 h-5" style={{ color: accent }} />
              </div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: text }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: muted }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}