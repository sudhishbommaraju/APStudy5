import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, ChevronLeft, AlertCircle, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import QuestionCard from '@/components/ui/QuestionCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

/**
 * Mistake Replay Mode
 * High-impact learning feature
 * Focuses on mastery recovery through repeated practice of missed questions
 */

export default function MistakeReplay() {
  const [user, setUser] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [replayState, setReplayState] = useState('setup'); // 'setup', 'practicing', 'complete'
  const [missedQuestions, setMissedQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [newAnswers, setNewAnswers] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list('subject_id'),
  });

  const { data: allAttempts = [] } = useQuery({
    queryKey: ['attempts'],
    queryFn: () => base44.entities.Attempt.list('-created_date', 500),
    enabled: !!user,
  });

  const startReplay = async () => {
    if (!selectedSubject) return;
    
    setLoading(true);

    try {
      // Get all incorrect attempts for this subject
      const userIncorrectAttempts = allAttempts.filter(a => 
        a.created_by === user?.email &&
        a.subject_id === selectedSubject &&
        !a.is_correct
      );

      // Get unique question IDs
      const uniqueQuestionIds = [...new Set(userIncorrectAttempts.map(a => a.question_id))];

      // Fetch the actual questions
      const questions = await Promise.all(
        uniqueQuestionIds.map(id => base44.entities.Question.list().then(qs => qs.find(q => q.id === id)))
      );

      const validQuestions = questions.filter(q => q !== undefined);

      if (validQuestions.length === 0) {
        alert('No missed questions found for this subject. Great job!');
        setLoading(false);
        return;
      }

      setMissedQuestions(validQuestions);
      setReplayState('practicing');
    } catch (e) {
      console.error('Failed to load missed questions:', e);
    }
    
    setLoading(false);
  };

  const handleAnswer = (answer) => {
    setNewAnswers(prev => ({
      ...prev,
      [currentIndex]: answer,
    }));
    
    const question = missedQuestions[currentIndex];
    if (answer === question.correct_answer) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10B981', '#34D399', '#6EE7B7']
      });
    }
  };

  const handleNext = async () => {
    const question = missedQuestions[currentIndex];
    const selectedAnswer = newAnswers[currentIndex];
    const isCorrect = selectedAnswer === question.correct_answer;

    // Record retry attempt
    await base44.entities.Attempt.create({
      question_id: question.id,
      subject_id: selectedSubject,
      unit_id: question.unit_id,
      skill_id: question.skill_id,
      skill_name: question.skill_name,
      difficulty: question.difficulty,
      selected_answer: selectedAnswer,
      correct_answer: question.correct_answer,
      is_correct: isCorrect,
      mode: 'practice', // Untimed
      error_type: 'none',
    });

    if (currentIndex < missedQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setReplayState('complete');
    }
  };

  const currentQuestion = missedQuestions[currentIndex];
  const answered = newAnswers[currentIndex] !== undefined;

  // Setup view
  if (replayState === 'setup') {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #e8f1f8, #d9e9f5)', fontFamily: 'Georgia, serif' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" size="icon">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">Mistake Replay</h1>
              <p className="text-slate-500">Master concepts by reviewing questions you missed</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">Learning Mode</h3>
                <p className="text-sm text-amber-800">
                  This is an <strong>untimed practice session</strong> focused on mastery recovery. 
                  Take your time, read explanations carefully, and strengthen your understanding.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <label className="text-sm font-medium text-slate-700 mb-3 block">
              Select Subject
            </label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a subject" />
              </SelectTrigger>
              <SelectContent className="max-h-96">
                {subjects.map(subject => (
                  <SelectItem key={subject.subject_id} value={subject.subject_id}>
                    <div className="flex items-center gap-2">
                      {subject.icon && <span>{subject.icon}</span>}
                      <span>{subject.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedSubject && (
              <div className="mt-4 text-sm text-slate-600">
                {allAttempts.filter(a => 
                  a.created_by === user?.email &&
                  a.subject_id === selectedSubject &&
                  !a.is_correct
                ).length} missed questions available
              </div>
            )}

            <Button
              onClick={startReplay}
              disabled={!selectedSubject || loading}
              className="w-full h-12 mt-6"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Target className="w-4 h-4 mr-2" />
              )}
              Start Mistake Replay
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Practicing
  if (replayState === 'practicing') {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #e8f1f8, #d9e9f5)', fontFamily: 'Georgia, serif' }}>
        <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-slate-200 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-slate-600">
              Question {currentIndex + 1} of {missedQuestions.length}
            </span>
            <div className="h-2 w-48 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 transition-all"
                style={{ width: `${((currentIndex + 1) / missedQuestions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>You previously missed this question. Focus on understanding why.</span>
            </p>
          </div>

          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <QuestionCard
              question={currentQuestion}
              onAnswer={handleAnswer}
              selectedAnswer={newAnswers[currentIndex]}
              showFeedback={answered}
              mode="practice"
            />
          </motion.div>

          <AnimatePresence>
            {answered && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-end mt-4"
              >
                <Button onClick={handleNext}>
                  {currentIndex < missedQuestions.length - 1 ? 'Next Question' : 'Complete Review'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Complete
  if (replayState === 'complete') {
    const correctCount = missedQuestions.filter((q, i) => newAnswers[i] === q.correct_answer).length;
    const improvement = (correctCount / missedQuestions.length) * 100;

    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #e8f1f8, #d9e9f5)', fontFamily: 'Georgia, serif' }}>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Mastery Recovery Complete!
            </h1>
            <p className="text-4xl font-bold text-emerald-600 mb-4">
              {improvement.toFixed(0)}%
            </p>
            <p className="text-slate-500">
              You got {correctCount} out of {missedQuestions.length} correct this time
            </p>
          </div>

          <div className="flex gap-3">
            <Link to={createPageUrl('Dashboard')} className="flex-1">
              <Button variant="outline" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
            <Button 
              onClick={() => {
                setReplayState('setup');
                setCurrentIndex(0);
                setNewAnswers({});
                setMissedQuestions([]);
                setSelectedSubject('');
              }}
              className="flex-1"
            >
              Review More Mistakes
            </Button>
          </div>
        </div>
      </div>
    );
  }
}