import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Trash2, Play, Plus, Loader2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import APFlashcardReviewer from './APFlashcardReviewer';

export default function APDeckManager() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [deckCardCounts, setDeckCardCounts] = useState({});

  useEffect(() => {
    loadDecks();
  }, []);

  async function loadDecks() {
    try {
      const user = await base44.auth.me();
      const userDecks = await base44.entities.FlashcardDeck.filter(
        { user_email: user.email },
        '-created_date',
        50
      );
      setDecks(userDecks || []);

      // Count cards per deck
      const counts = {};
      for (const deck of userDecks || []) {
        const cards = await base44.entities.Flashcard.filter(
          { deck_id: deck.id },
          '',
          1
        );
        const cardList = await base44.entities.Flashcard.filter(
          { deck_id: deck.id },
          'created_date',
          100
        );
        counts[deck.id] = cardList?.length || 0;
      }
      setDeckCardCounts(counts);
    } catch (e) {
      console.error('Failed to load decks:', e);
    }
    setLoading(false);
  }

  async function handleDeleteDeck(deckId) {
    if (!window.confirm('Delete this deck and all its cards?')) return;
    try {
      // Delete all cards first
      const cards = await base44.entities.Flashcard.filter(
        { deck_id: deckId },
        'created_date',
        100
      );
      for (const card of cards || []) {
        await base44.entities.Flashcard.delete(card.id);
      }
      // Delete deck
      await base44.entities.FlashcardDeck.delete(deckId);
      setDecks(prev => prev.filter(d => d.id !== deckId));
    } catch (e) {
      console.error('Failed to delete deck:', e);
    }
  }

  if (selectedDeck) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedDeck(null)}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← Back to Decks
        </button>
        <APFlashcardReviewer
          deckId={selectedDeck.id}
          deckName={selectedDeck.name}
          onClose={() => setSelectedDeck(null)}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">Flashcard Decks</h2>
        <span className="text-sm text-gray-500">{decks.length} deck{decks.length !== 1 ? 's' : ''}</span>
      </div>

      {decks.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No flashcard decks yet</p>
          <p className="text-sm text-gray-400 mt-1">Create a deck from your study notes to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map(deck => (
            <div
              key={deck.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{deck.name}</h3>
                  {deck.unit_title && (
                    <p className="text-xs text-gray-500 mt-1">{deck.unit_title}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteDeck(deck.id)}
                  className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-400 transition-colors ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-gray-700">
                  {deckCardCounts[deck.id] || 0} cards
                </span>
              </div>

              <Button
                onClick={() => setSelectedDeck(deck)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                size="sm"
              >
                <Play className="w-3.5 h-3.5 mr-2" /> Study
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}