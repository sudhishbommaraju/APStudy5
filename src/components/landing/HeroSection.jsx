import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { Flame, Target, TrendingUp, BookOpen } from 'lucide-react';

const masteryData = [
  { week: 'W1', score: 42 }, { week: 'W2', score: 51 }, { week: 'W3', score: 60 },
  { week: 'W4', score: 67 }, { week: 'W5', score: 74 }, { week: 'W6', score: 82 },
];

const subjects = [
  { name: 'AP Bio', pct: 84, color: '#3b82f6' },
  { name: 'Calc AB', pct: 71, color: '#8b5cf6' },
  { name: 'APUSH', pct: 63, color: '#10b981' },
];

export default function HeroSection({ isDark }) {
  const [animated, setAnimated] = useState(false);
  const bg = isDark ? '#0b0f14' : '#ffffff';
  const card = isDark ? '#111827' : '#f8fafc';
  const text = isDark ? '#e5e7eb' : '#0f172a';
  const muted = isDark ? '#6b7280' : '#64748b';
  const border = isDark ? '#1f2937' : '#e2e8f0';
  const accent = isDark ? '#3b82f6' : '#2563eb';

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      className="min-h-screen flex items-center pt-16"
      style={{ background: bg }}
      id="features"
    >
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center py-20">
        {/* Left */}
        <div
          className="transition-all duration-700"
          style={{ opacity: animated ? 1 : 0, transform: animated ? 'translateY(0)' : 'translateY(24px)' }}
        >
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-6"
            style={{ background: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.08)', color: accent }}
          >
            <Flame className="w-3.5 h-3.5" /> AI-Powered Study Platform
          </div>
          <h1
            className="text-5xl lg:text-6xl font-bold leading-tight mb-6"
            style={{ color: text, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
          >
            Your AI-Powered<br />
            <span style={{ color: accent }}>Study System</span>
          </h1>
          <p className="text-lg leading-relaxed mb-10" style={{ color: muted, maxWidth: '480px' }}>
            Practice, notes, exams, analytics, and planning — all in one platform built for serious students.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => base44.auth.redirectToLogin()}
              className="px-7 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: accent, color: '#fff',
                boxShadow: isDark ? '0 0 24px rgba(59,130,246,0.4)' : '0 6px 20px rgba(37,99,235,0.3)',
              }}
            >
              Start Studying Free
            </button>
            <a
              href="#how-it-works"
              className="px-7 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105 border"
              style={{ color: text, borderColor: border, background: card }}
            >
              See How It Works
            </a>
          </div>
        </div>

        {/* Right — Dashboard mockup */}
        <div
          className="transition-all duration-700 delay-200"
          style={{ opacity: animated ? 1 : 0, transform: animated ? 'translateY(0)' : 'translateY(32px)' }}
        >
          <div
            className="rounded-2xl p-6 space-y-5"
            style={{
              background: card,
              border: `1px solid ${border}`,
              boxShadow: isDark ? '0 0 40px rgba(59,130,246,0.1)' : '0 20px 60px rgba(0,0,0,0.08)',
            }}
          >
            {/* Top stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: TrendingUp, label: 'Mastery', value: '82%', color: '#10b981' },
                { icon: Flame, label: 'Streak', value: '14 days', color: '#f59e0b' },
                { icon: Target, label: 'Accuracy', value: '91%', color: accent },
              ].map(({ icon: Icon, label, value, color }) => (
                <div
                  key={label}
                  className="rounded-xl p-3 text-center"
                  style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#fff', border: `1px solid ${border}` }}
                >
                  <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
                  <div className="text-xs font-bold" style={{ color: text }}>{value}</div>
                  <div className="text-xs mt-0.5" style={{ color: muted }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Mastery chart */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold" style={{ color: text }}>Mastery Over Time</span>
                <BookOpen className="w-3.5 h-3.5" style={{ color: muted }} />
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={masteryData}>
                  <defs>
                    <linearGradient id="masteryGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={accent} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: muted }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={[30, 100]} />
                  <Tooltip
                    contentStyle={{ background: card, border: `1px solid ${border}`, borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: text }}
                    itemStyle={{ color: accent }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke={accent}
                    strokeWidth={2.5}
                    fill="url(#masteryGrad)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Subject breakdown */}
            <div>
              <p className="text-xs font-semibold mb-3" style={{ color: text }}>Subject Breakdown</p>
              <div className="space-y-2">
                {subjects.map(s => (
                  <div key={s.name}>
                    <div className="flex justify-between text-xs mb-1" style={{ color: muted }}>
                      <span>{s.name}</span><span style={{ color: text }}>{s.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: isDark ? '#1f2937' : '#e2e8f0' }}>
                      <div
                        className="h-1.5 rounded-full transition-all duration-1000"
                        style={{ width: animated ? `${s.pct}%` : '0%', background: s.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}