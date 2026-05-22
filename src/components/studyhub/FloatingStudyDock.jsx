import React, { useState } from 'react';
import { Brain, Layers, RotateCcw, Mic, X, BookOpen } from 'lucide-react';

const TOOLS = [
  { id: 'practice',   label: 'Practice',  icon: Brain,     accent: true  },
  { id: 'flashcards', label: 'Flashcards', icon: Layers,    accent: false },
  { id: 'recall',     label: 'Recall',     icon: RotateCcw, accent: false },
  { id: 'audio',      label: 'Audio',      icon: Mic,       accent: false },
];

export default function FloatingStudyDock({ onPractice, onFlashcards, onRecall, onAudio, generatingPractice = false }) {
  const [open, setOpen] = useState(false);
  const handlers = { practice: onPractice, flashcards: onFlashcards, recall: onRecall, audio: onAudio };

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 40,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.5rem',
      userSelect: 'none',
    }}>
      {/* Expanded tool tray */}
      {open && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.25rem',
          padding: '0.4rem 0.5rem',
          borderRadius: '100px',
          background: '#161616',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
        }}>
          {TOOLS.map(({ id, label, icon: Icon, accent }) => (
            <ToolBtn
              key={id}
              label={label}
              icon={Icon}
              accent={accent}
              disabled={id === 'practice' && generatingPractice}
              onClick={() => { handlers[id]?.(); setOpen(false); }}
            />
          ))}
          <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.07)', margin: '0 0.25rem' }} />
          <button
            onClick={() => setOpen(false)}
            style={{
              padding: '0.35rem', borderRadius: '50%',
              background: 'transparent', border: 'none',
              color: '#555', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#999'}
            onMouseLeave={e => e.currentTarget.style.color = '#555'}
          >
            <X style={{ width: '12px', height: '12px' }} />
          </button>
        </div>
      )}

      {/* Toggle pill */}
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 1.125rem',
          borderRadius: '100px',
          background: '#161616',
          border: `1px solid ${open ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.07)'}`,
          color: open ? '#C8C3BB' : '#7A7A7A',
          fontSize: '0.78rem', fontWeight: 500,
          cursor: 'pointer',
          boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
          transition: 'all 0.12s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = open ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.07)'}
      >
        <BookOpen style={{ width: '13px', height: '13px', color: '#7BAE7F' }} />
        Study Tools
        <span style={{ fontSize: '0.6rem', color: '#444', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', display: 'inline-block' }}>▲</span>
      </button>
    </div>
  );
}

function ToolBtn({ label, icon: Icon, accent, disabled, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.4rem 0.75rem', borderRadius: '100px',
        background: hover ? 'rgba(255,255,255,0.05)' : 'transparent',
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'background 0.1s',
      }}
    >
      <Icon style={{ width: '13px', height: '13px', color: accent ? '#7BAE7F' : '#666' }} />
      <span style={{ fontSize: '0.775rem', fontWeight: 500, color: accent ? '#A8D4AC' : '#888', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </button>
  );
}