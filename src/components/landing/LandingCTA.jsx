import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import LegalFooter from '@/components/legal/LegalFooter';

export default function LandingCTA({ isDark }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  const bg = isDark ? '#0b0f14' : '#ffffff';
  const cta = isDark ? '#111827' : '#f8fafc';
  const text = isDark ? '#e5e7eb' : '#0f172a';
  const muted = isDark ? '#6b7280' : '#64748b';
  const border = isDark ? '#1f2937' : '#e2e8f0';
  const accent = isDark ? '#3b82f6' : '#2563eb';

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-24" style={{ background: bg }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div
          className="rounded-3xl p-16 text-center transition-all duration-700"
          style={{
            background: cta,
            border: `1px solid ${border}`,
            boxShadow: isDark ? '0 0 60px rgba(59,130,246,0.1)' : '0 12px 60px rgba(0,0,0,0.07)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(24px)',
          }}
        >
          <h2
            className="text-5xl font-bold mb-4"
            style={{ color: text, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
          >
            Start studying smarter today
          </h2>
          <p className="text-lg mb-10" style={{ color: muted }}>Join 1,000+ students already improving their scores.</p>
          <button
            onClick={() => base44.auth.redirectToLogin()}
            className="px-10 py-4 rounded-xl font-semibold text-base transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: accent,
              color: '#fff',
              boxShadow: isDark ? '0 0 30px rgba(59,130,246,0.45)' : '0 8px 24px rgba(37,99,235,0.3)',
            }}
          >
            Create Free Account
          </button>
          <p className="mt-4 text-sm" style={{ color: muted }}>No credit card required.</p>
        </div>
      </div>

      {/* Footer inside this component for convenience */}
      <div className="mt-16">
        <LegalFooter />
      </div>
    </section>
  );
}