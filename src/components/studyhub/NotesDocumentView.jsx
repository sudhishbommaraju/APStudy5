import React, { useState, useCallback } from 'react';
import MathRenderer from '@/components/ui/MathRenderer';
import { base44 } from '@/api/base44Client';
import { exportNoteToPDF } from '@/utils/pdfExporter';
import {
  Edit3, Check, Highlighter, Download, Brain, X,
  ChevronDown, ChevronUp, BookOpen, Loader2, Maximize2, Minimize2, Network
} from 'lucide-react';
import APVisuals from './APVisuals';
import ConceptNodeView from './ConceptNodeView';
import ActiveRecallMode from './ActiveRecallMode';
import GenerateDeckModal from '../flashcards/GenerateDeckModal';
import APFlashcardReviewer from '../flashcards/APFlashcardReviewer';

const HIGHLIGHT_COLORS = ['#FFF176', '#A5D6A7', '#90CAF9', '#FFCC80', '#F48FB1'];

const GRAPH_MAP = {
  velocity: 'kinematics', acceleration: 'kinematics', kinematics: 'kinematics',
  motion: 'kinematics', derivative: 'calculus', integral: 'calculus',
  equilibrium: 'chemistry', 'reaction rate': 'chemistry',
  population: 'population', 'von thunen': 'vonThunen', agriculture: 'agriculture',
};

function detectVisual(title, bullets = []) {
  const text = (title + ' ' + bullets.join(' ')).toLowerCase();
  for (const [kw, type] of Object.entries(GRAPH_MAP)) {
    if (text.includes(kw)) return type;
  }
  return null;
}

function applyHighlights(text, highlights) {
  if (!highlights?.length || !text) return <MathRenderer text={String(text)} />;
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
  return (
    <span>
      {parts.map((p, i) => p.highlighted
        ? <mark key={i} style={{ backgroundColor: p.color, borderRadius: 2, padding: '0 2px' }}>{p.text}</mark>
        : <MathRenderer key={i} text={p.text} />)}
    </span>
  );
}

function downloadNote(note) {
  exportNoteToPDF(note);
}

