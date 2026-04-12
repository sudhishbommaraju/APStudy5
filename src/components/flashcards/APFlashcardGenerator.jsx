import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function APFlashcardGenerator({ note, onComplete }) {
  const [deckName, setDeckName] = useState(`${note.title} Cards`);
  const [generating, setGenerating] = useState(false);
  const [cardsCreated, setCardsCreated] = useState(0);

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

      // Key terms as cards (term = front, definition = back)
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

      // If not enough cards, use LLM to generate more
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
        setCardsCreated(cardData.length);
      }

      onComplete?.(deck, cardData.length);
    } catch (e) {
      console.error('Failed to generate cards:', e);
    }
    setGenerating(false);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Create Flashcard Deck</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deck Name
          </label>
          <input
            type="text"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder="e.g., AP Biology Unit 1 Terms"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <p className="text-sm text-gray-500">
          {cardsCreated > 0
            ? `✓ Created ${cardsCreated} cards from this note`
            : 'Cards will be generated from key terms and concepts in your notes'}
        </p>

        <Button
          onClick={handleGenerateCards}
          disabled={generating || !deckName.trim() || cardsCreated > 0}
          className="w-full"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Deck...
            </>
          ) : cardsCreated > 0 ? (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Deck Created
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Generate Cards
            </>
          )}
        </Button>
      </div>
    </div>
  );
}