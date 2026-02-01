import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Check, X, Lightbulb, Trophy, Flame, Star } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import confetti from 'canvas-confetti';

export default function EnhancedFlashcardReview({ 
  cards, 
  reviewMode = 'flip',
  onComplete,
  onCardReview 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  // Generate multiple choice options
  const generateChoices = (correctAnswer) => {
    const choices = [correctAnswer];
    const wrongAnswers = cards
      .filter(c => c.id !== currentCard.id)
      .map(c => c.back)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    choices.push(...wrongAnswers);
    return choices.sort(() => Math.random() - 0.5);
  };

  const [mcChoices, setMcChoices] = useState([]);

  useEffect(() => {
    if (reviewMode === 'multiple_choice' && currentCard) {
      setMcChoices(generateChoices(currentCard.back));
    }
  }, [currentIndex, reviewMode]);

  const handleFlip = () => {
    setShowAnswer(!showAnswer);
  };

  const handleKnowIt = async () => {
    const quality = 5;
    const newPoints = 10;
    const newStreak = streak + 1;
    
    setStreak(newStreak);
    setPoints(points + newPoints);
    setSessionCorrect(sessionCorrect + 1);
    
    if (newStreak % 5 === 0) {
      confetti({ particleCount: 100, spread: 70 });
    }

    await onCardReview(currentCard, {
      result: 'correct',
      quality,
      time_spent: 0,
      confidence: quality
    });

    nextCard();
  };

  const handleDontKnowIt = async () => {
    setStreak(0);
    
    await onCardReview(currentCard, {
      result: 'incorrect',
      quality: 1,
      time_spent: 0,
      confidence: 1
    });

    nextCard();
  };

  const handleTypeSubmit = () => {
    const isCorrect = userAnswer.toLowerCase().trim() === currentCard.back.toLowerCase().trim();
    
    if (isCorrect) {
      handleKnowIt();
    } else {
      setShowAnswer(true);
    }
  };

  const handleMCSubmit = async () => {
    const isCorrect = selectedChoice === currentCard.back;
    
    if (isCorrect) {
      const quality = 4;
      setStreak(streak + 1);
      setPoints(points + 8);
      setSessionCorrect(sessionCorrect + 1);
      
      await onCardReview(currentCard, {
        result: 'correct',
        quality,
        time_spent: 0,
        confidence: quality
      });
    } else {
      setStreak(0);
      await onCardReview(currentCard, {
        result: 'incorrect',
        quality: 2,
        time_spent: 0,
        confidence: 2
      });
    }

    nextCard();
  };

  const nextCard = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
      setUserAnswer('');
      setSelectedChoice(null);
    } else {
      onComplete({
        totalCards: cards.length,
        correct: sessionCorrect,
        points,
        streak
      });
    }
  };

  if (!currentCard) return null;

  return (
    <div className="fixed inset-0 bg-[#F8FAFC] z-50 overflow-y-auto smooth-transition">
      {/* Header Stats */}
      <div className="sticky top-0 bg-white border-b border-[#CBD5E1] px-6 py-4 z-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Flame className={cn("w-5 h-5", streak > 0 ? "text-[#DC2626]" : "text-[#CBD5E1]")} />
                <span className="text-sm font-semibold text-[#000000]">{streak} Streak</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-[#D97706]" />
                <span className="text-sm font-semibold text-[#000000]">{points} pts</span>
              </div>
            </div>
            <span className="text-sm text-[#404040]">
              {currentIndex + 1} / {cards.length}
            </span>
          </div>
          <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#1E3A8A] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-lg p-8 mb-6 min-h-[400px] flex flex-col justify-between card-smooth">
          {/* Front (Question) */}
          <div className="mb-8">
            <div className="text-sm text-[#404040] mb-2 font-medium">Question</div>
            <div className="text-xl text-[#000000] prose max-w-none">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {currentCard.front}
              </ReactMarkdown>
            </div>
          </div>

          {/* Review Mode Specific UI */}
          {reviewMode === 'flip' && !showAnswer && (
            <Button 
              onClick={handleFlip}
              className="w-full h-14 bg-[#1E3A8A] hover:bg-[#1e40af] text-white"
            >
              Show Answer
            </Button>
          )}

          {reviewMode === 'flip' && showAnswer && (
            <div className="space-y-4">
              <div className="text-sm text-[#404040] font-medium">Answer</div>
              <div className="p-4 bg-[#F1F5F9] rounded-lg text-[#000000] prose max-w-none">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {currentCard.back}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {reviewMode === 'type_answer' && !showAnswer && (
            <div className="space-y-4">
              <Input
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your answer..."
                className="text-lg border-[#CBD5E1] text-[#000000]"
                onKeyPress={(e) => e.key === 'Enter' && handleTypeSubmit()}
              />
              <Button 
                onClick={handleTypeSubmit}
                disabled={!userAnswer.trim()}
                className="w-full h-14 bg-[#1E3A8A] hover:bg-[#1e40af] text-white"
              >
                Submit Answer
              </Button>
            </div>
          )}

          {reviewMode === 'type_answer' && showAnswer && (
            <div className="space-y-4">
              <div className="p-4 bg-[#FEE2E2] border border-[#FECACA] rounded-lg">
                <div className="text-sm text-[#000000] font-medium mb-2">Your answer was incorrect</div>
                <div className="text-sm text-[#000000] mb-2">You wrote: <strong>{userAnswer}</strong></div>
                <div className="text-sm text-[#000000]">Correct answer: <strong>{currentCard.back}</strong></div>
              </div>
            </div>
          )}

          {reviewMode === 'multiple_choice' && (
            <div className="space-y-3">
              {mcChoices.map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedChoice(choice)}
                  className={cn(
                    "w-full p-4 rounded-lg border-2 text-left transition-all card-smooth text-[#000000]",
                    selectedChoice === choice 
                      ? "border-[#1E3A8A] bg-[#EFF6FF]" 
                      : "border-[#CBD5E1] bg-white hover:border-[#1E3A8A]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#E5E7EB] flex items-center justify-center text-sm font-semibold">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{choice}</span>
                  </div>
                </button>
              ))}
              <Button 
                onClick={handleMCSubmit}
                disabled={!selectedChoice}
                className="w-full h-14 bg-[#1E3A8A] hover:bg-[#1e40af] text-white mt-4"
              >
                Submit Answer
              </Button>
            </div>
          )}
        </div>

        {/* Action Buttons (for flip mode with answer shown) */}
        {reviewMode === 'flip' && showAnswer && (
          <div className="flex gap-4">
            <Button
              onClick={handleDontKnowIt}
              variant="outline"
              className="flex-1 h-14 border-[#DC2626] text-[#DC2626] hover:bg-[#FEE2E2]"
            >
              <X className="w-5 h-5 mr-2" />
              Don't Know It
            </Button>
            <Button
              onClick={handleKnowIt}
              className="flex-1 h-14 bg-[#16A34A] hover:bg-[#15803D] text-white"
            >
              <Check className="w-5 h-5 mr-2" />
              Know It
            </Button>
          </div>
        )}

        {reviewMode === 'type_answer' && showAnswer && (
          <Button
            onClick={handleDontKnowIt}
            className="w-full h-14 bg-[#1E3A8A] hover:bg-[#1e40af] text-white"
          >
            Next Card
          </Button>
        )}
      </div>
    </div>
  );
}