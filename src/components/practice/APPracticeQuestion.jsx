import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Loader2, Lightbulb, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TutorPanel from '@/components/tutor/TutorPanel';
import { generateExplanation, generateWrongAnswerFeedback } from '@/components/generation/FastQuestionGenerator';
import { recordAnswer } from '@/components/generation/AdaptivePracticeEngine';
import QuestionVisual from '@/components/practice/QuestionVisual';
import { InlineMath, BlockMath } from 'react-katex';

// Render text with $$ ... $$ LaTeX blocks and better spacing
function LatexText({ text }) {
  if (!text) return null;
  const parts = String(text).split(/(\$\$[^$]+\$\$)/g);
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^\$\$(.+)\$\$$/s);
        if (match) {
          try { return <BlockMath key={i} math={match[1].trim()} />; } catch { return <span key={i}>{part}</span>; }
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// Enhanced explanation rendering with better spacing and LaTeX
function ExplanationContent({ text }) {
  if (!text) return <p className="text-gray-600">No explanation available.</p>;
  
  // Split by common section headers or blank lines
  const sections = String(text)
    .split(/(^|\n)(Step\s*\d+:|Key.*?:|Note:|Concept:|Formula:|\*\*[^*]+\*\*:?)/gim)
    .filter(s => s && s.trim());
  
  return (
    <div className="space-y-5">
      {sections.map((section, i) => {
        const isHeader = /^(Step|Key|Note|Concept|Formula|\*\*)/i.test(section);
        return (
          <div key={i}>
            {isHeader ? (
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                {section.replace(/\*\*|:|^\n/g, '').trim()}
              </h4>
            ) : (
              <div className="text-gray-800 leading-relaxed text-sm space-y-2">
                <LatexText text={section.trim()} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function APPracticeQuestion({ question, questionIndex, totalQuestions, onNext, onComplete }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [eliminatedChoices, setEliminatedChoices] = useState(new Set());

  // AI features state
  const [explanation, setExplanation] = useState(null);
  const [wrongFeedback, setWrongFeedback] = useState(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // Adaptive difficulty: track start time
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    setSelectedIndex(null);
    setIsSubmitted(false);
    setIsCorrect(null);
    setEliminatedChoices(new Set());
    setExplanation(null);
    setWrongFeedback(null);
    startTimeRef.current = Date.now();
  }, [questionIndex]);

  const choices = question.answer_choices || [];
  // correct_answer is always a letter "A"–"D"
  const correctLetter = question.correct_answer;
  const correctIndex = ['A', 'B', 'C', 'D'].indexOf(correctLetter);

  const handleSubmit = async () => {
    if (selectedIndex === null) return;

    const selectedLetter = ['A', 'B', 'C', 'D'][selectedIndex];
    const correct = selectedLetter === correctLetter;

    // Deterministic grading logs
    console.log('Correct:', correctLetter);
    console.log('Selected:', selectedLetter);
    console.log('Result:', correct);

    setIsCorrect(correct);
    setIsSubmitted(true);

    // Record for adaptive difficulty
    const timeSpentMs = Date.now() - startTimeRef.current;
    recordAnswer(question.subject_id, question.unit_id, correct, timeSpentMs);

    // Lazily fetch AI explanation
    setLoadingExplanation(true);
    try {
      const exp = await generateExplanation({
        questionId: question.id,
        stimulus: question.stimulus || '',
        question: question.question_text || question.stem || '',
        options: choices,
        correctAnswer: correctLetter
      });
      setExplanation(exp);
    } catch (e) {
      setExplanation(question.explanation || null);
    } finally {
      setLoadingExplanation(false);
    }

    // If wrong: fetch personalized wrong-answer feedback
    if (!correct) {
      setLoadingFeedback(true);
      try {
        const fb = await generateWrongAnswerFeedback({
          questionId: question.id,
          stimulus: question.stimulus || '',
          question: question.question_text || question.stem || '',
          selectedOptionText: choices[selectedIndex],
          correctOptionText: choices[correctIndex],
          correctAnswer: correctLetter
        });
        setWrongFeedback(fb);
      } catch (e) {
        setWrongFeedback(null);
      } finally {
        setLoadingFeedback(false);
      }
    }
  };

  const toggleEliminate = (idx, e) => {
    e.stopPropagation();
    if (isSubmitted) return;
    const next = new Set(eliminatedChoices);
    next.has(idx) ? next.delete(idx) : next.add(idx);
    setEliminatedChoices(next);
  };

  const handleNext = () => {
    if (questionIndex < totalQuestions - 1) onNext(isCorrect);
    else onComplete(isCorrect);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Question Panel */}
      <div className="flex-1 lg:w-[60%] space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 font-medium">
              Question {questionIndex + 1} of {totalQuestions}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
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
          className="bg-white border border-gray-200 rounded-xl shadow-sm p-8"
        >
          {question.stimulus?.trim() && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-gray-600 leading-relaxed text-sm md:text-base">
                <LatexText text={String(question.stimulus)
                  .replace(/^\*\*Stimulus:\*\*\s*/i, '')
                  .replace(/^\*\*\s*/, '')
                  .replace(/\*\*$/, '')
                  .trim()} />
              </div>
            </div>
          )}

          {question.visual && (
            <div className="mb-6">
              <QuestionVisual visual={question.visual} />
            </div>
          )}

          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-6 leading-relaxed">
            <LatexText text={String(question.question_text || question.stem || '')
              .replace(/^\*\*Question:\*\*\s*/i, '')
              .replace(/^\*\*\s*/, '')
              .replace(/\*\*$/, '')
              .replace(/^##\s*/, '')
              .trim() || 'Question prompt missing'} />
          </h2>

          <div className="space-y-3">
            {choices.map((choice, idx) => {
              const isSelected   = selectedIndex === idx;
              const isCorrectChoice = idx === correctIndex;
              const showCorrect  = isSubmitted && isCorrectChoice;
              const showWrong    = isSubmitted && isSelected && !isCorrect;
              const isEliminated = eliminatedChoices.has(idx);

              return (
                <div key={idx} className="relative group">
                  <button
                    onClick={() => !isSubmitted && setSelectedIndex(idx)}
                    disabled={isSubmitted}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      showCorrect  ? 'bg-green-900/20 border-green-600' :
                      showWrong    ? 'bg-red-900/20 border-red-600'     :
                      isSelected   ? 'bg-blue-50 border-blue-500'   :
                        isEliminated ? 'bg-gray-50 border-gray-200 opacity-40' :
                                       'bg-white border-gray-200 hover:border-gray-400'
                    } ${isSubmitted ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-base ${
                       (showCorrect || showWrong) ? 'text-gray-900 font-medium' : 'text-gray-800'
                      } ${isEliminated ? 'line-through' : ''}`}>
                        <span className="font-semibold mr-3">{String.fromCharCode(65 + idx)}.</span>
                        <LatexText text={choice} />
                      </span>
                      {showCorrect && <Check className="w-5 h-5 text-green-500 shrink-0" />}
                      {showWrong   && <X    className="w-5 h-5 text-red-500 shrink-0" />}
                    </div>
                  </button>

                  {!isSubmitted && (
                    <button
                      onClick={(e) => toggleEliminate(idx, e)}
                      className={`absolute top-3 right-3 p-1.5 rounded-lg transition-all ${
                        isEliminated
                          ? 'bg-red-100 text-red-500'
                           : 'opacity-0 group-hover:opacity-100 bg-gray-100 text-gray-400 hover:text-red-500'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Submit / Next */}
        <div className="flex items-center justify-between gap-4">
          {!isSubmitted ? (
            <Button
              onClick={handleSubmit}
              disabled={selectedIndex === null}
              className="bg-blue-500 hover:bg-blue-600 w-full shadow-sm"
              size="lg"
            >
              Submit Answer
            </Button>
          ) : (
            <>
              <div className={`px-4 py-2 rounded-lg font-medium ${
                isCorrect ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
              </div>
              <Button
                onClick={handleNext}
                className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                size="lg"
              >
                {questionIndex < totalQuestions - 1 ? 'Next Question' : 'Finish Practice'}
              </Button>
            </>
          )}
        </div>

        <AnimatePresence>
          {/* Wrong-answer personalized feedback */}
          {isSubmitted && !isCorrect && (
            <motion.div
              key="wrong-feedback"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-xl p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-red-700 text-sm font-semibold uppercase tracking-wider">Why that's incorrect</span>
              </div>
              {loadingFeedback ? (
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing your answer…
                </div>
              ) : (
                <p className="text-red-800 leading-relaxed text-sm">{wrongFeedback || 'Review the correct answer above.'}</p>
              )}
            </motion.div>
          )}

          {/* AI Explanation */}
          {isSubmitted && (
            <motion.div
              key="explanation"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-yellow-500 shrink-0" />
                <span className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Explanation</span>
              </div>
              {loadingExplanation ? (
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating explanation…
                </div>
              ) : (
               <ExplanationContent text={explanation} />
              )}
              </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tutor Panel */}
      <div className="lg:w-[40%] min-h-[500px]">
        <TutorPanel
          subject={question.subject_name || question.subject_id || ''}
          unit={question.unit_name || question.unit_id || ''}
          questionText={question.question_text || question.stem || ''}
          options={choices}
          correctAnswer={isSubmitted ? correctLetter : undefined}
          userAnswer={isSubmitted && selectedIndex !== null ? `${['A','B','C','D'][selectedIndex]}. ${choices[selectedIndex]}` : undefined}
          isSubmitted={isSubmitted}
        />
      </div>
    </div>
  );
}