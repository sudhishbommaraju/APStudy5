import React, { useEffect, useRef, useState } from 'react';

const AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&h=40&fit=crop&crop=face',
];

function useCountUp(target, duration = 2000, active) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, duration]);
  return count;
}

export default function TrustSection({ isDark }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const count = useCountUp(1000, 2000, visible);

  const bg = isDark ? '#0b0f14' : '#ffffff';
  const text = isDark ? '#e5e7eb' : '#0f172a';
  const muted = isDark ? '#6b7280' : '#64748b';
  const accent = isDark ? '#3b82f6' : '#2563eb';

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-20 text-center" style={{ background: bg }}>
      <div
        className="transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)' }}
      >
        <p className="text-sm font-medium mb-4" style={{ color: muted }}>Trusted by students worldwide</p>
        <div className="text-6xl font-bold mb-2" style={{ color: text, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.03em' }}>
          {count.toLocaleString()}+
        </div>
        <p className="text-base mb-8" style={{ color: muted }}>students already studying smarter</p>

        {/* Avatar row */}
        <div className="flex items-center justify-center gap-1">
          {AVATARS.map((src, i) => (
            <img
              key={i}
              src={src}
              alt="student"
              className="w-9 h-9 rounded-full border-2 object-cover"
              style={{
                borderColor: isDark ? '#0b0f14' : '#fff',
                marginLeft: i > 0 ? '-10px' : '0',
                zIndex: AVATARS.length - i,
                position: 'relative',
              }}
            />
          ))}
          <span className="ml-4 text-sm font-medium" style={{ color: accent }}>and counting →</span>
        </div>
      </div>
    </section>
  );
}