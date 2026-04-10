import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BarChart2, BookOpen, ClipboardList, Layers, Calendar, Settings, LayoutDashboard, Sun, Moon, Flame } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'practice', label: 'Practice', icon: BookOpen },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'exams', label: 'Exams', icon: ClipboardList },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
  { id: 'planner', label: 'Planner', icon: Calendar },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const NAV_ROUTES = {
  practice: 'SATPractice',
  exams: 'SATFullTest',
  flashcards: 'Flashcards',
  planner: 'StudyPlans',
  settings: 'Settings',
};

export default function DashboardSidebar({ theme, activeNav, setActiveNav, user, isDark, onToggleTheme }) {
  const navigate = useNavigate();

  const handleNav = (item) => {
    setActiveNav(item.id);
    if (NAV_ROUTES[item.id]) {
      navigate(createPageUrl(NAV_ROUTES[item.id]));
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, bottom: 0, width: 240, zIndex: 50,
      background: theme.sidebar,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRight: `1px solid ${theme.border}`,
      display: 'flex', flexDirection: 'column',
      padding: '20px 12px',
      transition: 'background 200ms ease',
    }}>
      {/* Logo */}
      <div style={{ padding: '8px 12px 24px', borderBottom: `1px solid ${theme.border}`, marginBottom: 8 }}>
        <span style={{ fontWeight: 800, fontSize: 18, color: theme.text, letterSpacing: '-0.02em' }}>Proofly</span>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <NavItem
              key={item.id}
              icon={Icon}
              label={item.label}
              isActive={isActive}
              theme={theme}
              onClick={() => handleNav(item)}
            />
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 12 }}>
        {/* Streak indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 10, marginBottom: 8,
          background: isDark ? 'rgba(249,115,22,0.08)' : 'rgba(249,115,22,0.06)',
        }}>
          <Flame size={14} color="#f97316" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#f97316' }}>7-day streak</span>
        </div>

        {/* Theme toggle */}
        <button onClick={onToggleTheme} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 12px', borderRadius: 10, border: 'none',
          background: 'transparent', cursor: 'pointer',
          color: theme.textMuted, fontSize: 13, fontWeight: 500,
          transition: 'background 200ms',
        }}
          onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
          {isDark ? 'Light mode' : 'Dark mode'}
        </button>

        {/* User mini card */}
        {user && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 10, marginTop: 4,
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {(user.full_name || user.email || 'U')[0].toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: theme.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.full_name || 'Student'}
              </p>
              <p style={{ fontSize: 11, color: theme.textMuted, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, isActive, theme, onClick }) {
  const [hovered, setHovered] = React.useState(false);
  const active = isActive || hovered;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 12px', borderRadius: 10,
        background: isActive
          ? theme.isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.08)'
          : hovered ? theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
          : 'transparent',
        border: 'none',
        borderLeft: isActive ? `3px solid ${theme.accent}` : '3px solid transparent',
        cursor: 'pointer',
        color: isActive ? theme.accent : theme.textMuted,
        fontSize: 13, fontWeight: isActive ? 600 : 500,
        transition: 'all 200ms ease',
        textAlign: 'left',
      }}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}