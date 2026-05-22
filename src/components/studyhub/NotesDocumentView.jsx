import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { exportNoteToPDF } from '@/utils/pdfExporter';
import { Download, Edit3, Check, Loader2, X, Maximize2, Minimize2, Clock, BookOpen } from 'lucide-react';
import ActiveRecallMode from './ActiveRecallMode';
import GenerateDeckModal from '../flashcards/GenerateDeckModal';
import APFlashcardReviewer from '../flashcards/APFlashcardReviewer';
import FloatingStudyDock from './FloatingStudyDock';
import NoteBody from './NoteBody';

// ── Scroll progress bar ───────────────────────────────────────────────────────
function ScrollProgress({ scrollEl }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const el = scrollEl?.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      setPct(max > 0 ? (el.scrollTop / max) * 100 : 0);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollEl]);
  return (
    <div className="h-[2px] w-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
      <div
        className="h-full transition-all duration-100"
        style={{ width: `${pct}%`, background: '#7BAE7F' }}
      />
    </div>
  );
}

// ── Minimal top bar ───────────────────────────────────────────────────────────
function NoteTopBar({ note, editMode, setEditMode, onDownload, fullscreen, setFullscreen, scrollEl }) {
  return (
    <div className="shrink-0" style={{ background: '#0D1012', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between px-5 py-3">
        <p className="text-[0.78rem] truncate max-w-[280px]" style={{ color: '#6A7070' }} title={note.title}>
          {note.title}
        </p>
        <div className="flex items-center gap-1">
          {editMode ? (
            <button
              onClick={() => setEditMode(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.72rem] transition-colors"
              style={{ color: '#888' }}
            >
              <X className="w-3 h-3" /> Cancel
            </button>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.72rem] transition-colors"
              style={{ color: '#666' }}
              onMouseEnter={e => e.currentTarget.style.color = '#AAA'}
              onMouseLeave={e => e.currentTarget.style.color = '#666'}
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          )}
          <button
            onClick={onDownload}
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#555' }}
            title="Export PDF"
            onMouseEnter={e => e.currentTarget.style.color = '#AAA'}
            onMouseLeave={e => e.currentTarget.style.color = '#555'}
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setFullscreen(p => !p)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#555' }}
            title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            onMouseEnter={e => e.currentTarget.style.color = '#AAA'}
            onMouseLeave={e => e.currentTarget.style.color = '#555'}
          >
            {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      <ScrollProgress scrollEl={scrollEl} />
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
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
  const [showGenerateDeck, setShowGenerateDeck] = useState(false);
  const [showStudyDeck, setShowStudyDeck] = useState(false);
  const [currentDeck, setCurrentDeck] = useState(null);

  const scrollRef = useRef(null);

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
    <div
      className={`flex flex-col ${fs ? 'fixed inset-0 z-50' : 'h-full'}`}
      style={{ background: '#0B0D0E' }}
    >
      <NoteTopBar
        note={note}
        editMode={editMode}
        setEditMode={setEditMode}
        onDownload={() => exportNoteToPDF(note)}
        fullscreen={fs}
        setFullscreen={setFullscreen}
        scrollEl={scrollRef}
      />
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <NoteBody
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
          <div
            className="rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] overflow-hidden flex flex-col"
            style={{ background: '#111416', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <h2 className="text-sm font-semibold" style={{ color: '#E0DDD8' }}>{currentDeck.name}</h2>
              <button
                onClick={() => setShowStudyDeck(false)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: '#666' }}
                onMouseEnter={e => e.currentTarget.style.color = '#AAA'}
                onMouseLeave={e => e.currentTarget.style.color = '#666'}
              >
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