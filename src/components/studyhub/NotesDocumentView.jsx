import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { exportNoteToPDF } from '@/utils/pdfExporter';
import {
  Download, Edit3, Check, Loader2, X, Maximize2, Minimize2,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import ActiveRecallMode from './ActiveRecallMode';
import GenerateDeckModal from '../flashcards/GenerateDeckModal';
import APFlashcardReviewer from '../flashcards/APFlashcardReviewer';
import FloatingStudyDock from './FloatingStudyDock';
import NoteBody from './NoteBody';

// ── Thin scroll progress line at very top ────────────────────────────────────
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
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: '2px', background: 'transparent' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: '#7BAE7F', transition: 'width 0.1s linear' }} />
    </div>
  );
}

// ── Minimal top chrome ────────────────────────────────────────────────────────
function NoteChrome({ note, subjectName, editMode, setEditMode, onDownload, fullscreen, setFullscreen }) {
  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(28,28,28,0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      padding: '0 1.5rem',
      height: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
        {subjectName && (
          <>
            <span style={{ fontSize: '0.72rem', color: '#555' }}>{subjectName}</span>
            <ChevronRight style={{ width: '10px', height: '10px', color: '#333', flexShrink: 0 }} />
          </>
        )}
        <span style={{
          fontSize: '0.72rem',
          color: '#888',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '320px',
        }}>
          {note.title}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
        {editMode ? (
          <button
            onClick={() => setEditMode(false)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', color: '#777', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <X style={{ width: '11px', height: '11px' }} /> Cancel
          </button>
        ) : (
          <ChromeBtn onClick={() => setEditMode(true)} title="Edit">
            <Edit3 style={{ width: '13px', height: '13px' }} />
          </ChromeBtn>
        )}
        <ChromeBtn onClick={onDownload} title="Export PDF">
          <Download style={{ width: '13px', height: '13px' }} />
        </ChromeBtn>
        <ChromeBtn onClick={() => setFullscreen(p => !p)} title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
          {fullscreen ? <Minimize2 style={{ width: '13px', height: '13px' }} /> : <Maximize2 style={{ width: '13px', height: '13px' }} />}
        </ChromeBtn>
      </div>
    </div>
  );
}

function ChromeBtn({ onClick, title, children }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '0.375rem',
        borderRadius: '6px',
        background: hover ? 'rgba(255,255,255,0.06)' : 'transparent',
        border: 'none',
        color: hover ? '#AAA' : '#555',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.12s',
      }}
    >
      {children}
    </button>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function NotesDocumentView({ note, subjectName, onUpdated, onCreatePractice, existingDeck }) {
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      background: '#1C1C1C',
      ...(fs ? { position: 'fixed', inset: 0, zIndex: 50 } : { height: '100%' }),
    }}>
      <ScrollProgress scrollEl={scrollRef} />
      <NoteChrome
        note={note}
        subjectName={subjectName}
        editMode={editMode}
        setEditMode={setEditMode}
        onDownload={() => exportNoteToPDF(note)}
        fullscreen={fs}
        setFullscreen={setFullscreen}
      />

      {/* Two-col layout: left nav rail + content */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', display: 'flex' }}>
        {/* Left navigation rail */}
        <SectionRail sections={sections} scrollEl={scrollRef} />

        {/* Main content column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <NoteBody
            note={note}
            editMode={editMode}
            editedSections={editedSections}
            onBulletChange={handleBulletChange}
            onSave={handleSave}
            saving={saving}
          />
        </div>
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
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div style={{
            background: '#111416', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', width: '100%', maxWidth: '680px', height: '80vh',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#E0DDD8' }}>{currentDeck.name}</h2>
              <ChromeBtn onClick={() => setShowStudyDeck(false)} title="Close">
                <X style={{ width: '14px', height: '14px' }} />
              </ChromeBtn>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <APFlashcardReviewer deckId={currentDeck.id} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Left section navigation rail ─────────────────────────────────────────────
function SectionRail({ sections }) {
  const [active, setActive] = useState(0);

  if (!sections || sections.length === 0) return null;

  return (
    <div style={{
      width: '200px',
      flexShrink: 0,
      borderRight: '1px solid rgba(255,255,255,0.05)',
      padding: '2rem 0',
      position: 'sticky',
      top: '44px',
      height: 'calc(100vh - 44px)',
      overflowY: 'auto',
      display: 'none', // hidden on mobile, shown on md+
    }}
      className="hidden md:block"
    >
      <p style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#444', padding: '0 1.25rem', marginBottom: '1rem' }}>
        Contents
      </p>
      {sections.map((sec, i) => (
        <button
          key={i}
          onClick={() => {
            setActive(i);
            const el = document.getElementById(`note-section-${i}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            padding: '0.45rem 1.25rem',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.76rem',
            lineHeight: 1.4,
            color: active === i ? '#7BAE7F' : '#555',
            borderLeft: active === i ? '2px solid #7BAE7F' : '2px solid transparent',
            transition: 'all 0.12s',
          }}
          onMouseEnter={e => { if (active !== i) e.currentTarget.style.color = '#888'; }}
          onMouseLeave={e => { if (active !== i) e.currentTarget.style.color = '#555'; }}
        >
          {sec.title}
        </button>
      ))}
    </div>
  );
}