import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, BookOpen, ClipboardList, Layers, Calendar, Settings, LayoutDashboard, Sun, Moon, Flame, Map, ShoppingBag, Sparkles, Clock, FileText } from 'lucide-react';

const AP_EXAM_DATES_2026 = [
  { subject: 'AP Human Geography', date: '2026-05-05', id: 'human_geo' },
  { subject: 'AP Chemistry', date: '2026-05-05', id: 'chemistry' },
  { subject: 'AP Psychology', date: '2026-05-06', id: 'psychology' },
  { subject: 'AP US History', date: '2026-05-07', id: 'us_history' },
  { subject: 'AP Calc AB', date: '2026-05-11', id: 'calc_ab' },
  { subject: 'AP Calc BC', date: '2026-05-11', id: 'calc_bc' },
  { subject: 'AP Physics 1', date: '2026-05-12', id: 'physics_1' },
  { subject: 'AP Statistics', date: '2026-05-13', id: 'statistics' },
  { subject: 'AP Biology', date: '2026-05-14', id: 'biology' },
  { subject: 'AP World History', date: '2026-05-14', id: 'world_history' },
  { subject: 'AP English Lang', date: '2026-05-15', id: 'english_lang' },
  { subject: 'AP US Gov', date: '2026-05-18', id: 'us_gov' },
  { subject: 'AP Macroeconomics', date: '2026-05-19', id: 'macro' },
  { subject: 'AP Physics C', date: '2026-05-19', id: 'physics_c_mech' },
  { subject: 'AP English Lit', date: '2026-05-20', id: 'english_lit' },
];

const NAV_BY_EXAM = {
  SAT: [
    { id: 'overview',   label: 'Overview',     icon: LayoutDashboard, route: null },
    { id: 'practice',   label: 'SAT Practice',  icon: BookOpen,        route: '/SATPractice' },
    { id: 'exams',      label: 'Full Test',     icon: ClipboardList,   route: '/SATFullTest' },
    { id: 'studyplan',  label: 'Study Plan',    icon: Sparkles,        route: '/study-plan-generator?type=SAT' },
    { id: 'analytics',  label: 'Analytics',     icon: BarChart2,       route: '/analytics-dashboard' },
    { id: 'flashcards', label: 'Flashcards',    icon: Layers,          route: '/Flashcards' },
    { id: 'store',      label: 'Store',         icon: ShoppingBag,     route: '/Store' },
    { id: 'settings',   label: 'Settings',      icon: Settings,        route: '/Settings' },
  ],
  ACT: [
    { id: 'overview',   label: 'Overview',      icon: LayoutDashboard, route: null },
    { id: 'practice',   label: 'ACT Practice',  icon: BookOpen,        route: '/ACTPractice' },
    { id: 'exams',      label: 'Full Test',      icon: ClipboardList,   route: '/ACTFullTest' },
    { id: 'studyplan',  label: 'Study Plan',     icon: Sparkles,        route: '/study-plan-generator?type=ACT' },
    { id: 'analytics',  label: 'Analytics',      icon: BarChart2,       route: '/analytics-dashboard' },
    { id: 'flashcards', label: 'Flashcards',     icon: Layers,          route: '/Flashcards' },
    { id: 'store',      label: 'Store',          icon: ShoppingBag,     route: '/Store' },
    { id: 'settings',   label: 'Settings',       icon: Settings,        route: '/Settings' },
  ],
  AP: [
    { id: 'overview',   label: 'Overview',       icon: LayoutDashboard, route: null },
    { id: 'practice',   label: 'AP Practice',    icon: BookOpen,        route: '/APPractice' },
    { id: 'exams',      label: 'AP Full Test',   icon: ClipboardList,   route: '/APFullTest' },
    { id: 'frq',        label: 'FRQ Simulator',  icon: FileText,        route: '/APFRQSimulator' },
    { id: 'studyplan',  label: 'Study Plan',     icon: Sparkles,        route: '/study-plan-generator?type=AP' },
    { id: 'analytics',  label: 'Analytics',      icon: BarChart2,       route: '/analytics-dashboard' },
    { id: 'flashcards', label: 'Flashcards',     icon: Layers,          route: '/Flashcards' },
    { id: 'store',      label: 'Store',          icon: ShoppingBag,     route: '/Store' },
    { id: 'settings',   label: 'Settings',       icon: Settings,        route: '/Settings' },
  ],
};

export default function DashboardSidebar({ theme, activeNav, setActiveNav, user, isDark, onToggleTheme, selectedApSubject, onSelectApSubject, activeTab = 'SAT' }) {
  const NAV_ITEMS = NAV_BY_EXAM[activeTab] || NAV_BY_EXAM.SAT;
  const navigate = useNavigate();
  const [showCountdown, setShowCountdown] = useState(false);

  const getDaysUntil = (dateStr) => {
    const diff = new Date(dateStr) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const selectedExam = selectedApSubject
    ? AP_EXAM_DATES_2026.find(e => e.id === selectedApSubject)
    : null;
  const daysUntil = selectedExam ? getDaysUntil(selectedExam.date) : null;

  const handleNav = (item) => {
    setActiveNav(item.id);
    if (item.route) {
      navigate(item.route);
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

      {/* AP Countdown */}
      <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 12, marginTop: 8 }}>
        <button
          onClick={() => setShowCountdown(p => !p)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px', borderRadius: 10, border: 'none',
            background: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(37,99,235,0.06)',
            cursor: 'pointer', marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: theme.accent, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={12} /> AP Exam Countdown
          </span>
          <span style={{ fontSize: 10, color: theme.textMuted }}>{showCountdown ? '▲' : '▼'}</span>
        </button>

        {showCountdown && (
          <div style={{ marginBottom: 8, maxHeight: 200, overflowY: 'auto' }}>
            {AP_EXAM_DATES_2026.map(exam => {
              const days = getDaysUntil(exam.date);
              const isSelected = selectedApSubject === exam.id;
              return (
                <button
                  key={exam.id}
                  onClick={() => onSelectApSubject && onSelectApSubject(isSelected ? null : exam.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: isSelected ? (isDark ? 'rgba(59,130,246,0.15)' : 'rgba(37,99,235,0.08)') : 'transparent',
                    marginBottom: 2,
                  }}
                >
                  <span style={{ fontSize: 11, color: theme.textMuted, textAlign: 'left', flex: 1 }}>{exam.subject}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: days <= 14 ? '#ef4444' : days <= 30 ? '#f59e0b' : theme.accent, flexShrink: 0, marginLeft: 4 }}>{days}d</span>
                </button>
              );
            })}
          </div>
        )}

        {selectedExam && daysUntil !== null && (
          <div style={{
            padding: '8px 12px', borderRadius: 10, marginBottom: 8,
            background: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.08)',
            border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : 'rgba(37,99,235,0.15)'}`,
          }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: theme.accent, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Selected Exam</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: theme.text, margin: '2px 0 0' }}>{selectedExam.subject}</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: daysUntil <= 14 ? '#ef4444' : theme.accent, margin: '2px 0 0', lineHeight: 1 }}>{daysUntil} <span style={{ fontSize: 11, fontWeight: 500 }}>days left</span></p>
          </div>
        )}
      </div>

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