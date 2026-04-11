import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Shuffle, Play, Pause, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import FlipCard from './FlipCard';

// SM-2 minimal — persists mastery and next_review
function sm2Update(card, correct) {
  const ef = Math.max(1.3, (card.sm2_ef || 2.5) + (correct ? 0.1 : -0.3));
  const reps = correct ? (card.sm2_reps || 0) + 1 : 0;
  let interval = 1;
  if (reps === 1) interval = 1;
  else if (reps === 2) interval = 6;
  else interval = Math.round((card.sm2_interval || 1) * ef);
  const mastery = interval >= 21 ? 'mastered' : interval >= 7 ? 'familiar' : interval >= 2 ? 'learning' : 'new';
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);
  return { sm2_ef: ef, sm2_reps: reps, sm2_interval: interval, mastery_level: mastery, next_review: nextDate.toISOString().split('T')[0] };
}

export default function DeckFlashcardReview({ deck, onBack }) {
  const [cards, setCards] = useState([]);
  const [order, setOrder] = useState([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [shuffled, setShuffled] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoInterval, setAutoInterval] = useState(null);

  useEffect(() => {
    loadCards();
    return () => { if (autoInterval) clearInterval(autoInterval); };
  }, [deck?.id]);

  const loadCards = async () => {
    setLoading(true);
    try {
      const raw = await base44.entities.Flashcard.filter({ deck_id: deck.id });
      setCards(raw);
      setOrder(raw.map((_, i) => i));
      setIdx(0);
    } catch {
      toast.error('Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  const currentCard = cards[order[idx]] || null;

  const goNext = useCallback(() => {
    setIdx(i => (i + 1) % order.length);
  }, [order.length]);

  const goPrev = () => {
    setIdx(i => (i - 1 + order.length) % order.length);
  };

  const toggleShuffle = () => {
    if (!shuffled) {
      const newOrder = [...order].sort(() => Math.random() - 0.5);
      setOrder(newOrder);
      setIdx(0);
      setShuffled(true);
    } else {
      setOrder(cards.map((_, i) => i));
      setIdx(0);
      setShuffled(false);
    }
  };

  const toggleAutoPlay = () => {
    if (autoPlay) {
      clearInterval(autoInterval);
      setAutoInterval(null);
      setAutoPlay(false);
    } else {
      const iv = setInterval(goNext, 4000);
      setAutoInterval(iv);
      setAutoPlay(true);
    }
  };

  const markCard = async (correct) => {
    if (!currentCard) return;
    const update = sm2Update(currentCard, correct);
    try {
      await base44.entities.Flashcard.update(currentCard.id, {
        ...update,
        times_reviewed: (currentCard.times_reviewed || 0) + 1,
        last_reviewed: new Date().toISOString()
      });
      setCards(prev => prev.map(c => c.id === currentCard.id ? { ...c, ...update } : c));
    } catch {
      // silent
    }
    goNext();
  };

  const restart = () => {
    setIdx(0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#D6B98C]" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-20 text-neutral-400">
        No cards in this deck yet.
      </div>
    );
  }

  const progress = ((idx + 1) / order.length) * 100;
  const unitLabel = deck.unit_number && deck.unit_title
    ? `Unit ${deck.unit_number}: ${deck.unit_title}`
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <button onClick={onBack} className="text-gray-400 hover:text-gray-900 text-sm mb-2 transition-colors">
          ← Back to Decks
        </button>
        {deck.subject && (
          <p className="text-blue-500 text-sm font-medium">{deck.subject}</p>
        )}
        {unitLabel && (
          <h2 className="text-gray-900 text-xl font-semibold">{unitLabel}</h2>
        )}
        <h1 className="text-gray-900 text-2xl font-light mt-1">{deck.name}</h1>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-neutral-500 mb-1">
          <span>{idx + 1} / {order.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flip Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={order[idx]}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
        >
          {currentCard && (
            <FlipCard
              cardKey={`${deck.id}_${order[idx]}`}
              front={currentCard.front}
              back={currentCard.back}
              image={currentCard.optional_image}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="icon" onClick={goPrev}>
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex gap-2 flex-1 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => markCard(false)}
            className="border-red-800 text-red-400 hover:bg-red-900/20 flex-1 max-w-[120px]"
          >
            Again
          </Button>
          <Button
            size="sm"
            onClick={() => markCard(true)}
            className="bg-green-700 hover:bg-green-600 text-white flex-1 max-w-[120px]"
          >
            Got it
          </Button>
        </div>

        <Button variant="outline" size="icon" onClick={goNext}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleShuffle}
          className={shuffled ? 'text-blue-500' : 'text-gray-400'}
        >
          <Shuffle className="w-4 h-4 mr-1" />
          {shuffled ? 'Ordered' : 'Shuffle'}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleAutoPlay}
          className={autoPlay ? 'text-blue-500' : 'text-gray-400'}
        >
          {autoPlay ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
          {autoPlay ? 'Pause' : 'Auto-play'}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={restart}
          className="text-gray-400"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Restart
        </Button>
      </div>

      {/* Mastery badge */}
      {currentCard && (
        <div className="text-center">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            currentCard.mastery_level === 'mastered' ? 'bg-green-100 text-green-700' :
            currentCard.mastery_level === 'familiar' ? 'bg-blue-100 text-blue-700' :
            currentCard.mastery_level === 'learning' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-500'
          }`}>
            {(currentCard.mastery_level || 'new').charAt(0).toUpperCase() + (currentCard.mastery_level || 'new').slice(1)}
          </span>
        </div>
      )}
    </div>
  );
}