import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, RotateCcw, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function APFlashcardReviewer({ deckId, deckName, onClose }) {
  const [cards, setCards] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [masteryTracking, setMasteryTracking] = useState({});

  useEffect(() => {
    loadCards();
  }, [deckId]);

  async function loadCards() {
    try {
      const allCards = await base44.entities.Flashcard.filter(
        { deck_id: deckId },
        'created_date',
        100
      );
      setCards(allCards || []);
      setCardIndex(0);
      setIsFlipped(false);
    } catch (e) {
      console.error('Failed to load cards:', e);
    }
    setLoading(false);
  }

  async function updateMastery(masteryLevel) {
    if (cards.length === 0 || cardIndex >= cards.length) return;
    const card = cards[cardIndex];

    await base44.entities.Flashcard.update(card.id, {
      mastery_level: masteryLevel,
      times_reviewed: (card.times_reviewed || 0) + 1,
      last_reviewed: new Date().toISOString()
    });

    setMasteryTracking(prev => ({
      ...prev,
      [card.id]: masteryLevel
    }));

    // Move to next card
    if (cardIndex < cards.length - 1) {
      setCardIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <BookOpen className="w-8 h-8 text-gray-300 animate-pulse" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="bg-gray-50 rounded-2xl p-12 text-center">
        <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No flashcards in this deck yet</p>
      </div>
    );
  }

  const card = cards[cardIndex];
  const progress = Math.round(((cardIndex + 1) / cards.length) * 100);

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 font-medium">{deckName || 'Flashcards'}</span>
          <span className="text-gray-400">{cardIndex + 1} / {cards.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="h-80 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200 flex items-center justify-center cursor-pointer transition-transform hover:scale-[1.02] relative overflow-hidden"
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
          <p className="text-xs uppercase tracking-widest text-blue-600 font-semibold mb-4">
            {isFlipped ? 'Answer' : 'Question'}
          </p>
          <p className="text-2xl font-bold text-gray-900 leading-tight">
            {isFlipped ? card.back : card.front}
          </p>
          <p className="text-xs text-blue-500 mt-8">Click to flip</p>
        </div>
      </div>

      {/* Mastery buttons (only show after flip) */}
      {isFlipped && (
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            onClick={() => updateMastery('learning')}
            className="text-sm"
          >
            🤔 Learning
          </Button>
          <Button
            variant="outline"
            onClick={() => updateMastery('familiar')}
            className="text-sm"
          >
            👍 Familiar
          </Button>
          <Button
            variant="outline"
            onClick={() => updateMastery('mastered')}
            className="bg-green-50 text-green-700 border-green-300 hover:bg-green-100 text-sm"
          >
            ✓ Mastered
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 justify-between">
        <Button
          variant="outline"
          onClick={() => {
            setCardIndex(prev => Math.max(0, prev - 1));
            setIsFlipped(false);
          }}
          disabled={cardIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            setCardIndex(0);
            setIsFlipped(false);
          }}
          className="text-xs"
        >
          <RotateCcw className="w-3 h-3 mr-1" /> Restart
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            setCardIndex(prev => Math.min(cards.length - 1, prev + 1));
            setIsFlipped(false);
          }}
          disabled={cardIndex === cards.length - 1}
        >
          Next <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Stats */}
      <div className="text-center text-xs text-gray-500">
        {cardIndex === cards.length - 1 && (
          <Button onClick={onClose} className="w-full mt-4">
            Done
          </Button>
        )}
      </div>
    </div>
  );
}