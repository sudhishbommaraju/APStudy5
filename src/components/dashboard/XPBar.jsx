import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Zap, ShoppingBag } from 'lucide-react';

// XP needed to reach next level (scales up)
export function xpForLevel(level) {
  return Math.floor(100 * Math.pow(1.3, level - 1));
}

// Total XP needed from scratch to reach a level
export function totalXpForLevel(level) {
  let total = 0;
  for (let i = 1; i < level; i++) total += xpForLevel(i);
  return total;
}

export function getLevelFromXP(totalXp) {
  let level = 1;
  let xpUsed = 0;
  while (true) {
    const needed = xpForLevel(level);
    if (xpUsed + needed > totalXp) break;
    xpUsed += needed;
    level++;
    if (level >= 100) break;
  }
  return { level, xpIntoLevel: totalXp - xpUsed, xpNeeded: xpForLevel(level) };
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

export default function XPBar({ theme, totalXp = 0, points = 0 }) {
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
            <Zap size={14} color="#f59e0b" />
            <span style={{ fontSize: 16, fontWeight: 700, color: theme.text }}>{points.toLocaleString()}</span>
          </div>
          <span style={{ fontSize: 11, color: theme.textMuted }}>Points</span>
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