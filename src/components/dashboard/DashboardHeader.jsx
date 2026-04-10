import React from 'react';
import { Bell } from 'lucide-react';

export default function DashboardHeader({ theme, activeTab, setActiveTab, user }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '24px 0 20px',
      borderBottom: `1px solid ${theme.border}`,
      marginBottom: 24,
    }}>
      {/* Exam toggle */}
      <div style={{
        display: 'flex', gap: 4,
        background: theme.isDark ? '#1f2937' : '#f1f5f9',
        borderRadius: 999, padding: 4,
      }}>
        {['SAT', 'ACT', 'AP'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '6px 20px', borderRadius: 999, border: 'none',
            background: activeTab === tab ? theme.card : 'transparent',
            color: activeTab === tab ? theme.text : theme.textMuted,
            fontWeight: activeTab === tab ? 600 : 500,
            fontSize: 13, cursor: 'pointer',
            boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 200ms ease',
          }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button style={{
          width: 36, height: 36, borderRadius: 10, border: `1px solid ${theme.border}`,
          background: theme.card, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Bell size={15} color={theme.textMuted} />
        </button>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', background: theme.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer',
        }}>
          {user ? (user.full_name || user.email || 'U')[0].toUpperCase() : 'U'}
        </div>
      </div>
    </div>
  );
}