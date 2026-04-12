import React from 'react';
import { Clock } from 'lucide-react';

export default function ExamTimer({ secondsRemaining }) {
  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  const isLowTime = secondsRemaining < 300; // Less than 5 minutes
  const isCritical = secondsRemaining < 60; // Less than 1 minute

  const getColor = () => {
    if (isCritical) return '#dc2626';
    if (isLowTime) return '#ea580c';
    return '#0f172a';
  };

  const getBackgroundColor = () => {
    if (isCritical) return 'rgba(220, 38, 38, 0.1)';
    if (isLowTime) return 'rgba(234, 88, 12, 0.1)';
    return 'transparent';
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 12px',
      borderRadius: 8,
      background: getBackgroundColor(),
      border: isCritical || isLowTime ? `1px solid ${getColor()}` : 'none',
    }}>
      <Clock size={16} color={getColor()} />
      <span style={{
        fontSize: 14,
        fontWeight: 700,
        color: getColor(),
        fontFamily: 'monospace',
        letterSpacing: '0.05em',
      }}>
        {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}