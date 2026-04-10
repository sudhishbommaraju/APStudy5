import React, { useEffect, useRef, useState } from 'react';

const AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=40&h=40&fit=crop&crop=face',
];

function useCountUp(target, duration = 1800) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (!started) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);
  return [count, setStarted];
}

export default function TrustSection({ theme }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [count, setStarted] = useCountUp(1000);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); setStarted(true); }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} style={{
      padding: '60px 24px', textAlign: 'center',
      borderTop: `1px solid ${theme.border}`,
      borderBottom: `1px solid ${theme.border}`,
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <p style={{
          fontSize: 14, fontWeight: 600, color: theme.textMuted, letterSpacing: '0.06em',
          textTransform: 'uppercase', marginBottom: 16,
          opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(16px)',
          transition: 'all 600ms ease',
        }}>
          Trusted by students worldwide
        </p>
        <div style={{
          fontSize: 48, fontWeight: 800, color: theme.text, letterSpacing: '-0.03em', marginBottom: 8,
          opacity: visible ? 1 : 0, transition: 'opacity 600ms ease 200ms',
        }}>
          {count.toLocaleString()}+
        </div>
        <p style={{ color: theme.textMuted, fontSize: 15, marginBottom: 24 }}>students improving their scores every day</p>

        {/* Avatars */}
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: -8,
          opacity: visible ? 1 : 0, transition: 'opacity 600ms ease 400ms',
        }}>
          {AVATARS.map((src, i) => (
            <img key={i} src={src} alt="student" style={{
              width: 36, height: 36, borderRadius: '50%',
              border: `2px solid ${theme.bg}`,
              marginLeft: i === 0 ? 0 : -10,
              objectFit: 'cover',
            }} />
          ))}
          <span style={{ marginLeft: 12, fontSize: 13, color: theme.textMuted, fontWeight: 500 }}>
            and many more
          </span>
        </div>
      </div>
    </section>
  );
}