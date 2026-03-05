import React, { useEffect, useRef, useState } from 'react';

export default function AboutBuilder() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion preference — show instantly
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect(); // run once
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const paragraphs = [
    `I built Proofly because I was frustrated with how inefficient studying felt. Most study platforms either overwhelm you with information or give you random practice questions without helping you actually understand what you're doing wrong.`,
    `As a student preparing for AP exams and other challenging classes, I realized that the biggest problem wasn't access to information—it was having the right kind of practice and feedback. I wanted a tool that could analyze mistakes, focus on weak areas, and help students improve faster instead of wasting time on things they already know.`,
    `That's why I created Proofly.`,
    `Proofly combines AI tutoring, personalized practice questions, flashcards, exam simulations, and progress tracking in one place. The goal is to make studying more adaptive and efficient so students can focus on understanding concepts rather than memorizing answers.`,
    `I'm continuously building and improving the platform, adding new features that make learning more interactive and effective.`,
    `At the end of the day, Proofly is built around a simple idea: students should be able to study smarter, not just longer.`
  ];

  return (
    <section
      style={{
        paddingTop: '100px',
        paddingBottom: '100px',
        paddingLeft: '24px',
        paddingRight: '24px'
      }}
    >
      {/* Subtle top divider */}
      <div
        style={{
          maxWidth: '640px',
          margin: '0 auto 72px auto',
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(47,109,246,0.25) 50%, transparent 100%)'
        }}
      />

      <div
        ref={ref}
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(18px)',
          transition: 'opacity 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1)'
        }}
      >
        {/* Label */}
        <div
          style={{
            display: 'inline-block',
            color: '#2F6DF6',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            fontWeight: '500',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '20px'
          }}
        >
          About the Builder
        </div>

        {/* Title */}
        <h2
          style={{
            color: '#F3F4F6',
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '40px',
            fontWeight: '400',
            lineHeight: '1.1',
            letterSpacing: '0.02em',
            marginBottom: '40px'
          }}
        >
          About Me
        </h2>

        {/* Body paragraphs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {paragraphs.map((text, i) => (
            <p
              key={i}
              style={{
                color: i === 2 ? '#F3F4F6' : '#9CA3AF',
                fontFamily: 'Inter, sans-serif',
                fontSize: i === 2 ? '20px' : '17px',
                fontWeight: i === 2 ? '500' : '400',
                lineHeight: '1.75',
                margin: 0
              }}
            >
              {text}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}