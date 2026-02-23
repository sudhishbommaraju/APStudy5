import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const MASTERY_LEVELS = {
  new: { next: 'learning', days: 0 },
  learning: { next: 'familiar', days: 1 },
  familiar: { next: 'mastered', days: 3 },
  mastered: { next: 'mastered', days: 7 }
};

export default function FlashcardReview({ deck }) {
  const [cards, setCards] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    loadCards();
  }, [deck?.id]);

  const loadCards = async () => {
    try {
      const deckCards = await base44.entities.Flashcard.filter({
        deck_id: deck.id
      });

      // Filter for cards due for review (spaced repetition)
      const now = new Date();
      const dueCards = deckCards.filter(card => {
        if (!card.next_review) return true;
        return new Date(card.next_review) <= now;
      });

      setCards(dueCards);
      setCurrentIdx(0);
      setIsFlipped(false);
    } catch (error) {
      toast.error('Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  const handleMastery = async (level, isCorrect) => {
    if (currentIdx >= cards.length) return;

    const card = cards[currentIdx];
    const newLevel = MASTERY_LEVELS[card.mastery_level]?.next || 'mastered';
    const nextReviewDays = MASTERY_LEVELS[newLevel]?.days || 7;

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + nextReviewDays);

    try {
      await base44.entities.Flashcard.update(card.id, {
        mastery_level: newLevel,
        times_reviewed: (card.times_reviewed || 0) + 1,
        last_reviewed: new Date().toISOString(),
        next_review: nextReviewDate.toISOString().split('T')[0]
      });

      setCompletedCount(completedCount + 1);

      if (currentIdx < cards.length - 1) {
        setCurrentIdx(currentIdx + 1);
        setIsFlipped(false);
      } else {
        toast.success('Deck review complete!');
        loadCards();
      }
    } catch (error) {
      toast.error('Failed to update card');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-400 mb-4">No cards due for review</p>
        <p className="text-sm text-neutral-500">Check back later or create new cards</p>
      </div>
    );
  }

  const current = cards[currentIdx];
  const progress = ((completedCount + 1) / cards.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-300">{completedCount + 1} / {cards.length}</span>
          <span className="text-neutral-500">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-neutral-800 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          onClick={() => setIsFlipped(!isFlipped)}
          className="relative h-64 cursor-pointer perspective"
        >
          <motion.div
            initial={false}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            style={{ transformStyle: 'preserve-3d' }}
            className="w-full h-full"
          >
            {/* Front */}
            <div
              style={{ backfaceVisibility: 'hidden' }}
              className="absolute w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/50 rounded-lg p-8 flex flex-col items-center justify-center"
            >
              <p className="text-neutral-500 text-sm mb-4 uppercase tracking-wider">Question</p>
              <p className="text-white text-2xl font-semibold text-center">{current.front}</p>
              <p className="text-neutral-500 text-xs mt-8">Click to reveal answer</p>
            </div>

            {/* Back */}
            <div
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              className="absolute w-full h-full bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/50 rounded-lg p-8 flex flex-col items-center justify-center"
            >
              <p className="text-neutral-500 text-sm mb-4 uppercase tracking-wider">Answer</p>
              <p className="text-white text-2xl font-semibold text-center">{current.back}</p>
              <p className="text-neutral-500 text-xs mt-8">Click to flip back</p>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      {isFlipped && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3"
        >
          <Button
            onClick={() => handleMastery('incorrect', false)}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            <X className="w-4 h-4 mr-2" />
            Incorrect
          </Button>
          <Button
            onClick={() => handleMastery('correct', true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="w-4 h-4 mr-2" />
            Correct
          </Button>
        </motion.div>
      )}

      {/* Mastery Level */}
      <div className="text-center">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
          current.mastery_level === 'new' ? 'bg-gray-600/30 text-gray-300' :
          current.mastery_level === 'learning' ? 'bg-yellow-600/30 text-yellow-300' :
          current.mastery_level === 'familiar' ? 'bg-blue-600/30 text-blue-300' :
          'bg-green-600/30 text-green-300'
        }`}>
          {current.mastery_level.charAt(0).toUpperCase() + current.mastery_level.slice(1)}
        </span>
      </div>
    </div>
  );
}