export default function NotesDocumentView({ note, onUpdated, onCreatePractice, existingDeck }) {
  const nd = note.notes_data || {};
  const summaryBullets = Array.isArray(nd.summary) ? nd.summary : (nd.summary ? [nd.summary] : []);
  const sections = nd.sections || [];
  const keyTerms = nd.keyTerms || [];
  const practiceQuestions = nd.practiceQuestions || [];

  const [openSections, setOpenSections] = useState(() => {
    const obj = {}; sections.forEach((_, i) => { obj[i] = true; }); return obj;
  });
  const [editMode, setEditMode] = useState(false);
  const [editedSections, setEditedSections] = useState(() =>
    sections.map(s => ({ ...s, bullets: s.bullets || s.content || [] }))
  );
  const [highlights, setHighlights] = useState([]);
  const [highlightMode, setHighlightMode] = useState(false);
  const [highlightColor, setHighlightColor] = useState('#FFF176');
  const [answeredQ, setAnsweredQ] = useState({});
  const [saving, setSaving] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showConceptMap, setShowConceptMap] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [showRecallMode, setShowRecallMode] = useState(false);
  const [showGenerateDeck, setShowGenerateDeck] = useState(false);
  const [showStudyDeck, setShowStudyDeck] = useState(false);
  const [currentDeck, setCurrentDeck] = useState(null);

  const displaySections = editMode ? editedSections : sections.map(s => ({ ...s, bullets: s.bullets || s.content || [] }));

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
      const next = prev.map(s => ({ ...s, bullets: [...(s.bullets || [])] }));
      next[si].bullets[bi] = val;
      return next;
    });
  };

  async function saveEdits() {
    setSaving(true);
    const updated = { ...nd, sections: editedSections.map(s => ({ ...s, content: s.bullets })) };
    await base44.entities.StudyNote.update(note.id, { notes_data: updated });
    setSaving(false);
    setEditMode(false);
    onUpdated?.();
  }

  // Toolbar shared between normal and fullscreen
  const Toolbar = ({ isFullscreen }) => (
    <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#171717] shrink-0 flex-wrap">
      <h1 className="text-base font-semibold text-gray-900 dark:text-[#F5F5F5] flex-1 truncate min-w-0">{note.title}</h1>

      <div className={`flex items-center gap-1 border rounded-lg px-2 py-1.5 ${highlightMode ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : 'border-gray-200 dark:border-[#2A2A2A]'}`}>
        <button onClick={() => setHighlightMode(p => !p)} className={`p-1 rounded ${highlightMode ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-400 hover:text-gray-700 dark:text-[#8A8A8A] dark:hover:text-[#F5F5F5]'}`} title="Highlight">
          <Highlighter className="w-3.5 h-3.5" />
        </button>
        {highlightMode && HIGHLIGHT_COLORS.map(c => (
          <button key={c} onClick={() => setHighlightColor(c)} style={{ backgroundColor: c, width: 14, height: 14, borderRadius: 2, border: highlightColor === c ? '2px solid #374151' : '1px solid #d1d5db' }} />
        ))}
        {highlights.length > 0 && <button onClick={() => setHighlights([])} className="text-xs text-gray-400 dark:text-[#8A8A8A] hover:text-red-400 ml-1">✕</button>}
      </div>

      {editMode ? (
        <button onClick={saveEdits} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {saving ? 'Saving…' : 'Save'}
        </button>
      ) : (
        <button onClick={() => setEditMode(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-[#2A2A2A] text-gray-600 dark:text-[#B5B5B5] rounded-lg text-xs font-medium hover:border-blue-500 hover:text-gray-900 dark:hover:text-[#F5F5F5]">
          <Edit3 className="w-3.5 h-3.5" /> Edit
        </button>
      )}

      <button onClick={() => downloadNote(note)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2A2A2A] text-gray-500 dark:text-[#8A8A8A]" title="Download as PDF">
        <Download className="w-4 h-4" />
      </button>

      <button onClick={() => setFullscreen(p => !p)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2A2A2A] text-gray-500 dark:text-[#8A8A8A]" title="Fullscreen">
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>

      <button
        onClick={() => setShowRecallMode(true)}
        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold transition-colors"
      >
        <Brain className="w-3.5 h-3.5" /> Active Recall
      </button>

      <button
        onClick={() => setShowConceptMap(true)}
        className="flex items-center gap-1.5 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-semibold transition-colors"
      >
        <Network className="w-3.5 h-3.5" /> Concept Map
      </button>

      {onCreatePractice && (
        <button
          onClick={onCreatePractice}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          <Brain className="w-3.5 h-3.5" /> Create Practice
        </button>
      )}
    </div>
  );

  // The actual notes content
  const NotesContent = ({ fs }) => (
    <div
      className="flex-1 overflow-auto bg-white"
      onMouseUp={handleMouseUp}
      style={{ cursor: highlightMode ? 'crosshair' : 'default', userSelect: highlightMode ? 'text' : 'auto' }}
    >
      <div className={`mx-auto px-8 py-10 ${fs ? 'max-w-4xl text-lg' : 'max-w-2xl'}`}>

        {/* Title */}
        <h1 className={`font-bold text-gray-900 dark:text-[#F5F5F5] mb-2 leading-tight ${fs ? 'text-4xl' : 'text-2xl'}`}>{note.title}</h1>
        <div className="w-12 h-1 bg-blue-500 rounded mb-8" />

        {/* Summary */}
        {summaryBullets.length > 0 && (
          <div className={`mb-8 p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-2xl ${fs ? 'p-7' : ''}`}>
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Summary</p>
            <ul className={`space-y-2 ${fs ? 'space-y-3' : ''}`}>
              {summaryBullets.map((b, i) => (
                <li key={i} className={`flex items-start gap-2 ${fs ? 'text-base' : 'text-sm'} text-blue-900 dark:text-blue-200 leading-relaxed`}>
                  <span className="text-blue-400 shrink-0 mt-0.5">•</span>
                  <span>{applyHighlights(b, highlights)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sections */}
        {displaySections.map((sec, i) => {
          const visual = sec.hasGraph ? sec.graphType : detectVisual(sec.title, sec.bullets);
          return (
            <div key={i} className="mb-6">
              <button
                onClick={() => setOpenSections(p => ({ ...p, [i]: !p[i] }))}
                className="w-full flex items-center justify-between mb-0 group"
              >
                <h2 className={`font-semibold text-gray-900 dark:text-[#F5F5F5] group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors text-left ${fs ? 'text-2xl' : 'text-lg'}`}>
                  {sec.title}
                </h2>
                <span className="text-gray-300 group-hover:text-gray-500 ml-2 shrink-0">
                  {openSections[i] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>
              <div className="h-px bg-gray-200 dark:bg-[#2A2A2A] mt-2 mb-4" />

              {openSections[i] && (
                <div className="space-y-3 pl-1">
                  {(sec.bullets || []).map((b, j) => (
                    <div key={j} className="flex items-start gap-3">
                      <span className="text-blue-400 shrink-0 mt-1 text-xs">●</span>
                      {editMode ? (
                        <textarea value={b} onChange={e => updateBullet(i, j, e.target.value)} rows={2}
                          className={`flex-1 border border-blue-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none leading-relaxed ${fs ? 'text-base' : 'text-sm'} text-gray-700`} />
                      ) : (
                        <p className={`${fs ? 'text-base leading-loose' : 'text-sm leading-relaxed'} text-gray-700 dark:text-[#B5B5B5]`}>
                          {applyHighlights(b, highlights)}
                        </p>
                      )}
                    </div>
                  ))}
                  {visual && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <APVisuals subjectId={visual} unit={sec.title} topic={sec.title} />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Key Terms */}
        {keyTerms.length > 0 && (
          <div className="mt-10 mb-8 p-5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40 rounded-2xl">
            <h2 className={`font-bold text-indigo-800 dark:text-indigo-300 mb-4 ${fs ? 'text-2xl' : 'text-lg'}`}>Key Terms</h2>
            <div className="grid grid-cols-1 gap-3">
              {keyTerms.map((k, i) => {
                const term = typeof k === 'string' ? k : k.term;
                const def = typeof k === 'string' ? '' : k.definition;
                return (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-indigo-400 shrink-0 mt-0.5 text-xs">●</span>
                    <p className={`${fs ? 'text-base' : 'text-sm'} text-indigo-900 dark:text-indigo-200 leading-relaxed`}>
                      <span className="font-semibold">{applyHighlights(term, highlights)}</span>
                      {def && <span className="text-indigo-700 dark:text-indigo-300 font-normal">: {applyHighlights(def, highlights)}</span>}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}



        {(!displaySections.length && !summaryBullets.length) && (
          <div className="text-center py-16">
            <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No structured content found in this note.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Normal view */}
      {!fullscreen && (
        <div className="flex h-full flex-col">
          <Toolbar isFullscreen={false} />
          <NotesContent fs={false} />
        </div>
      )}

      {/* Fullscreen */}
      {fullscreen && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <Toolbar isFullscreen={true} />
          <NotesContent fs={true} />
        </div>
      )}

      {showRecallMode && (
        <ActiveRecallMode note={note} onClose={() => setShowRecallMode(false)} />
      )}

      {/* Concept Map */}
      {showConceptMap && (
        <ConceptNodeView
          note={note}
          onNodeSelect={setSelectedConcept}
          onClose={() => setShowConceptMap(false)}
        />
      )}

      {/* Generate Deck Modal */}
      {showGenerateDeck && (
        <GenerateDeckModal
          note={note}
          onClose={() => setShowGenerateDeck(false)}
          onComplete={(deck) => {
            setCurrentDeck(deck);
            setShowStudyDeck(true);
          }}
        />
      )}

      {/* Study Deck Modal */}
      {showStudyDeck && currentDeck && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <h2 className="text-base font-semibold text-gray-900">{currentDeck.name}</h2>
              <button onClick={() => setShowStudyDeck(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <APFlashcardReviewer deckId={currentDeck.id} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}