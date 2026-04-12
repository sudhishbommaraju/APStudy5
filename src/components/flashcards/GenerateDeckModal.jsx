import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Plus, X } from 'lucide-react';

export default function GenerateDeckModal({ note, onClose, onComplete }) {
  const [deckName, setDeckName] = useState(`${note.title} Cards`);
  const [generating, setGenerating] = useState(false);

  async function handleGenerateCards() {
    if (!deckName.trim()) return;
    setGenerating(true);

    try {
      const user = await base44.auth.me();

      // Create the deck
      const deck = await base44.entities.FlashcardDeck.create({
        user_email: user.email,
        name: deckName,
        subject: note.subject_id,
        subject_id: note.subject_id,
        unit_number: parseInt(note.unit_id?.match(/\d+/)?.[0] || '1'),
        unit_title: note.title,
        description: `Generated from: ${note.title}`
      });

      // Extract content from notes
      const nd = note.notes_data || {};
      const sections = nd.sections || [];
      const keyTerms = nd.keyTerms || [];

      // Build flashcard data
      const cardData = [];

      // Key terms as cards
      keyTerms.forEach(k => {
        const term = typeof k === 'string' ? k : k.term;
        const definition = typeof k === 'string' ? '' : k.definition;
        if (term) {
          cardData.push({
            front: term,
            back: definition || `Definition for ${term}`,
            category: 'Key Terms',
            difficulty: 'medium'
          });
        }
      });

      // Sections as concept cards
      sections.slice(0, 5).forEach(section => {
        const summary = section.bullets?.[0] || section.content?.[0] || '';
        if (section.title && summary) {
          cardData.push({
            front: section.title,
            back: summary,
            category: section.title,
            difficulty: 'medium'
          });
        }
      });

      // Generate additional cards if needed
      if (cardData.length < 10) {
        const notesText = [
          note.title,
          ...(Array.isArray(nd.summary) ? nd.summary : []),
          ...sections.flatMap(s => [s.title, ...(s.bullets || [])])
        ].join('\n');

        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Generate 10 AP-style flashcard pairs from these study notes. Each pair should test understanding of key concepts.

Notes:
${notesText.slice(0, 3000)}

Return JSON: { "cards": [{ "front": "question/term", "back": "answer/definition" }, ...] }`,
          response_json_schema: {
            type: 'object',
            properties: {
              cards: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    front: { type: 'string' },
                    back: { type: 'string' }
                  }
                }
              }
            }
          }
        });

        (result?.cards || []).forEach(c => {
          if (c.front && c.back && !cardData.some(cd => cd.front === c.front)) {
            cardData.push({
              front: c.front,
              back: c.back,
              category: 'Generated',
              difficulty: 'medium'
            });
          }
        });
      }

      // Bulk create flashcards
      if (cardData.length > 0) {
        await base44.entities.Flashcard.bulkCreate(
          cardData.map(card => ({
            ...card,
            deck_id: deck.id,
            mastery_level: 'new',
            times_reviewed: 0
          }))
        );
      }

      onComplete?.(deck, cardData.length);
      onClose();
    } catch (e) {
      console.error('Failed to generate cards:', e);
    }
    setGenerating(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Generate Flashcard Deck</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deck Name
            </label>
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="e.g., AP Biology Unit 1 Terms"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
            />
          </div>

          <p className="text-xs text-gray-500">
            Cards will be generated from key terms and concepts in your notes
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleGenerateCards}
              disabled={generating || !deckName.trim()}
              className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Generate Deck
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={generating}
              className="flex-1 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}