import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BookOpen, ClipboardList, FileText, Layers, AlertTriangle, Calendar } from 'lucide-react';

const MODULES = {
  SAT: [
    { label: 'Practice Questions', icon: BookOpen, color: '#3b82f6', route: 'SATPractice' },
    { label: 'Full Test', icon: ClipboardList, color: '#8b5cf6', route: 'SATFullTest' },
    { label: 'AI Notes', icon: FileText, color: '#10b981', route: 'Upload' },
    { label: 'Flashcards', icon: Layers, color: '#f59e0b', route: 'Flashcards' },
    { label: 'Weak Areas', icon: AlertTriangle, color: '#ef4444', route: 'SATPractice' },
    { label: 'Study Plan', icon: Calendar, color: '#06b6d4', route: 'StudyPlans' },
  ],
  ACT: [
    { label: 'Practice Questions', icon: BookOpen, color: '#3b82f6', route: 'ACTPractice' },
    { label: 'Full Test', icon: ClipboardList, color: '#8b5cf6', route: 'ACTFullTest' },
    { label: 'AI Notes', icon: FileText, color: '#10b981', route: 'Upload' },
    { label: 'Flashcards', icon: Layers, color: '#f59e0b', route: 'Flashcards' },
    { label: 'Weak Areas', icon: AlertTriangle, color: '#ef4444', route: 'ACTPractice' },
    { label: 'Study Plan', icon: Calendar, color: '#06b6d4', route: 'StudyPlans' },
  ],
  AP: [
    { label: 'Practice Questions', icon: BookOpen, color: '#3b82f6', route: 'APPractice' },
    { label: 'FRQ Simulator', icon: ClipboardList, color: '#8b5cf6', route: 'APFRQSimulator' },
    { label: 'AI Notes', icon: FileText, color: '#10b981', route: 'APCreate' },
    { label: 'Flashcards', icon: Layers, color: '#f59e0b', route: 'Flashcards' },
    { label: 'Weak Areas', icon: AlertTriangle, color: '#ef4444', route: 'APPractice' },
    { label: 'Study Plan', icon: Calendar, color: '#06b6d4', route: 'StudyPlans' },
  ],
};

export default function ModuleGrid({ theme, examType }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(false); setTimeout(() => setVisible(true), 100); }, [examType]);

  const modules = MODULES[examType] || MODULES.SAT;

  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 14 }}>Quick Access</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
        {modules.map((m, i) => (
          <ModuleCard key={m.label} module={m} theme={theme} visible={visible} delay={i * 60} />
        ))}
      </div>
    </div>
  );
}

function ModuleCard({ module, theme, visible, delay }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const Icon = module.icon;

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(createPageUrl(module.route))}
      style={{
        background: theme.card, border: `1px solid ${hovered ? module.color + '55' : theme.border}`,
        borderRadius: 14, padding: '16px 8px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        cursor: 'pointer',
        transform: hovered ? 'scale(1.04) translateY(-2px)' : visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(8px)',
        opacity: visible ? 1 : 0,
        boxShadow: hovered
          ? theme.isDark ? `0 0 0 1px ${module.color}44, 0 4px 16px ${module.color}22` : `0 4px 16px rgba(0,0,0,0.08)`
          : 'none',
        transition: `all 350ms ease ${delay}ms`,
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: `${module.color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} color={module.color} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textAlign: 'center', lineHeight: 1.3 }}>
        {module.label}
      </span>
    </button>
  );
}