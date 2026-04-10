import React, { useEffect, useRef, useState } from 'react';
import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    quote: "I went from a 1180 to a 1450 in 3 months. Proofly's adaptive practice found exactly what I was missing.",
    name: "Aisha K.",
    detail: "+270 SAT points",
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop&crop=face',
  },
  {
    quote: "The AI-generated flashcards and notes saved me hours. I got 5s on three AP exams this year.",
    name: "Marcus T.",
    detail: "3× AP 5 scorer",
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&crop=face',
  },
  {
    quote: "No other platform gives you this much data about your own performance. It's like having a personal coach.",
    name: "Sofia R.",
    detail: "+8 ACT composite",
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop&crop=face',
  },
];

export default function Testimonials({ isDark }) {
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
    <section ref={ref} className="py-24" style={{ background: bg }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div
          className="text-center mb-14 transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)' }}
        >
          <h2
            className="text-4xl font-bold mb-3"
            style={{ color: text, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
          >
            Students who made the jump
          </h2>
          <p style={{ color: muted }}>Real results from real students.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ quote, name, detail, avatar }, i) => (
            <div
              key={name}
              className="rounded-2xl p-7 transition-all duration-200 hover:-translate-y-1.5 cursor-default"
              style={{
                background: card,
                border: `1px solid ${border}`,
                boxShadow: isDark ? '0 0 0 1px rgba(59,130,246,0.06), 0 4px 20px rgba(0,0,0,0.3)' : '0 2px 16px rgba(0,0,0,0.05)',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(28px)',
                transition: `all 0.6s ease ${i * 120}ms`,
              }}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-current" style={{ color: '#f59e0b' }} />
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-6" style={{ color: muted }}>"{quote}"</p>
              <div className="flex items-center gap-3">
                <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold" style={{ color: text }}>{name}</p>
                  <p className="text-xs font-medium" style={{ color: accent }}>{detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}