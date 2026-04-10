import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import AIChat from '@/components/dashboard/AIChat';
import { getBadge, getLevelFromXP, xpForLevel } from '@/components/dashboard/XPBar';
import { ShoppingBag, Zap, CheckCircle2, Lock, Star } from 'lucide-react';

const STORE_ITEMS = [
  {
    id: 'sat_mock_1', category: 'Mock Tests',
    title: 'SAT Full Mock Test', description: 'Complete timed SAT simulation with detailed score report',
    cost: 500, icon: '📝', color: '#3b82f6', route: 'SATFullTest',
  },
  {
    id: 'act_mock_1', category: 'Mock Tests',
    title: 'ACT Full Mock Test', description: 'Full ACT timed exam with section breakdowns',
    cost: 500, icon: '📋', color: '#8b5cf6', route: 'ACTFullTest',
  },
  {
    id: 'ap_mock_1', category: 'Mock Tests',
    title: 'AP Full Mock Test', description: 'AP exam simulation with FRQ scoring',
    cost: 750, icon: '🎓', color: '#10b981', route: 'APFRQSimulator',
  },
  {
    id: 'sat_adaptive', category: 'Practice Packs',
    title: 'SAT Adaptive Pack (50Q)', description: '50 AI-adaptive SAT questions targeting your weak spots',
    cost: 300, icon: '⚡', color: '#f59e0b', route: 'SATAdaptivePractice',
  },
  {
    id: 'act_adaptive', category: 'Practice Packs',
    title: 'ACT Adaptive Pack (50Q)', description: '50 AI-adaptive ACT questions with personalized difficulty',
    cost: 300, icon: '🎯', color: '#ef4444', route: 'ACTAdaptivePractice',
  },
  {
    id: 'flashcard_mega', category: 'Study Tools',
    title: 'Mega Flashcard Deck', description: '500+ premium flashcards across all SAT/ACT topics',
    cost: 200, icon: '🃏', color: '#06b6d4', route: 'Flashcards',
  },
  {
    id: 'ai_roadmap', category: 'Study Tools',
    title: 'AI Roadmap (30 Days)', description: 'Extended 30-day personalized study roadmap',
    cost: 400, icon: '🗺️', color: '#ec4899', route: 'Roadmap',
  },
  {
    id: 'xp_boost', category: 'Boosts',
    title: '2× XP Boost (24h)', description: 'Earn double XP on all practice for the next 24 hours',
    cost: 250, icon: '🚀', color: '#f97316', route: null,
  },
];

