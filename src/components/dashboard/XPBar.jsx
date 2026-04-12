import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Flame, ShoppingBag } from 'lucide-react';

// Level formula: floor(sqrt(xp / 50)) + 1
export function calcLevel(xp) {
  return Math.floor(Math.sqrt((xp || 0) / 50)) + 1;
}

export function xpForLevel(level) {
  return Math.pow(level - 1, 2) * 50;
}

export function xpForNextLevel(level) {
  return Math.pow(level, 2) * 50;
}

export function getLevelFromXP(totalXp) {
  const level = calcLevel(totalXp);
  const xpCurrentLevel = xpForLevel(level);
  const xpNext = xpForNextLevel(level);
  return { level, xpIntoLevel: totalXp - xpCurrentLevel, xpNeeded: xpNext - xpCurrentLevel };
}

const LEVEL_BADGES = [
  { min: 1,  label: 'Rookie',    color: '#94a3b8', emoji: '🌱' },
  { min: 5,  label: 'Scholar',   color: '#10b981', emoji: '📚' },
  { min: 10, label: 'Achiever',  color: '#3b82f6', emoji: '⚡' },
  { min: 20, label: 'Expert',    color: '#8b5cf6', emoji: '🔥' },
  { min: 35, label: 'Master',    color: '#f59e0b', emoji: '👑' },
  { min: 50, label: 'Legend',    color: '#ef4444', emoji: '💎' },
];

export function getBadge(level) {
  let badge = LEVEL_BADGES[0];
  for (const b of LEVEL_BADGES) { if (level >= b.min) badge = b; }
  return badge;
}

export default function XPBar({ theme, totalXp = 0, streak = 0 }) {
  const navigate = useNavigate();
  const { level, xpIntoLevel, xpNeeded } = getLevelFromXP(totalXp);
  const badge = getBadge(level);
  const pct = Math.min((xpIntoLevel / xpNeeded) * 100, 100);
  const [animPct, setAnimPct] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimPct(pct), 200);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div style={{
      background: theme.card, border: `1px solid ${theme.border}`,
      borderRadius: 16, padding: '16px 20px', marginBottom: 20,
      display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
    }}>
      {/* Badge */}
      <div style={{
        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
        background: badge.color + '18', border: `2px solid ${badge.color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22,
      }}>
        {badge.emoji}
      </div>

      {/* Level + bar */}
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>Level {level}</span>
            <span style={{
              fontSize: 11, fontWeight: 600, color: badge.color,
              background: badge.color + '18', padding: '2px 8px', borderRadius: 999,
            }}>{badge.label}</span>
          </div>
          <span style={{ fontSize: 12, color: theme.textMuted }}>
            {xpIntoLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP
          </span>
        </div>
        <div style={{ height: 8, borderRadius: 999, background: theme.isDark ? '#1f2937' : '#e2e8f0', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 999, width: `${animPct}%`,
            background: `linear-gradient(90deg, ${badge.color}, ${badge.color}cc)`,
            transition: 'width 800ms cubic-bezier(0.4,0,0.2,1)',
            boxShadow: `0 0 8px ${badge.color}66`,
          }} />
        </div>
      </div>

      {/* Points + store */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Flame size={14} color="#f59e0b" />
          <span style={{ fontSize: 16, fontWeight: 700, color: theme.text }}>{streak}</span>
        </div>
        <span style={{ fontSize: 11, color: theme.textMuted }}>Streak</span>
      </div>
        <button onClick={() => navigate('/Store')} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 10, border: 'none',
          background: '#f59e0b18', color: '#f59e0b', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', transition: 'all 150ms',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#f59e0b28'}
          onMouseLeave={e => e.currentTarget.style.background = '#f59e0b18'}
        >
          <ShoppingBag size={13} />
          Store
        </button>
      </div>
    </div>
  );
}