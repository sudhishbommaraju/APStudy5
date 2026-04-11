import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, Zap, ChevronDown, ChevronUp, Download, RefreshCw, Maximize2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import APVisuals from './APVisuals';
import NotesMasteryView from './NotesMasteryView';

// Detect if a section/graph needs a visual
const GRAPH_MAP = {
  'velocity': 'kinematics',
  'acceleration': 'kinematics',
  'kinematics': 'kinematics',
  'motion': 'kinematics',
  'free body': 'kinematics',
  'derivative': 'calculus',
  'integral': 'calculus',
  'function': 'calculus',
  'limit': 'calculus',
  'equilibrium': 'chemistry',
  'reaction rate': 'chemistry',
};

function detectVisual(title, content) {
  const text = (title + ' ' + (content || []).join(' ')).toLowerCase();
  for (const [keyword, type] of Object.entries(GRAPH_MAP)) {
    if (text.includes(keyword)) return type;
  }
  return null;
}

function downloadNotes(notes, title) {
  const lines = [
    `# ${title}`,
    '',
    `## Summary`,
    notes.summary || '',
    '',
    `## Key Terms`,
    (notes.keyTerms || []).map(t => `- ${t}`).join('\n'),
    '',
    ...(notes.sections || []).flatMap(s => [
      `## ${s.title}`,
      ...(Array.isArray(s.content) ? s.content.map(b => `- ${b}`) : [s.content]),
      ''
    ]),
    `## Practice Questions`,
    ...(notes.practiceQuestions || []).flatMap((q, i) => [
      `**Q${i + 1} (${q.type || 'MCQ'}): ${q.question}**`,
      `Answer: ${q.answer}`,
      ''
    ])
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title || 'AP Notes'}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function buildMasteryText(notes) {
  if (!notes) return '';
  return [
    notes.summary,
    '',
    ...(notes.sections || []).map(s =>
      `## ${s.title}\n${(Array.isArray(s.content) ? s.content : [s.content]).map(b => `- ${b}`).join('\n')}`
    )
  ].join('\n\n');
}

export default function StructuredNotesViewer({ notes, onRegenerate }) {
  const [openSections, setOpenSections] = useState(() => {
    const obj = {};
    (notes?.sections || []).forEach((_, i) => { obj[i] = i < 2; });
    return obj;
  });
  const [openQ, setOpenQ] = useState({});
  const [fullscreen, setFullscreen] = useState(false);
  const [showMastery, setShowMastery] = useState(false);
  const toggle = (set, key) => set(prev => ({ ...prev, [key]: !prev[key] }));

  if (!notes) return null;

  const masteryText = buildMasteryText(notes);

  const Content = () => (
    <div className="space-y-6">
      {/* Summary */}
      {notes.summary && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-2">Summary</p>
          <p className="text-sm text-blue-900 leading-relaxed">{notes.summary}</p>
        </div>
      )}

      {/* Key Terms */}
      {notes.keyTerms?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Key Terms</p>
          <div className="flex flex-wrap gap-2">
            {notes.keyTerms.map((term, i) => (
              <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-medium">
                {term}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sections */}
      {notes.sections?.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Study Sections</p>
          {notes.sections.map((sec, i) => {
            const visualType = sec.hasGraph ? sec.graphType : detectVisual(sec.title, sec.content);
            return (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggle(setOpenSections, i)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <span className="text-sm font-semibold text-gray-800">{sec.title}</span>
                  {openSections[i] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {openSections[i] && (
                  <div className="px-4 py-4 bg-white space-y-3">
                    <ul className="space-y-2">
                      {(Array.isArray(sec.content) ? sec.content : [sec.content]).map((point, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed">
                          <span className="text-blue-400 mt-1 shrink-0">•</span>
                          <ReactMarkdown
                            className="prose prose-sm max-w-none prose-p:my-0"
                            components={{ p: ({ children }) => <span>{children}</span> }}
                          >{point}</ReactMarkdown>
                        </li>
                      ))}
                    </ul>
                    {visualType && (
                      <div className="mt-3 border-t border-gray-100 pt-3">
                        <APVisuals subjectId={visualType} unit={sec.title} topic={sec.title} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Practice Questions */}
      {notes.practiceQuestions?.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Practice Questions</p>
          {notes.practiceQuestions.map((q, i) => (
            <div key={i} className={`border rounded-xl overflow-hidden ${q.type === 'FRQ' ? 'border-purple-200' : 'border-gray-200'}`}>
              <button
                onClick={() => toggle(setOpenQ, i)}
                className="w-full flex items-start justify-between gap-4 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <span className="text-sm text-gray-800 font-medium leading-relaxed flex items-start gap-2">
                  <span className={`shrink-0 text-xs font-bold px-1.5 py-0.5 rounded mt-0.5 ${q.type === 'FRQ' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                    {q.type || 'MCQ'}
                  </span>
                  {q.question}
                </span>
                {openQ[i] ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-1" />}
              </button>

              {q.options?.length > 0 && !openQ[i] && (
                <div className="px-4 pb-3 grid grid-cols-2 gap-1">
                  {q.options.map((opt, j) => (
                    <div key={j} className="text-xs text-gray-500 flex gap-1">
                      <span className="font-bold">{String.fromCharCode(65 + j)}.</span> {opt}
                    </div>
                  ))}
                </div>
              )}

              {openQ[i] && (
                <div className={`px-4 py-3 border-t ${q.type === 'FRQ' ? 'bg-purple-50 border-purple-100' : 'bg-green-50 border-green-100'}`}>
                  <p className={`text-xs font-semibold mb-1.5 ${q.type === 'FRQ' ? 'text-purple-600' : 'text-green-600'}`}>
                    {q.type === 'FRQ' ? 'Full Solution' : 'Answer'}
                  </p>
                  <ReactMarkdown
                    className="prose prose-sm max-w-none text-gray-800"
                  >{q.answer}</ReactMarkdown>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-gray-900 text-sm truncate max-w-xs">{notes.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowMastery(true)} className="bg-green-500 hover:bg-green-600 text-white gap-1.5" size="sm">
              <Zap className="w-3.5 h-3.5" /> Start Mastering
            </Button>
            {onRegenerate && (
              <button onClick={onRegenerate} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Regenerate">
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => downloadNotes(notes, notes.title)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Download">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={() => setFullscreen(true)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Fullscreen">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-6 max-h-[70vh] overflow-auto">
          <Content />
        </div>
      </div>

      {/* Fullscreen */}
      {fullscreen && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200 sticky top-0 bg-white">
            <span className="text-base font-semibold text-gray-800">{notes.title}</span>
            <div className="flex gap-2">
              <button onClick={() => downloadNotes(notes, notes.title)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Download className="w-4 h-4" /></button>
              <button onClick={() => setFullscreen(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><X className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex-1 overflow-auto px-12 py-8 max-w-4xl mx-auto w-full">
            <Content />
          </div>
        </div>
      )}

      {showMastery && (
        <NotesMasteryView notes={masteryText} title={notes.title} onClose={() => setShowMastery(false)} />
      )}
    </>
  );
}