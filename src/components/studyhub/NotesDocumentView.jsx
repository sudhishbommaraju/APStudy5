import React, { useState, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Edit3, Check, Highlighter, Download, RefreshCw, Brain, Zap, Layers, X, ChevronDown, ChevronUp, BookOpen, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import NotesMasteryView from './NotesMasteryView';
import APVisuals from './APVisuals';

const HIGHLIGHT_COLORS = ['#FFF176', '#A5D6A7', '#90CAF9', '#FFCC80', '#F48FB1'];

const GRAPH_MAP = {
  velocity: 'kinematics', acceleration: 'kinematics', kinematics: 'kinematics',
  motion: 'kinematics', derivative: 'calculus', integral: 'calculus',
  function: 'calculus', equilibrium: 'chemistry', 'reaction rate': 'chemistry',
};

function detectVisual(title, content) {
  const text = (title + ' ' + (content || []).join(' ')).toLowerCase();
  for (const [kw, type] of Object.entries(GRAPH_MAP)) {
    if (text.includes(kw)) return type;
  }
  return null;
}

function downloadNote(note) {
  const notesData = note.notes_data;
  const lines = [
    `# ${note.title}`, '',
    note.summary || notesData?.summary || '', '',
    ...(notesData?.sections || []).flatMap(s => [
      `## ${s.title}`,
      ...(Array.isArray(s.content) ? s.content.map(b => `- ${b}`) : [s.content]), ''
    ])
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${note.title}.md`; a.click();
  URL.revokeObjectURL(url);
}

function applyHighlights(text, highlights) {
  if (!highlights?.length || !text) return <span>{text}</span>;
  let parts = [{ text: String(text), highlighted: false }];
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
    ? <mark key={i} style={{ backgroundColor: p.color, borderRadius: 2, padding: '0 2px' }}>{p.text}</mark>
    : <span key={i}>{p.text}</span>)}</span>;
}

export default function NotesDocumentView({ note, onUpdated }) {
  const notesData = note.notes_data || {};
  const sections = notesData.sections || [];
  const practiceQuestions = notesData.practiceQuestions || [];

  const [openSections, setOpenSections] = useState(() => {
    const obj = {}; sections.forEach((_, i) => { obj[i] = true; }); return obj;
  });
  const [editMode, setEditMode] = useState(false);
  const [editedSections, setEditedSections] = useState(() => sections.map(s => ({ ...s, content: Array.isArray(s.content) ? [...s.content] : [s.content] })));
  const [highlights, setHighlights] = useState([]);
  const [highlightMode, setHighlightMode] = useState(false);
  const [highlightColor, setHighlightColor] = useState('#FFF176');
  const [showMastery, setShowMastery] = useState(false);
  const [answeredQ, setAnsweredQ] = useState({});
  const [saving, setSaving] = useState(false);
  const [activePanel, setActivePanel] = useState('practice'); // 'practice' | 'flashcards'
  const [flashcards, setFlashcards] = useState([]);
  const [flippedCards, setFlippedCards] = useState(new Set());
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);

  const displaySections = editMode ? editedSections : sections;

  const handleMouseUp = useCallback(() => {
    if (!highlightMode) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const phrase = sel.toString().trim();
    if (phrase.length < 2) return;
    setHighlights(prev => [...prev, { phrase, color: highlightColor }]);
    sel.removeAllRanges();
  }, [highlightMode, highlightColor]);

  const updateBullet = (si, bi, val) => {
    setEditedSections(prev => {
      const next = prev.map(s => ({ ...s, content: [...s.content] }));
      next[si].content[bi] = val;
      return next;
    });
  };

  async function saveEdits() {
    setSaving(true);
    const updated = { ...notesData, sections: editedSections };
    await base44.entities.StudyNote.update(note.id, { notes_data: updated });
    setSaving(false);
    setEditMode(false);
    onUpdated?.();
  }

  async function generateFlashcards() {
    setGeneratingFlashcards(true);
    setActivePanel('flashcards');
    try {
      const allContent = displaySections.map(s => `${s.title}: ${(Array.isArray(s.content) ? s.content : [s.content]).join(' ')}`).join('\n');
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create 12 flashcards from these AP notes. Front = key term or question, back = concise answer.\n\n${allContent}`,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object', properties: {
            flashcards: { type: 'array', items: { type: 'object', properties: { front: { type: 'string' }, back: { type: 'string' } } } }
          }
        }
      });
      setFlashcards(result?.flashcards || []);
    } catch (e) {}
    setGeneratingFlashcards(false);
  }

  const toggleCard = (i) => setFlippedCards(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });

  const masteryText = [notesData.summary, '', ...displaySections.map(s =>
    `## ${s.title}\n${(Array.isArray(s.content) ? s.content : [s.content]).map(b => `- ${b}`).join('\n')}`)
  ].join('\n\n');

  return (
    <div className="flex h-full">
      {/* Document area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-200 bg-white shrink-0 flex-wrap">
          <h1 className="text-base font-semibold text-gray-900 flex-1 truncate min-w-0">{note.title}</h1>

          {/* Highlight toolbar */}
          <div className={`flex items-center gap-1 border rounded-lg px-2 py-1.5 ${highlightMode ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'}`}>
            <button onClick={() => setHighlightMode(p => !p)} className={`p-1 rounded ${highlightMode ? 'text-yellow-600' : 'text-gray-400 hover:text-gray-600'}`} title="Highlight">
              <Highlighter className="w-3.5 h-3.5" />
            </button>
            {highlightMode && HIGHLIGHT_COLORS.map(c => (
              <button key={c} onClick={() => setHighlightColor(c)} style={{ backgroundColor: c, width: 14, height: 14, borderRadius: 2, border: highlightColor === c ? '2px solid #374151' : '1px solid #d1d5db' }} />
            ))}
            {highlights.length > 0 && <button onClick={() => setHighlights([])} className="text-xs text-gray-400 hover:text-red-400 ml-1">✕</button>}
          </div>

          {editMode ? (
            <button onClick={saveEdits} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {saving ? 'Saving…' : 'Save'}
            </button>
          ) : (
            <button onClick={() => setEditMode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:border-blue-300 transition-colors">
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          )}
          <button onClick={() => downloadNote(note)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Download"><Download className="w-4 h-4" /></button>
        </div>

        {/* Document body */}
        <div
          className="flex-1 overflow-auto px-10 py-8"
          onMouseUp={handleMouseUp}
          style={{ cursor: highlightMode ? 'crosshair' : 'default', userSelect: highlightMode ? 'text' : 'auto' }}
        >
          <div className="max-w-2xl mx-auto">
            {/* Summary */}
            {(notesData.summary || note.content) && (
              <div className="mb-8 p-5 bg-blue-50 border border-blue-100 rounded-2xl">
                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Summary</p>
                <p className="text-sm text-blue-900 leading-relaxed">{applyHighlights(notesData.summary || note.content, highlights)}</p>
              </div>
            )}

            {/* Key Terms */}
            {notesData.keyTerms?.length > 0 && (
              <div className="mb-8">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Key Terms</p>
                <div className="flex flex-wrap gap-2">
                  {notesData.keyTerms.map((t, i) => (
                    <span key={i} className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full text-xs font-medium">
                      {applyHighlights(t, highlights)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Sections */}
            {displaySections.length > 0 ? (
              <div className="space-y-4">
                {displaySections.map((sec, i) => {
                  const visual = sec.hasGraph ? sec.graphType : detectVisual(sec.title, sec.content);
                  const bullets = Array.isArray(sec.content) ? sec.content : [sec.content];
                  return (
                    <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden">
                      <button
                        onClick={() => setOpenSections(p => ({ ...p, [i]: !p[i] }))}
                        className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                      >
                        <span className="text-sm font-semibold text-gray-800">{sec.title}</span>
                        {openSections[i] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </button>
                      {openSections[i] && (
                        <div className="px-5 py-4 bg-white space-y-2.5">
                          {bullets.map((b, j) => (
                            <div key={j} className="flex items-start gap-2.5">
                              <span className="text-blue-400 text-xs mt-1.5 shrink-0">●</span>
                              {editMode ? (
                                <textarea value={b} onChange={e => updateBullet(i, j, e.target.value)} rows={2}
                                  className="flex-1 text-sm text-gray-700 border border-blue-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none leading-relaxed" />
                              ) : (
                                <p className="text-sm text-gray-700 leading-relaxed">{applyHighlights(b, highlights)}</p>
                              )}
                            </div>
                          ))}
                          {visual && <div className="mt-3 pt-3 border-t border-gray-100"><APVisuals subjectId={visual} unit={sec.title} topic={sec.title} /></div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No structured sections found in this note.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-72 border-l border-gray-200 flex flex-col bg-white shrink-0">
        {/* Panel tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'practice', label: 'Practice', icon: Brain },
            { id: 'flashcards', label: 'Flashcards', icon: Layers },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActivePanel(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-colors ${
                activePanel === id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        {/* Practice panel */}
        {activePanel === 'practice' && (
          <div className="flex-1 overflow-auto flex flex-col">
            <div className="p-3 border-b border-gray-100">
              <button onClick={() => setShowMastery(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-semibold transition-colors">
                <Zap className="w-3.5 h-3.5" /> Mastery Mode
              </button>
            </div>
            <div className="flex-1 overflow-auto p-3 space-y-3">
              {practiceQuestions.length === 0 ? (
                <p className="text-xs text-gray-400 text-center mt-6">No practice questions in this note.</p>
              ) : practiceQuestions.map((q, i) => {
                const answered = answeredQ[i];
                return (
                  <div key={i} className={`border rounded-xl p-3 ${q.type === 'FRQ' ? 'border-purple-200' : 'border-gray-200'}`}>
                    <div className="flex items-start gap-1.5 mb-2">
                      <span className={`shrink-0 text-xs font-bold px-1.5 py-0.5 rounded ${q.type === 'FRQ' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                        {q.type || 'MCQ'}
                      </span>
                      <p className="text-xs text-gray-800 leading-relaxed font-medium">{q.question}</p>
                    </div>
                    {q.options?.length > 0 && !answered && (
                      <div className="space-y-1.5">
                        {q.options.map((opt, j) => (
                          <button key={j} onClick={() => setAnsweredQ(p => ({ ...p, [i]: String.fromCharCode(65 + j) }))}
                            className="w-full text-left text-xs px-2.5 py-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                            <span className="font-bold mr-1.5">{String.fromCharCode(65 + j)}.</span>{opt}
                          </button>
                        ))}
                      </div>
                    )}
                    {!answered && !q.options?.length && (
                      <button onClick={() => setAnsweredQ(p => ({ ...p, [i]: true }))} className="text-xs text-blue-500 hover:underline font-medium mt-1">Show answer →</button>
                    )}
                    {answered && (
                      <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-2.5">
                        <p className="text-xs font-semibold text-green-600 mb-1">Answer</p>
                        <p className="text-xs text-green-800 leading-relaxed">{q.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Flashcards panel */}
        {activePanel === 'flashcards' && (
          <div className="flex-1 overflow-auto flex flex-col">
            <div className="p-3 border-b border-gray-100">
              <button onClick={generateFlashcards} disabled={generatingFlashcards}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white rounded-xl text-xs font-semibold transition-colors">
                {generatingFlashcards ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
                {generatingFlashcards ? 'Generating…' : 'Generate Flashcards'}
              </button>
            </div>
            <div className="flex-1 overflow-auto p-3 space-y-2">
              {flashcards.length === 0 && !generatingFlashcards && (
                <p className="text-xs text-gray-400 text-center mt-6">Click above to auto-generate flashcards from this note.</p>
              )}
              {flashcards.map((card, i) => {
                const flipped = flippedCards.has(i);
                return (
                  <button key={i} onClick={() => toggleCard(i)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${flipped ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-gray-200 hover:border-indigo-200'}`}>
                    <p className={`text-xs font-semibold mb-1 ${flipped ? 'text-indigo-500' : 'text-gray-400'}`}>
                      {flipped ? 'Answer' : `Card ${i + 1}`}
                    </p>
                    <p className={`text-xs leading-relaxed ${flipped ? 'text-indigo-900' : 'text-gray-800 font-medium'}`}>
                      {flipped ? card.back : card.front}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showMastery && (
        <NotesMasteryView notes={masteryText} title={note.title} onClose={() => setShowMastery(false)} />
      )}
    </div>
  );
}