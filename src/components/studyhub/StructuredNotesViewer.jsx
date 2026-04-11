import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, Zap, ChevronDown, ChevronUp, Download, RefreshCw, X, Edit3, Check, Highlighter, ChevronRight, Brain } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import APVisuals from './APVisuals';
import NotesMasteryView from './NotesMasteryView';

const GRAPH_MAP = {
  'velocity': 'kinematics', 'acceleration': 'kinematics', 'kinematics': 'kinematics',
  'motion': 'kinematics', 'free body': 'kinematics', 'derivative': 'calculus',
  'integral': 'calculus', 'function': 'calculus', 'limit': 'calculus',
  'equilibrium': 'chemistry', 'reaction rate': 'chemistry',
};

function detectVisual(title, content) {
  const text = (title + ' ' + (content || []).join(' ')).toLowerCase();
  for (const [kw, type] of Object.entries(GRAPH_MAP)) {
    if (text.includes(kw)) return type;
  }
  return null;
}

function downloadNotes(notes, title) {
  const lines = [
    `# ${title}`, '', `## Summary`, notes.summary || '', '',
    `## Key Terms`, (notes.keyTerms || []).map(t => `- ${t}`).join('\n'), '',
    ...(notes.sections || []).flatMap(s => [
      `## ${s.title}`,
      ...(Array.isArray(s.content) ? s.content.map(b => `- ${b}`) : [s.content]), ''
    ]),
    `## Practice Questions`,
    ...(notes.practiceQuestions || []).flatMap((q, i) => [
      `**Q${i + 1} (${q.type || 'MCQ'}): ${q.question}**`, `Answer: ${q.answer}`, ''
    ])
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${title || 'AP Notes'}.md`; a.click();
  URL.revokeObjectURL(url);
}

function buildMasteryText(notes) {
  if (!notes) return '';
  return [notes.summary, '', ...(notes.sections || []).map(s =>
    `## ${s.title}\n${(Array.isArray(s.content) ? s.content : [s.content]).map(b => `- ${b}`).join('\n')}`)
  ].join('\n\n');
}

// Apply stored highlights to text
function applyHighlights(text, highlights) {
  if (!highlights?.length) return <span>{text}</span>;
  let result = text;
  let parts = [{ text, highlighted: false }];
  highlights.forEach(({ phrase, color }) => {
    parts = parts.flatMap(p => {
      if (p.highlighted) return [p];
      const idx = p.text.indexOf(phrase);
      if (idx === -1) return [p];
      const res = [];
      if (idx > 0) res.push({ text: p.text.slice(0, idx), highlighted: false });
      res.push({ text: phrase, highlighted: true, color });
      if (idx + phrase.length < p.text.length) res.push({ text: p.text.slice(idx + phrase.length), highlighted: false });
      return res;
    });
  });
  return <span>{parts.map((p, i) => p.highlighted
    ? <mark key={i} style={{ backgroundColor: p.color, borderRadius: '2px', padding: '0 2px' }}>{p.text}</mark>
    : <span key={i}>{p.text}</span>)}</span>;
}

const HIGHLIGHT_COLORS = ['#FFF176', '#A5D6A7', '#90CAF9', '#FFCC80', '#F48FB1'];

