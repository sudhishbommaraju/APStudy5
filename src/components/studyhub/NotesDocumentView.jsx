import React, { useState, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { exportNoteToPDF } from '@/utils/pdfExporter';
import { Download, Edit3, Check, Loader2, X, Maximize2, Minimize2, Brain, Network } from 'lucide-react';
import APVisuals from './APVisuals';
import ActiveRecallMode from './ActiveRecallMode';
import ConceptNodeView from './ConceptNodeView';
import GenerateDeckModal from '../flashcards/GenerateDeckModal';
import APFlashcardReviewer from '../flashcards/APFlashcardReviewer';
import FloatingStudyDock from './FloatingStudyDock';
import {
  SectionHeading, SmartBullet, KeyTermEntry, Divider, RichText,
  MemoryBlock, TrapBlock, FRQBlock, FormulaBlock
} from './NoteBlocks';

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

// ── Document content (reading area) ──────────────────────────────────────────
function DocumentContent({ note, editMode, editedSections, onBulletChange, onSave, saving }) {
  const nd = note.notes_data || {};
  const summaryBullets = Array.isArray(nd.summary) ? nd.summary : (nd.summary ? [nd.summary] : []);
  const sections = nd.sections || [];
  const keyTerms = nd.keyTerms || [];

  const displaySections = editMode
    ? editedSections
    : sections.map(s => ({ ...s, bullets: s.bullets || s.content || [] }));

  return (
    <article className="max-w-[820px] mx-auto px-6 md:px-10 py-14 pb-32">

      {/* Note title */}
      <header className="mb-12">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#666] mb-3">Study Notes</p>
        <h1 className="text-[2.4rem] md:text-[3rem] font-bold text-[#F0EDE8] leading-tight tracking-tight mb-4">
          {note.title}
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          {note.subject_id && (
            <span className="text-[0.72rem] font-semibold uppercase tracking-wider text-[#888] bg-[#1A1A1A] border border-[#2A2A2A] rounded-full px-3 py-1">
              {note.subject_id.replace(/_/g, ' ')}
            </span>
          )}
          {note.source_type && (
            <span className="text-[0.72rem] text-[#666]">
              {note.source_type === 'youtube' ? '📺 YouTube' : note.source_type === 'upload' ? '📄 Upload' : '✦ AI Generated'}
            </span>
          )}
        </div>
        <div className="mt-8 h-px bg-gradient-to-r from-[#2A2A2A] via-[#3A3A3A] to-transparent" />
      </header>

      {/* Overview / Summary */}
      {summaryBullets.length > 0 && (
        <section className="mb-10">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#5B7FA6] mb-4">Overview</p>
          <div className="space-y-0">
            {summaryBullets.map((b, i) => (
              <div key={i} className="flex items-start gap-3 py-2.5 border-b border-[#181818] last:border-0">
                <span className="text-[#5B7FA6] text-xs mt-[5px] shrink-0">→</span>
                <p className="text-[0.9375rem] text-[#B8B2AA] leading-[1.75]"><RichText text={b} /></p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sections */}
      {displaySections.map((sec, i) => {
        const bullets = sec.bullets || sec.content || [];
        const visual = sec.hasGraph ? sec.graphType : detectVisual(sec.title, bullets);
        return (
          <section key={i} className="mb-2">
            <SectionHeading index={i}>{sec.title}</SectionHeading>
            <div className="space-y-0 pl-8">
              {bullets.map((b, j) =>
                editMode ? (
                  <textarea
                    key={j}
                    value={b}
                    onChange={e => onBulletChange(i, j, e.target.value)}
                    rows={2}
                    className="w-full my-1.5 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-[0.875rem] text-[#C8C3BB] focus:outline-none focus:border-[#4A4A4A] resize-none leading-relaxed"
                  />
                ) : (
                  <SmartBullet key={j} text={b} />
                )
              )}
              {visual && !editMode && (
                <div className="mt-5 mb-3">
                  <APVisuals subjectId={visual} unit={sec.title} topic={sec.title} />
                </div>
              )}
            </div>
          </section>
        );
      })}

      {/* Key Terms */}
      {keyTerms.length > 0 && (
        <>
          <Divider />
          <section>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#888] mb-5">Key Terms</p>
            <div>
              {keyTerms.map((k, i) => {
                const term = typeof k === 'string' ? k : k.term;
                const def = typeof k === 'string' ? '' : k.definition;
                return <KeyTermEntry key={i} term={term} definition={def} />;
              })}
            </div>
          </section>
        </>
      )}

      {/* Empty state */}
      {!displaySections.length && !summaryBullets.length && (
        <div className="text-center py-24">
          <p className="text-[#444] text-sm">No structured content found.</p>
        </div>
      )}

      {/* Edit save button if in edit mode */}
      {editMode && (
        <div className="sticky bottom-20 left-0 right-0 flex justify-center mt-8">
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#1A3A2A] border border-[#2A5A3A] text-[#5BC87A] rounded-full text-sm font-semibold hover:bg-[#1E4A30] transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}
    </article>
  );
}

// ── Top minimal bar ──────────────────────────────────────────────────────────
function NoteTopBar({ note, editMode, setEditMode, onDownload, fullscreen, setFullscreen }) {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-[#1C1C1C] bg-[#0E0E0E] shrink-0">
      <p className="text-[0.8rem] text-[#666] truncate max-w-[300px]" title={note.title}>{note.title}</p>
      <div className="flex items-center gap-1">
        {editMode ? (
          <button
            onClick={() => setEditMode(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[0.75rem] text-[#888] hover:text-[#BBB] transition-colors"
          >
            <X className="w-3 h-3" /> Cancel
          </button>
        ) : (
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[0.75rem] text-[#666] hover:text-[#AAA] transition-colors"
          >
            <Edit3 className="w-3 h-3" /> Edit
          </button>
        )}
        <button
          onClick={onDownload}
          className="p-2 rounded-lg hover:bg-[#1A1A1A] text-[#555] hover:text-[#AAA] transition-colors"
          title="Export PDF"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setFullscreen(p => !p)}
          className="p-2 rounded-lg hover:bg-[#1A1A1A] text-[#555] hover:text-[#AAA] transition-colors"
          title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────
export default function NotesDocumentView({ note, onUpdated, onCreatePractice, existingDeck }) {
  const nd = note.notes_data || {};
  const sections = nd.sections || [];

  const [editMode, setEditMode] = useState(false);
  const [editedSections, setEditedSections] = useState(() =>
    sections.map(s => ({ ...s, bullets: s.bullets || s.content || [] }))
  );
  const [saving, setSaving] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showRecall, setShowRecall] = useState(false);
  const [showConceptMap, setShowConceptMap] = useState(false);
  const [showGenerateDeck, setShowGenerateDeck] = useState(false);
  const [showStudyDeck, setShowStudyDeck] = useState(false);
  const [currentDeck, setCurrentDeck] = useState(null);

  const handleBulletChange = (si, bi, val) => {
    setEditedSections(prev => {
      const next = prev.map(s => ({ ...s, bullets: [...(s.bullets || [])] }));
      next[si].bullets[bi] = val;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const updated = { ...nd, sections: editedSections.map(s => ({ ...s, content: s.bullets })) };
    await base44.entities.StudyNote.update(note.id, { notes_data: updated });
    setSaving(false);
    setEditMode(false);
    onUpdated?.();
  };

  const Inner = ({ fs }) => (
    <div className={`flex flex-col ${fs ? 'fixed inset-0 z-50' : 'h-full'} bg-[#0C0C0C]`}>
      <NoteTopBar
        note={note}
        editMode={editMode}
        setEditMode={setEditMode}
        onDownload={() => exportNoteToPDF(note)}
        fullscreen={fs}
        setFullscreen={setFullscreen}
      />
      <div className="flex-1 overflow-y-auto scroll-smooth">
        <DocumentContent
          note={note}
          editMode={editMode}
          editedSections={editedSections}
          onBulletChange={handleBulletChange}
          onSave={handleSave}
          saving={saving}
        />
      </div>
      <FloatingStudyDock
        onPractice={onCreatePractice}
        onFlashcards={() => setShowGenerateDeck(true)}
        onRecall={() => setShowRecall(true)}
        onAudio={() => {}}
      />
    </div>
  );

  return (
    <>
      <Inner fs={fullscreen} />

      {showRecall && (
        <ActiveRecallMode note={note} onClose={() => setShowRecall(false)} />
      )}

      {showConceptMap && (
        <ConceptNodeView
          note={note}
          onNodeSelect={() => {}}
          onClose={() => setShowConceptMap(false)}
        />
      )}

      {showGenerateDeck && (
        <GenerateDeckModal
          note={note}
          onClose={() => setShowGenerateDeck(false)}
          onComplete={(deck) => {
            setCurrentDeck(deck);
            setShowGenerateDeck(false);
            setShowStudyDeck(true);
          }}
        />
      )}

      {showStudyDeck && currentDeck && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#2A2A2A] rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E1E1E] shrink-0">
              <h2 className="text-sm font-semibold text-[#E0E0E0]">{currentDeck.name}</h2>
              <button onClick={() => setShowStudyDeck(false)} className="p-1.5 rounded-lg hover:bg-[#1E1E1E] text-[#666]">
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