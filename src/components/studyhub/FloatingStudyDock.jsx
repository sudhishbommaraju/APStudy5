import React, { useState } from 'react';
import { Brain, Layers, Mic, RotateCcw, X, BookOpen } from 'lucide-react';

const ACTIONS = [
  { id: 'practice',   label: 'Practice',      icon: Brain,     accent: true  },
  { id: 'flashcards', label: 'Flashcards',     icon: Layers,    accent: false },
  { id: 'recall',     label: 'Active Recall',  icon: RotateCcw, accent: false },
  { id: 'audio',      label: 'Audio',          icon: Mic,       accent: false },
];

export default function FloatingStudyDock({ onPractice, onFlashcards, onRecall, onAudio, generatingPractice = false }) {
  const [expanded, setExpanded] = useState(false);

  const handlers = { practice: onPractice, flashcards: onFlashcards, recall: onRecall, audio: onAudio };

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 select-none">

      {/* Expanded action tray */}
      {expanded && (
        <div
          className="flex items-center gap-1 rounded-2xl px-3 py-2 shadow-2xl"
          style={{
            background: '#131313',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
          }}
        >
          {ACTIONS.map(({ id, label, icon: Icon, accent }) => (
            <button
              key={id}
              onClick={() => { handlers[id]?.(); setExpanded(false); }}
              disabled={id === 'practice' && generatingPractice}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all group disabled:opacity-40"
              style={{
                background: 'transparent',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Icon
                className="w-3.5 h-3.5 shrink-0 transition-colors"
                style={{ color: accent ? '#7BAE7F' : '#6A6A6A' }}
              />
              <span
                className="text-[0.78rem] font-medium whitespace-nowrap transition-colors"
                style={{ color: accent ? '#A8D4AC' : '#888' }}
              >
                {label}
              </span>
            </button>
          ))}
          <div className="w-px h-4 mx-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
          <button
            onClick={() => setExpanded(false)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#555' }}
            onMouseEnter={e => e.currentTarget.style.color = '#999'}
            onMouseLeave={e => e.currentTarget.style.color = '#555'}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Toggle pill */}
      <button
        onClick={() => setExpanded(p => !p)}
        className="flex items-center gap-2 px-4 py-2 rounded-full text-[0.78rem] font-medium transition-all"
        style={{
          background: expanded ? '#1A1A1A' : '#131313',
          border: expanded ? '1px solid rgba(255,255,255,0.11)' : '1px solid rgba(255,255,255,0.07)',
          color: expanded ? '#C8C3BB' : '#888',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}
        onMouseEnter={e => { if (!expanded) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; }}
        onMouseLeave={e => { if (!expanded) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
      >
        <BookOpen className="w-3.5 h-3.5" style={{ color: '#7BAE7F' }} />
        <span>Study Tools</span>
        <span
          className="text-[0.65rem] transition-transform inline-block"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', color: '#555' }}
        >
          ▲
        </span>
      </button>
    </div>
  );
}