import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, ClipboardList, Brain,
  FileText, Layers, Headphones, GraduationCap,
  BarChart2, Sparkles, Settings, LogOut, Sun, Moon, ShoppingBag
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const NAV_BY_EXAM = {
  SAT: {
    study: [
      { id: 'practice',   label: 'Practice',      icon: BookOpen,      route: '/SATPractice' },
      { id: 'exams',      label: 'Full Test',      icon: ClipboardList, route: '/SATFullTest' },
    ],
    learn: [
      { id: 'flashcards', label: 'Flashcards',     icon: Layers,        route: '/Flashcards' },
      { id: 'audio',      label: 'Audio Lessons',  icon: Headphones,    route: '/audio-lessons' },
    ],
    performance: [
      { id: 'analytics',  label: 'Analytics',      icon: BarChart2,     route: '/analytics-dashboard' },
      { id: 'studyplan',  label: 'Study Plan',     icon: Sparkles,      route: '/study-plan-generator?type=SAT' },
    ],
  },
  ACT: {
    study: [
      { id: 'practice',   label: 'Practice',       icon: BookOpen,      route: '/ACTPractice' },
      { id: 'exams',      label: 'Full Test',       icon: ClipboardList, route: '/ACTFullTest' },
    ],
    learn: [
      { id: 'flashcards', label: 'Flashcards',      icon: Layers,        route: '/Flashcards' },
      { id: 'audio',      label: 'Audio Lessons',   icon: Headphones,    route: '/audio-lessons' },
    ],
    performance: [
      { id: 'analytics',  label: 'Analytics',       icon: BarChart2,     route: '/analytics-dashboard' },
      { id: 'studyplan',  label: 'Study Plan',      icon: Sparkles,      route: '/study-plan-generator?type=ACT' },
    ],
  },
  AP: {
    study: [
      { id: 'practice',   label: 'Practice',        icon: BookOpen,      route: '/APPractice' },
      { id: 'exams',      label: 'Full Test',        icon: ClipboardList, route: '/APFullTest' },
      { id: 'recall',     label: 'Active Recall',    icon: Brain,         route: '/ap-study-hub' },
    ],
    learn: [
      { id: 'studyhub',   label: 'Notes',            icon: GraduationCap, route: '/ap-study-hub' },
      { id: 'flashcards', label: 'Flashcards',       icon: Layers,        route: '/Flashcards' },
      { id: 'audio',      label: 'Audio Lessons',    icon: Headphones,    route: '/audio-lessons' },
    ],
    performance: [
      { id: 'analytics',  label: 'Analytics',        icon: BarChart2,     route: '/analytics-dashboard' },
      { id: 'studyplan',  label: 'Study Plan',       icon: Sparkles,      route: '/study-plan-generator?type=AP' },
    ],
  },
};

function SectionLabel({ label, theme }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: theme.textMuted,
      padding: '12px 12px 4px', margin: 0,
    }}>{label}</p>
  );
}

function NavItem({ icon: Icon, label, isActive, theme, onClick }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 8,
        background: isActive
          ? theme.isDark ? 'rgba(59,130,246,0.14)' : 'rgba(37,99,235,0.09)'
          : hovered ? theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
          : 'transparent',
        border: 'none',
        borderLeft: isActive ? `3px solid ${theme.accent}` : '3px solid transparent',
        cursor: 'pointer',
        color: isActive ? theme.accent : theme.textMuted,
        fontSize: 13, fontWeight: isActive ? 600 : 500,
        transition: 'all 150ms ease',
        textAlign: 'left',
      }}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

export default function DashboardSidebar({ theme, activeNav, setActiveNav, user, activeTab = 'SAT' }) {
  const navigate = useNavigate();
  const sections = NAV_BY_EXAM[activeTab] || NAV_BY_EXAM.SAT;

  const handleNav = (item) => {
    setActiveNav(item.id);
    if (item.route) navigate(item.route);
  };

  const handleLogout = () => {
    base44.auth.logout('/');
  };

  const initials = (user?.full_name || user?.email || 'U')[0].toUpperCase();

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, bottom: 0, width: 240, zIndex: 50,
      background: theme.sidebar,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRight: `1px solid ${theme.border}`,
      display: 'flex', flexDirection: 'column',
      transition: 'background 200ms ease',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: `1px solid ${theme.border}` }}>
        <span style={{ fontWeight: 800, fontSize: 18, color: theme.text, letterSpacing: '-0.02em' }}>Proofly</span>
      </div>

      {/* Overview */}
      <div style={{ padding: '8px 12px 0' }}>
        <NavItem
          icon={LayoutDashboard}
          label="Overview"
          isActive={activeNav === 'overview'}
          theme={theme}
          onClick={() => setActiveNav('overview')}
        />
      </div>

      {/* Scrollable nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0 0 8px' }}>
        <SectionLabel label="Study" theme={theme} />
        <div style={{ padding: '0 12px' }}>
          {sections.study.map(item => (
            <NavItem key={item.id} icon={item.icon} label={item.label}
              isActive={activeNav === item.id} theme={theme}
              onClick={() => handleNav(item)} />
          ))}
        </div>

        <SectionLabel label="Learn" theme={theme} />
        <div style={{ padding: '0 12px' }}>
          {sections.learn.map(item => (
            <NavItem key={item.id} icon={item.icon} label={item.label}
              isActive={activeNav === item.id} theme={theme}
              onClick={() => handleNav(item)} />
          ))}
        </div>

        <SectionLabel label="Performance" theme={theme} />
        <div style={{ padding: '0 12px' }}>
          {sections.performance.map(item => (
            <NavItem key={item.id} icon={item.icon} label={item.label}
              isActive={activeNav === item.id} theme={theme}
              onClick={() => handleNav(item)} />
          ))}
        </div>
      </nav>

      {/* Bottom: account */}
      <div style={{ borderTop: `1px solid ${theme.border}`, padding: '8px 12px' }}>
        {/* Settings */}
        <NavItem
          icon={Settings}
          label="Profile Settings"
          isActive={activeNav === 'settings'}
          theme={theme}
          onClick={() => { setActiveNav('settings'); navigate('/Settings'); }}
        />

        {/* Logout */}
        <NavItem
          icon={LogOut}
          label="Log Out"
          isActive={false}
          theme={{ ...theme, accent: '#ef4444', textMuted: '#ef4444' }}
          onClick={handleLogout}
        />

        {/* User card */}
        {user && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 10, marginTop: 6,
            background: 'rgba(0,0,0,0.03)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {initials}
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