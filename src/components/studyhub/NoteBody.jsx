import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import {
  NoteHeroHeader,
  NoteSection,
  KeyTermsSection,
  NoteDivider,
} from './NoteLayout';

/**
 * NoteBody — the main reading surface of a study note.
 * Renders the hero header, structured sections, and key terms.
 */
export default function NoteBody({ note, editMode, editedSections, onBulletChange, onSave, saving }) {
  const nd = note.notes_data || {};
  const summaryBullets = Array.isArray(nd.summary)
    ? nd.summary
    : nd.summary
    ? [nd.summary]
    : [];
  const sections = nd.sections || [];
  const keyTerms = nd.keyTerms || [];

  const displaySections = editMode
    ? editedSections
    : sections.map(s => ({ ...s, bullets: s.bullets || s.content || [] }));

  const hasContent = displaySections.length > 0 || summaryBullets.length > 0;

  return (
    <article
      style={{
        maxWidth: '760px',
        margin: '0 auto',
        padding: '3.5rem 2rem 7rem',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Hero header */}
      <NoteHeroHeader note={note} summaryBullets={summaryBullets} />

      {/* Sections */}
      {displaySections.map((sec, i) => (
        <NoteSection
          key={i}
          section={sec}
          index={i}
          editMode={editMode}
          onBulletChange={(bi, val) => onBulletChange(i, bi, val)}
        />
      ))}

      {/* Key Terms */}
      {keyTerms.length > 0 && (
        <>
          <NoteDivider />
          <KeyTermsSection keyTerms={keyTerms} />
        </>
      )}

      {/* Empty state */}
      {!hasContent && (
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
          <p style={{ color: '#555', fontSize: '0.875rem' }}>No structured content found.</p>
        </div>
      )}

      {/* Edit save */}
      {editMode && (
        <div className="sticky bottom-20 flex justify-center mt-10">
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all"
            style={{
              background: 'rgba(123,174,127,0.14)',
              border: '1px solid rgba(123,174,127,0.3)',
              color: '#7BAE7F',
            }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}
    </article>
  );
}