export default function Store() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('proofly_theme') === 'dark');
  const [activeNav, setActiveNav] = useState('store');
  const [user, setUser] = useState(null);
  const [points, setPoints] = useState(0);
  const [purchased, setPurchased] = useState(() => {
    const s = localStorage.getItem('proofly_purchased');
    return s ? JSON.parse(s) : [];
  });
  const [notification, setNotification] = useState(null);
  const [category, setCategory] = useState('All');

  const theme = {
    isDark, bg: isDark ? '#0b0f14' : '#f8fafc',
    card: isDark ? '#111827' : '#ffffff', text: isDark ? '#e5e7eb' : '#0f172a',
    textMuted: isDark ? '#6b7280' : '#64748b', accent: isDark ? '#3b82f6' : '#2563eb',
    border: isDark ? '#1f2937' : '#e2e8f0',
    sidebar: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.5)',
  };

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      const totalXp = u?.total_xp || 0;
      setPoints(u?.points || Math.floor(totalXp * 0.5));
    }).catch(() => {});
  }, []);

  const buy = async (item) => {
    if (purchased.includes(item.id) || points < item.cost) return;
    const newPoints = points - item.cost;
    setPoints(newPoints);
    const newPurchased = [...purchased, item.id];
    setPurchased(newPurchased);
    localStorage.setItem('proofly_purchased', JSON.stringify(newPurchased));
    await base44.auth.updateMe({ points: newPoints }).catch(() => {});
    setNotification(`✅ "${item.title}" unlocked!`);
    setTimeout(() => setNotification(null), 3000);
  };

  const categories = ['All', ...new Set(STORE_ITEMS.map(i => i.category))];
  const filtered = category === 'All' ? STORE_ITEMS : STORE_ITEMS.filter(i => i.category === category);

  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg, fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <DashboardSidebar theme={theme} activeNav={activeNav} setActiveNav={setActiveNav}
          user={user} isDark={isDark} onToggleTheme={() => setIsDark(p => !p)} />

        <div style={{ flex: 1, marginLeft: 240, padding: '40px 40px 80px', overflow: 'auto' }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>

            {/* Notification */}
            {notification && (
              <div style={{
                position: 'fixed', top: 24, right: 24, zIndex: 9999,
                background: '#10b981', color: '#fff', padding: '12px 20px',
                borderRadius: 12, fontSize: 14, fontWeight: 600,
                boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
                animation: 'slideIn 200ms ease',
              }}>
                {notification}
              </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f59e0b18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag size={22} color="#f59e0b" />
                </div>
                <div>
                  <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: theme.text }}>Rewards Store</h1>
                  <p style={{ margin: 0, fontSize: 14, color: theme.textMuted }}>Spend your points on premium study tools</p>
                </div>
              </div>
              {/* Points display */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#f59e0b18', border: '1px solid #f59e0b33',
                borderRadius: 12, padding: '10px 18px',
              }}>
                <Zap size={16} color="#f59e0b" />
                <span style={{ fontSize: 20, fontWeight: 800, color: theme.text }}>{points.toLocaleString()}</span>
                <span style={{ fontSize: 13, color: theme.textMuted, fontWeight: 500 }}>points</span>
              </div>
            </div>

            {/* How to earn */}
            <div style={{
              background: theme.isDark ? '#0f172a' : '#eff6ff',
              border: `1px solid ${theme.accent}33`, borderRadius: 14,
              padding: '14px 20px', marginBottom: 28,
              display: 'flex', flexWrap: 'wrap', gap: 20,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: theme.accent }}>⚡ Earn Points:</span>
              {[
                { action: 'Correct Answer', pts: '+5 pts' },
                { action: 'Complete Session', pts: '+50 pts' },
                { action: 'Daily Streak', pts: '+25 pts/day' },
                { action: 'Level Up', pts: '+100 pts' },
              ].map(e => (
                <span key={e.action} style={{ fontSize: 13, color: theme.textMuted }}>
                  {e.action} <strong style={{ color: theme.text }}>{e.pts}</strong>
                </span>
              ))}
            </div>

            {/* Category filter */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {categories.map(c => (
                <button key={c} onClick={() => setCategory(c)} style={{
                  padding: '6px 16px', borderRadius: 999, border: 'none',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 150ms',
                  background: category === c ? theme.accent : theme.card,
                  color: category === c ? '#fff' : theme.textMuted,
                  border: `1px solid ${category === c ? theme.accent : theme.border}`,
                }}>{c}</button>
              ))}
            </div>

            {/* Items grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {filtered.map(item => {
                const isPurchased = purchased.includes(item.id);
                const canAfford = points >= item.cost;
                return (
                  <StoreCard key={item.id} item={item} theme={theme}
                    isPurchased={isPurchased} canAfford={canAfford} onBuy={() => buy(item)} />
                );
              })}
            </div>
          </div>
        </div>
        <AIChat theme={theme} />
      </div>
      <style>{`@keyframes slideIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </ProtectedRoute>
  );
}

function StoreCard({ item, theme, isPurchased, canAfford, onBuy }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: theme.card, borderRadius: 16, padding: 22,
        border: `1px solid ${isPurchased ? '#10b981' : hovered && canAfford ? item.color + '55' : theme.border}`,
        transition: 'all 200ms', transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? `0 8px 24px ${item.color}15` : 'none',
        opacity: !isPurchased && !canAfford ? 0.6 : 1,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: item.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            {item.icon}
          </div>
          <div>
            <span style={{ fontSize: 11, fontWeight: 600, color: item.color, background: item.color + '18', padding: '2px 8px', borderRadius: 999 }}>
              {item.category}
            </span>
          </div>
        </div>
        {isPurchased && <CheckCircle2 size={20} color="#10b981" />}
        {!isPurchased && !canAfford && <Lock size={16} color={theme.textMuted} />}
      </div>

      <div>
        <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: theme.text }}>{item.title}</h3>
        <p style={{ margin: 0, fontSize: 13, color: theme.textMuted, lineHeight: 1.5 }}>{item.description}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Zap size={14} color="#f59e0b" />
          <span style={{ fontSize: 16, fontWeight: 700, color: theme.text }}>{item.cost.toLocaleString()}</span>
          <span style={{ fontSize: 12, color: theme.textMuted }}>pts</span>
        </div>
        <button onClick={onBuy} disabled={isPurchased || !canAfford} style={{
          padding: '8px 18px', borderRadius: 10, border: 'none',
          fontSize: 13, fontWeight: 600, cursor: isPurchased || !canAfford ? 'default' : 'pointer',
          background: isPurchased ? '#10b98118' : canAfford ? item.color : theme.isDark ? '#1f2937' : '#e2e8f0',
          color: isPurchased ? '#10b981' : canAfford ? '#fff' : theme.textMuted,
          transition: 'all 150ms',
        }}>
          {isPurchased ? '✓ Owned' : canAfford ? 'Buy Now' : 'Not enough pts'}
        </button>
      </div>
    </div>
  );
}