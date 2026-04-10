import React, { useEffect, useRef, useState } from 'react';

export default function AboutSection({ isDark }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  const bg = isDark ? '#0d1117' : '#f8fafc';
  const card = isDark ? '#111827' : '#ffffff';
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
    <section ref={ref} className="py-24" style={{ background: bg }} id="about">
      <div className="max-w-[1200px] mx-auto px-6">
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)' }}
        >
          <div>
            <h2
              className="text-4xl font-bold mb-6"
              style={{ color: text, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
            >
              Why we built Proofly
            </h2>
            <p className="text-base leading-relaxed mb-4" style={{ color: muted }}>
              Students jump between too many tools — notes app, flashcard app, YouTube, practice tests, score trackers. 
              None of them talk to each other. None of them tell you <em>what</em> to study next.
            </p>
            <p className="text-base leading-relaxed mb-4" style={{ color: muted }}>
              Proofly was built to unify studying into one intelligent system that adapts to each learner. 
              Not a content library. Not a passive tool. An active study partner that identifies your gaps and closes them.
            </p>
            <p className="text-base leading-relaxed" style={{ color: muted }}>
              Built by a student who struggled — not for lack of effort, but for lack of feedback. 
              Proofly gives every student the structured, measurable approach that top tutors provide.
            </p>
          </div>

          {/* Founder card */}
          <div
            className="rounded-2xl p-8"
            style={{
              background: card,
              border: `1px solid ${border}`,
              boxShadow: isDark ? '0 0 30px rgba(59,130,246,0.08)' : '0 8px 32px rgba(0,0,0,0.06)',
            }}
          >
            <div className="text-4xl mb-4">🎓</div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: text }}>Built with students in mind</h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: muted }}>
              Every feature in Proofly exists because a real student needed it. 
              From adaptive difficulty to AI-generated notes — each tool solves a specific problem in the study process.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-4" style={{ borderTop: `1px solid ${border}` }}>
              {[['1,000+', 'Students'], ['50+', 'AP Subjects'], ['4.8★', 'Avg. Rating']].map(([val, label]) => (
                <div key={label} className="text-center">
                  <div className="text-xl font-bold mb-0.5" style={{ color: accent }}>{val}</div>
                  <div className="text-xs" style={{ color: muted }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}