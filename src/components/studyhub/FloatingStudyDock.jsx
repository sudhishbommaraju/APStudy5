import React, { useState } from 'react';
import { Brain, Layers, Mic, RotateCcw, X, ChevronUp } from 'lucide-react';

const ACTIONS = [
  { id: 'practice',  label: 'Practice',       icon: Brain,      color: '#4B9E6B' },
  { id: 'flashcards', label: 'Flashcards',    icon: Layers,     color: '#7B6FD6' },
  { id: 'recall',    label: 'Active Recall',  icon: RotateCcw,  color: '#5B9BD5' },
  { id: 'audio',     label: 'Audio Mode',     icon: Mic,        color: '#D68B6F' },
];

export default function FloatingStudyDock({
  onPractice,
  onFlashcards,
  onRecall,
  onAudio,
  generatingPractice = false,
}) {
  const [expanded, setExpanded] = useState(false);

  const handlers = {
    practice: onPractice,
    flashcards: onFlashcards,
    recall: onRecall,
    audio: onAudio,
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2">
      {/* Expanded action row */}
      {expanded && (
        <div className="flex items-center gap-2 bg-[#141414] border border-[#2A2A2A] rounded-2xl px-4 py-2.5 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          {ACTIONS.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => { handlers[id]?.(); setExpanded(false); }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl hover:bg-[#1E1E1E] transition-colors group"
              title={label}
              disabled={id === 'practice' && generatingPractice}
            >
              <Icon className="w-4 h-4 shrink-0" style={{ color }} />
              <span className="text-[0.8rem] font-medium text-[#A0A0A0] group-hover:text-[#E0E0E0] transition-colors whitespace-nowrap">{label}</span>
            </button>
          ))}
          <div className="w-px h-5 bg-[#2A2A2A] mx-1" />
          <button
            onClick={() => setExpanded(false)}
            className="p-1.5 rounded-lg hover:bg-[#1E1E1E] text-[#555] hover:text-[#AAA] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Toggle pill */}
      <button
        onClick={() => setExpanded(p => !p)}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all shadow-lg text-[0.8rem] font-semibold ${
          expanded
            ? 'bg-[#1E1E1E] border-[#3A3A3A] text-[#A0A0A0]'
            : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#D0CCC6] hover:border-[#444] hover:bg-[#222]'
        }`}
      >
        <Brain className="w-3.5 h-3.5 text-[#7B9DCC]" />
        Study Tools
        <ChevronUp className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
}