export default function StructuredNotesViewer({ notes, onRegenerate }) {
  const [openSections, setOpenSections] = useState(() => {
    const obj = {};
    (notes?.sections || []).forEach((_, i) => { obj[i] = true; });
    return obj;
  });
  const [openQ, setOpenQ] = useState({});
  const [showMastery, setShowMastery] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedSections, setEditedSections] = useState(() =>
    (notes?.sections || []).map(s => ({ ...s, content: Array.isArray(s.content) ? [...s.content] : [s.content] }))
  );
  const [highlightColor, setHighlightColor] = useState('#FFF176');
  const [highlights, setHighlights] = useState([]);
  const [highlightMode, setHighlightMode] = useState(false);
  const [showPractice, setShowPractice] = useState(true);
  const [answeredQ, setAnsweredQ] = useState({});
  const notesAreaRef = useRef(null);

  // Auto-fullscreen on mount
  const [fullscreen, setFullscreen] = useState(true);

  const toggle = (set, key) => set(prev => ({ ...prev, [key]: !prev[key] }));

  const handleMouseUp = useCallback(() => {
    if (!highlightMode) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const phrase = sel.toString().trim();
    if (phrase.length < 2) return;
    setHighlights(prev => [...prev, { phrase, color: highlightColor }]);
    sel.removeAllRanges();
  }, [highlightMode, highlightColor]);

  const updateBullet = (secIdx, bulletIdx, value) => {
    setEditedSections(prev => {
      const next = prev.map(s => ({ ...s, content: [...s.content] }));
      next[secIdx].content[bulletIdx] = value;
      return next;
    });
  };

  const sections = editMode ? editedSections : (notes?.sections || []);
  const masteryText = buildMasteryText(notes);

  const NotesPanel = () => (
    <div
      className="flex-1 overflow-auto px-8 py-6"
      ref={notesAreaRef}
      onMouseUp={handleMouseUp}
      style={{ userSelect: highlightMode ? 'text' : 'auto', cursor: highlightMode ? 'crosshair' : 'default' }}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Summary */}
        {notes.summary && (
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-2">Summary</p>
            <p className="text-sm text-blue-900 leading-relaxed">{applyHighlights(notes.summary, highlights)}</p>
          </div>
        )}

        {/* Key Terms */}
        {notes.keyTerms?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Key Terms</p>
            <div className="flex flex-wrap gap-2">
              {notes.keyTerms.map((term, i) => (
                <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-medium">
                  {applyHighlights(term, highlights)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sections */}
        {sections.map((sec, i) => {
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
                <div className="px-4 py-4 bg-white space-y-2">
                  {(Array.isArray(sec.content) ? sec.content : [sec.content]).map((point, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <span className="text-blue-400 mt-2 shrink-0 text-xs">•</span>
                      {editMode ? (
                        <textarea
                          value={point}
                          onChange={e => updateBullet(i, j, e.target.value)}
                          rows={2}
                          className="flex-1 text-sm text-gray-700 border border-blue-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none leading-relaxed"
                        />
                      ) : (
                        <p className="text-sm text-gray-700 leading-relaxed flex-1">{applyHighlights(point, highlights)}</p>
                      )}
                    </div>
                  ))}
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
    </div>
  );

  const PracticePanel = () => (
    <div className="w-80 border-l border-gray-200 bg-gray-50 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-semibold text-gray-800">Practice</span>
        </div>
        <button onClick={() => setShowPractice(false)} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {(notes.practiceQuestions || []).length === 0 && (
          <p className="text-sm text-gray-400 text-center mt-8">No practice questions generated.</p>
        )}
        {(notes.practiceQuestions || []).map((q, i) => {
          const answered = answeredQ[i];
          return (
            <div key={i} className={`bg-white border rounded-xl p-4 ${q.type === 'FRQ' ? 'border-purple-200' : 'border-gray-200'}`}>
              <div className="flex items-start gap-2 mb-3">
                <span className={`shrink-0 text-xs font-bold px-1.5 py-0.5 rounded ${q.type === 'FRQ' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                  {q.type || 'MCQ'}
                </span>
                <p className="text-xs font-medium text-gray-800 leading-relaxed">{q.question}</p>
              </div>

              {q.options?.length > 0 && !answered && (
                <div className="space-y-1.5 mb-3">
                  {q.options.map((opt, j) => (
                    <button
                      key={j}
                      onClick={() => setAnsweredQ(prev => ({ ...prev, [i]: String.fromCharCode(65 + j) }))}
                      className="w-full text-left text-xs px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <span className="font-bold mr-2">{String.fromCharCode(65 + j)}.</span>{opt}
                    </button>
                  ))}
                </div>
              )}

              {answered ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-green-600 mb-1">Answer</p>
                  <p className="text-xs text-green-800 leading-relaxed">{q.answer}</p>
                </div>
              ) : !q.options?.length && (
                <button
                  onClick={() => setAnsweredQ(prev => ({ ...prev, [i]: true }))}
                  className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                >
                  Show answer →
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="px-4 py-3 border-t border-gray-200">
        <Button onClick={() => setShowMastery(true)} className="w-full bg-green-500 hover:bg-green-600 text-white gap-1.5" size="sm">
          <Zap className="w-3.5 h-3.5" /> Full Mastery Mode
        </Button>
      </div>
    </div>
  );

  if (!notes) return null;

  return (
    <>
      {/* Inline preview (small) — only when not fullscreen */}
      {!fullscreen && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-gray-900 text-sm truncate max-w-xs">{notes.title}</span>
            </div>
            <button onClick={() => setFullscreen(true)} className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg font-medium hover:bg-blue-600">
              Open Full View
            </button>
          </div>
          <div className="px-6 py-4 text-sm text-gray-500">{notes.summary}</div>
        </div>
      )}

      {/* Fullscreen */}
      {fullscreen && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          {/* Top bar */}
          <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-200 bg-white shrink-0">
            <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="font-semibold text-gray-900 text-sm truncate flex-1">{notes.title}</span>

            {/* Highlight toolbar */}
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-1">
              <button
                onClick={() => setHighlightMode(p => !p)}
                className={`p-1.5 rounded transition-colors ${highlightMode ? 'bg-yellow-100 text-yellow-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Highlight mode"
              >
                <Highlighter className="w-3.5 h-3.5" />
              </button>
              {highlightMode && HIGHLIGHT_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setHighlightColor(c)}
                  style={{ backgroundColor: c, width: 16, height: 16, borderRadius: 3, border: highlightColor === c ? '2px solid #374151' : '1px solid #d1d5db' }}
                />
              ))}
              {highlights.length > 0 && (
                <button onClick={() => setHighlights([])} className="text-xs text-gray-400 hover:text-red-500 ml-1 px-1">clear</button>
              )}
            </div>

            {/* Edit toggle */}
            <button
              onClick={() => setEditMode(p => !p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                editMode ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 text-gray-600 hover:border-blue-300'
              }`}
            >
              {editMode ? <><Check className="w-3.5 h-3.5" /> Done Editing</> : <><Edit3 className="w-3.5 h-3.5" /> Edit</>}
            </button>

            {/* Practice toggle */}
            {!showPractice && (
              <button
                onClick={() => setShowPractice(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:border-purple-300 transition-colors"
              >
                <Brain className="w-3.5 h-3.5" /> Practice
              </button>
            )}

            <button onClick={() => downloadNotes(notes, notes.title)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Download">
              <Download className="w-4 h-4" />
            </button>
            {onRegenerate && (
              <button onClick={onRegenerate} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Regenerate">
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => setFullscreen(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 flex overflow-hidden">
            <NotesPanel />
            {showPractice && <PracticePanel />}
          </div>
        </div>
      )}

      {showMastery && (
        <NotesMasteryView notes={masteryText} title={notes.title} onClose={() => setShowMastery(false)} />
      )}
    </>
  );
}