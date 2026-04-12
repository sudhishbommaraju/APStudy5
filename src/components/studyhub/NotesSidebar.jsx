import React from 'react';
import { Brain, Layers, BarChart2 } from 'lucide-react';
import AudioLessonPanel from './AudioLessonPanel';

export default function NotesSidebar({ note, masteryScore, onCreatePractice, onCreateFlashcards }) {
  const pct = masteryScore ?? 0;
  const color = pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-500';
  const ring = pct >= 80 ? 'stroke-green-500' : pct >= 50 ? 'stroke-yellow-400' : 'stroke-red-400';

  const circumference = 2 * Math.PI * 20;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="w-72 shrink-0 flex flex-col gap-4 p-4 overflow-y-auto bg-[#f8fafc] border-l border-gray-200 h-full">

      {/* Mastery Score */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Mastery Score</h3>
        </div>
        <div className="flex items-center gap-4">
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="20" fill="none" stroke="#f0f0f0" strokeWidth="5" />
            <circle
              cx="26" cy="26" r="20"
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className={ring}
              transform="rotate(-90 26 26)"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
            <text x="26" y="30" textAnchor="middle" fontSize="11" fontWeight="700" fill="#374151">{pct}%</text>
          </svg>
          <div>
            <p className={`text-sm font-bold ${color}`}>
              {pct >= 80 ? 'Mastered' : pct >= 50 ? 'Developing' : 'Getting Started'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Based on practice history</p>
          </div>
        </div>
      </div>

      {/* Practice */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
            <Brain className="w-4 h-4 text-green-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Practice</h3>
        </div>
        <p className="text-xs text-gray-500 mb-3">Test your knowledge with AP-style questions from these notes</p>
        <button
          onClick={onCreatePractice}
          className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          Generate Questions
        </button>
      </div>

      {/* Flashcards */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center">
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Flashcards</h3>
        </div>
        <p className="text-xs text-gray-500 mb-3">Review key terms and concepts with spaced repetition</p>
        <button
          onClick={onCreateFlashcards}
          className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          Study Flashcards
        </button>
      </div>

      {/* Audio Lesson */}
      <AudioLessonPanel note={note} />

    </div>
  );
}