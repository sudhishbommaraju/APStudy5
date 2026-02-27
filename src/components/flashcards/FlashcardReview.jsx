import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import FlashcardTutor from './FlashcardTutor';

// SuperMemo 2 — easiness factor per card, stored in `sm2_ef` field
// Performance rating: 0=again, 1=hard, 2=good, 3=easy
function sm2(card, rating) {
  const ef = Math.max(1.3, (card.sm2_ef || 2.5) + (0.1 - (3 - rating) * (0.08 + (3 - rating) * 0.02)));
  const reps = rating < 1 ? 0 : (card.sm2_reps || 0) + 1;
  let interval = 1;
  if (reps === 1) interval = 1;
  else if (reps === 2) interval = 6;
  else interval = Math.round((card.sm2_interval || 1) * ef);

  const masteryMap = interval >= 21 ? 'mastered' : interval >= 7 ? 'familiar' : interval >= 2 ? 'learning' : 'new';

  return { ef, reps, interval, mastery_level: masteryMap };
}

export default function FlashcardReview({ deck }) {
  const [cards, setCards] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [eliminatedChoices, setEliminatedChoices] = useState(new Set());

  useEffect(() => {
    loadCards();
  }, [deck?.id]);

  const loadCards = async () => {
    try {
      const deckCards = await base44.entities.Flashcard.filter({
        deck_id: deck.id
      });

      // Convert to MCQ format with distractors
      const mcqCards = deckCards.map(card => {
        const distractors = deckCards
          .filter(c => c.id !== card.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(c => c.back);
        
        const allOptions = [card.back, ...distractors].sort(() => Math.random() - 0.5);
        const correctIndex = allOptions.indexOf(card.back);
        
        return {
          ...card,
          options: allOptions,
          correctIndex
        };
      });

      setCards(mcqCards);
      setCurrentIdx(0);
      setSelectedIndex(null);
      setIsSubmitted(false);
      setIsCorrect(null);
    } catch (error) {
      toast.error('Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (selectedIndex === null) return;
    
    const card = cards[currentIdx];
    const correct = selectedIndex === card.correctIndex;
    
    setIsCorrect(correct);
    setIsSubmitted(true);
    
    if (correct) {
      setScore(score + 1);
    }
  };

  const toggleEliminate = (idx, e) => {
    e.stopPropagation();
    if (isSubmitted) return;
    
    const newEliminated = new Set(eliminatedChoices);
    if (newEliminated.has(idx)) {
      newEliminated.delete(idx);
    } else {
      newEliminated.add(idx);
    }
    setEliminatedChoices(newEliminated);
  };

  const handleNext = async () => {
    const card = cards[currentIdx];
    // SM2 rating: correct=3(easy), incorrect=0(again)
    const rating = isCorrect ? 3 : 0;
    const { ef, reps, interval, mastery_level } = sm2(card, rating);

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    try {
      await base44.entities.Flashcard.update(card.id, {
        mastery_level,
        times_reviewed: (card.times_reviewed || 0) + 1,
        last_reviewed: new Date().toISOString(),
        next_review: nextReviewDate.toISOString().split('T')[0],
        sm2_ef: ef,
        sm2_reps: reps,
        sm2_interval: interval
      });

      if (currentIdx < cards.length - 1) {
        setCurrentIdx(currentIdx + 1);
        setSelectedIndex(null);
        setIsSubmitted(false);
        setIsCorrect(null);
        setEliminatedChoices(new Set());
      } else {
        toast.success(`Deck complete! Score: ${score + (isCorrect ? 1 : 0)}/${cards.length}`);
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
  const progress = ((currentIdx + 1) / cards.length) * 100;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Question Panel - 60% on desktop */}
      <div className="flex-1 lg:w-[60%] space-y-6">
      {/* Progress and Score */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-neutral-300 font-medium">Question {currentIdx + 1} of {cards.length}</span>
          <span className="text-blue-400 font-semibold">Score: {score}/{cards.length}</span>
        </div>
        <div className="w-full bg-neutral-800 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-neutral-900 border border-neutral-800 rounded-xl p-8"
        >
          <p className="text-neutral-400 text-sm mb-4 uppercase tracking-wider">Question</p>
          <p className="text-white text-2xl font-semibold mb-8">{current.front}</p>

          {/* Answer Options */}
          <div className="space-y-3">
            {current.options.map((option, idx) => {
              const isSelected = selectedIndex === idx;
              const isCorrectChoice = idx === current.correctIndex;
              const showCorrect = isSubmitted && isCorrectChoice;
              const showIncorrect = isSubmitted && isSelected && !isCorrect;
              const isEliminated = eliminatedChoices.has(idx);

              return (
                <div key={idx} className="relative group">
                  <button
                    onClick={() => !isSubmitted && setSelectedIndex(idx)}
                    disabled={isSubmitted}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      showCorrect
                        ? 'bg-green-900/20 border-green-600'
                        : showIncorrect
                        ? 'bg-red-900/20 border-red-600'
                        : isSelected
                        ? 'bg-blue-900/20 border-blue-600'
                        : isEliminated
                        ? 'bg-neutral-950/50 border-neutral-800'
                        : 'bg-neutral-800 border-neutral-700 hover:border-neutral-600'
                    } ${isSubmitted ? 'cursor-default' : 'cursor-pointer'} ${
                      isEliminated ? 'opacity-40' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-base ${
                        showCorrect || showIncorrect ? 'text-white font-medium' : 'text-neutral-200'
                      } ${isEliminated ? 'line-through' : ''}`}>
                        {option}
                      </span>
                      {showCorrect && <Check className="w-5 h-5 text-green-500" />}
                      {showIncorrect && <X className="w-5 h-5 text-red-500" />}
                    </div>
                  </button>
                  
                  {!isSubmitted && (
                    <button
                      onClick={(e) => toggleEliminate(idx, e)}
                      className={`absolute top-3 right-3 p-1.5 rounded-lg transition-all ${
                        isEliminated
                          ? 'bg-red-600/20 text-red-400'
                          : 'bg-neutral-800/0 group-hover:bg-neutral-800 text-neutral-500 hover:text-red-400'
                      }`}
                      title={isEliminated ? 'Un-eliminate' : 'Eliminate choice'}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Submit/Next Button */}
      <div className="flex items-center justify-between">
        {!isSubmitted ? (
          <Button
            onClick={handleSubmit}
            disabled={selectedIndex === null}
            className="bg-blue-600 hover:bg-blue-700 w-full"
            size="lg"
          >
            Submit Answer
          </Button>
        ) : (
          <>
            <div className={`px-4 py-2 rounded-lg font-medium ${
              isCorrect ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
            }`}>
              {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
            </div>
            <Button
              onClick={handleNext}
              className="bg-white hover:bg-neutral-100 text-black"
              size="lg"
            >
              {currentIdx < cards.length - 1 ? 'Next Question' : 'Finish Review'}
            </Button>
          </>
        )}
      </div>

        {/* Mastery Level Badge */}
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

      {/* Tutor Panel - 40% on desktop */}
      <div className="lg:w-[40%] bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <FlashcardTutor 
          question={current.front} 
          isSubmitted={isSubmitted}
        />
      </div>
    </div>
  );
}