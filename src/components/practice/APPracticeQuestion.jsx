import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FlashcardTutor from '@/components/flashcards/FlashcardTutor';

export default function APPracticeQuestion({ question, questionIndex, totalQuestions, onNext, onComplete }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [eliminatedChoices, setEliminatedChoices] = useState(new Set());

  useEffect(() => {
    // Reset state when question changes
    setSelectedIndex(null);
    setIsSubmitted(false);
    setIsCorrect(null);
    setEliminatedChoices(new Set());
  }, [questionIndex]);

  const handleSubmit = () => {
    if (selectedIndex === null) return;
    
    const correct = selectedIndex === question.correct_answer;
    setIsCorrect(correct);
    setIsSubmitted(true);
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

  const handleNext = () => {
    if (questionIndex < totalQuestions - 1) {
      onNext();
    } else {
      onComplete();
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Question Panel - 60% on desktop */}
      <div className="flex-1 lg:w-[60%] space-y-6">
        {/* Progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-neutral-300 font-medium">
              Question {questionIndex + 1} of {totalQuestions}
            </span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <motion.div
          key={questionIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900 border border-neutral-800 rounded-xl p-8"
        >
          {/* Stimulus Section */}
          {question.stimulus && question.stimulus.trim() && (
            <div className="bg-neutral-800/30 rounded-lg p-4 mb-8">
              <div className="text-neutral-400 leading-relaxed text-sm md:text-base">
                {String(question.stimulus || '')
                  .replace(/^\*\*Stimulus:\*\*\s*/i, '')
                  .replace(/^\*\*\s*/, '')
                  .replace(/\*\*$/, '')
                  .trim()}
              </div>
            </div>
          )}

          {/* Question Prompt */}
          <h2 className="text-lg md:text-xl font-semibold text-white mb-6 leading-relaxed">
            {String(question.question_text || question.stem || '')
              .replace(/^\*\*Question:\*\*\s*/i, '')
              .replace(/^\*\*\s*/, '')
              .replace(/\*\*$/, '')
              .replace(/^##\s*/, '')
              .trim() || 'Question prompt missing'}
          </h2>

          {/* Answer Options */}
          <div className="space-y-3">
            {question.answer_choices?.map((choice, idx) => {
              const isSelected = selectedIndex === idx;
              const isCorrectChoice = idx === question.correct_answer;
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
                        <span className="font-semibold mr-3">{String.fromCharCode(65 + idx)}.</span>
                        {choice}
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
                {questionIndex < totalQuestions - 1 ? 'Next Question' : 'Finish Practice'}
              </Button>
            </>
          )}
        </div>

        {/* Explanation after submission */}
        {isSubmitted && question.explanation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-6"
          >
            <p className="text-neutral-400 text-sm mb-2 uppercase tracking-wider">Explanation</p>
            <p className="text-neutral-200 leading-relaxed">{question.explanation}</p>
          </motion.div>
        )}
      </div>

      {/* Tutor Panel - 40% on desktop */}
      <div className="lg:w-[40%] bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <FlashcardTutor 
          question={question.stem} 
          isSubmitted={isSubmitted}
        />
      </div>
    </div>
  );
}