import React, { useState, useEffect } from 'react';
import { Clock, Bookmark, Flag } from 'lucide-react';
import QuestionPanel from './QuestionPanel';
import AITutorPanel from './AITutorPanel';
import { Button } from '@/components/ui/button';

export default function ExamShell({
  question,
  questionNumber,
  totalQuestions,
  examType,
  subject,
  unit,
  mode = 'practice',
  timeLimit,
  onSubmit,
  onNext,
  onBookmark,
  onFlag,
  isBookmarked = false,
  isFlagged = false
}) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit || 0);
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [aiPanelWidth, setAIPanelWidth] = useState(35);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) setShowAIPanel(false);
  }, [isMobile]);

  useEffect(() => {
    setSelectedAnswer(null);
    setIsSubmitted(false);
    setIsCorrect(null);
  }, [question]);

  useEffect(() => {
    if ((mode === 'full-test' || mode === 'timed-mini') && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [mode, timeRemaining]);

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    
    const correct = selectedAnswer === question.correct_answer;
    setIsCorrect(correct);
    setIsSubmitted(true);
    
    if (onSubmit) {
      onSubmit({
        questionId: question.id,
        selectedAnswer,
        isCorrect: correct,
        timeSpent: timeLimit ? timeLimit - timeRemaining : 0
      });
    }
  };

  const handleNext = () => {
    if (onNext) onNext();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div className="flex items-center gap-6">
            <div className="text-sm text-neutral-400">
              Question {questionNumber} of {totalQuestions}
            </div>
            {(mode === 'full-test' || mode === 'timed-mini') && (
              <div className="flex items-center gap-2 text-white">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => onBookmark?.()}
              className={`p-2 rounded-lg transition-colors ${
                isBookmarked ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <Bookmark className="w-5 h-5" fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={() => onFlag?.()}
              className={`p-2 rounded-lg transition-colors ${
                isFlagged ? 'bg-orange-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <Flag className="w-5 h-5" fill={isFlagged ? 'currentColor' : 'none'} />
            </button>
            
            {isMobile && (
              <Button
                onClick={() => setShowAIPanel(!showAIPanel)}
                variant="outline"
                size="sm"
              >
                AI Tutor
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Question Panel */}
        <div 
          className={`${isMobile ? 'w-full' : ''} overflow-y-auto`}
          style={!isMobile ? { width: `${100 - aiPanelWidth}%` } : {}}
        >
          <QuestionPanel
            question={question}
            selectedAnswer={selectedAnswer}
            onSelectAnswer={setSelectedAnswer}
            isSubmitted={isSubmitted}
            isCorrect={isCorrect}
            onSubmit={handleSubmit}
            onNext={handleNext}
          />
        </div>

        {/* AI Tutor Panel - Always visible on desktop */}
        {(!isMobile || showAIPanel) && (
          <div 
            className={`${
              isMobile 
                ? 'fixed inset-0 z-50 bg-neutral-950' 
                : 'border-l border-neutral-800'
            } overflow-hidden flex flex-col bg-neutral-950`}
            style={!isMobile ? { width: `${aiPanelWidth}%` } : {}}
          >
            {/* Panel Header */}
            {!isMobile && (
              <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">AI Tutor</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAIPanelWidth(Math.max(25, aiPanelWidth - 5))}
                    className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded hover:bg-neutral-800"
                  >
                    −
                  </button>
                  <span className="text-xs text-neutral-500">{aiPanelWidth}%</span>
                  <button
                    onClick={() => setAIPanelWidth(Math.min(50, aiPanelWidth + 5))}
                    className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded hover:bg-neutral-800"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
            
            {/* AI Panel Content */}
            <div className="flex-1 overflow-hidden">
              <AITutorPanel
                question={question}
                userAnswer={selectedAnswer}
                correctAnswer={question.correct_answer}
                isSubmitted={isSubmitted}
                examType={examType}
                subject={subject}
                unit={unit}
                onClose={isMobile ? () => setShowAIPanel(false) : undefined}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}