import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, Target, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import QuestionCard from '@/components/ui/QuestionCard';
import UpgradeModal from '@/components/monetization/UpgradeModal';
import LatexStepInput from '@/components/practice/LatexStepInput';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { checkAndResetCredits, checkCredits, useCredit } from '@/components/monetization/CreditHelper';
import { updateStatsForAnswer } from '@/components/gamification/GamificationHelper';
import { SafeQuestionGenerator } from '@/components/generation/SafeQuestionGenerator';
import GenerationProgress from '@/components/generation/GenerationProgress';
import GenerationErrorBoundary from '@/components/generation/GenerationErrorBoundary';
import { withWatchdog, WatchdogTimeout } from '@/components/utils/watchdog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function Practice() {
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const [user, setUser] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [customQuestionCount, setCustomQuestionCount] = useState(10);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isComplete, setIsComplete] = useState(false);
  
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [studyPlanId, setStudyPlanId] = useState(null);
  const [showLatexInput, setShowLatexInput] = useState(false);
  const [studentSolution, setStudentSolution] = useState({});
  const [generationProgress, setGenerationProgress] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        const { user: refreshedUser } = await checkAndResetCredits(currentUser);
        setUser(refreshedUser);
      } catch (e) {
        console.error('Failed to load user:', e);
      }
    };
    loadUser();
  }, []);

  // Handle preloaded questions from Dashboard
  useEffect(() => {
    if (location.state?.preloadedQuestions && location.state?.subjectId) {
      setQuestions(location.state.preloadedQuestions);
      setSelectedSubject(location.state.subjectId);
    }
  }, [location.state]);

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list('subject_id'),
  });
  
  // Auto-generate for study plan - wait for subjects to load
  useEffect(() => {
    if (location.state?.autoGenerate && location.state?.studyPlan && user && subjects && subjects.length > 0) {
      const plan = location.state.studyPlan;
      setStudyPlanId(plan.id);
      setSelectedSubject(plan.subject_id);
      
      // Auto-generate immediately
      generateQuestionsForPlan(plan, subjects);
    }
  }, [location.state?.autoGenerate, user?.email, subjects?.length]);

  const selectedSubjectData = subjects.find(s => s.subject_id === selectedSubject);
  const isStandardizedTest = selectedSubjectData?.category === 'Standardized';

  const { data: units = [] } = useQuery({
    queryKey: ['units', selectedSubject],
    queryFn: () => base44.entities.Unit.filter({ subject_id: selectedSubject }),
    enabled: !!selectedSubject,
  });

  const { data: skills = [] } = useQuery({
    queryKey: ['skills', selectedSubject, selectedUnit],
    queryFn: () => base44.entities.Skill.list(),
    enabled: !!selectedSubject,
    select: (data) => {
      if (selectedUnit && selectedUnit !== 'all') {
        return data.filter(skill => skill.unit_id === selectedUnit);
      }
      return data.filter(skill => skill.subject_id === selectedSubject);
    },
  });

  const generateQuestionsForPlan = async (plan, subjectsData) => {
    setIsGenerating(true);
    setError(null);
    setGenerationProgress({ phase: 'initializing', current: 0, total: 10, message: 'Preparing to generate questions...' });

    // FRONTEND WATCHDOG
    const WATCHDOG_MS = 15000;
    const timeoutId = setTimeout(() => {
      setIsGenerating(false);
      setGenerationProgress(null);
      setError('Generation timed out. Please try again.');
    }, WATCHDOG_MS);

    try {
      const { allowed } = await checkCredits(user, 'daily_practice_count');
      if (!allowed) {
        clearTimeout(timeoutId);
        setUpgradeModalOpen(true);
        setIsGenerating(false);
        setGenerationProgress(null);
        return;
      }

      const updatedUser = await useCredit(user, 'daily_practice_count');
      setUser(updatedUser);

      const subject = subjectsData.find(s => s.subject_id === plan.subject_id);
      const planUnits = await base44.entities.Unit.filter({ subject_id: plan.subject_id });
      
      let targetUnit;
      if (plan.unit_ids && plan.unit_ids.length > 0) {
        targetUnit = planUnits.find(u => u.id === plan.unit_ids[0]);
      }
      if (!targetUnit && planUnits.length > 0) {
        targetUnit = planUnits[0];
      }

      if (!subject || !targetUnit) {
        throw new Error('Subject or Unit not found');
      }

      // BOUNDED GENERATION
      const result = await SafeQuestionGenerator.generateSafe({
        subject_id: plan.subject_id,
        unit: targetUnit,
        skill: null,
        count: 10,
        difficulty: 'medium',
        onProgress: setGenerationProgress,
        maxTimeMs: 12000
      });

      // VALIDATE
      if (!result || !result.questions || result.questions.length === 0) {
        throw new Error('No valid questions generated');
      }

      clearTimeout(timeoutId);
      setQuestions(result.questions);
      setGenerationProgress(null);
      setIsGenerating(false);
      
    } catch (e) {
      clearTimeout(timeoutId);
      console.error('Study plan generation failed:', e);
      setError(e.message || 'Failed to generate questions. Please try again.');
      setGenerationProgress(null);
      setIsGenerating(false);
    }
  };

  const generateQuestions = async () => {
    console.log('[Practice] Generate Questions clicked', {
      user: user?.email,
      selectedSubject,
      selectedUnit,
      questionCount
    });

    // GUARD: Must throw or show error, never silent return
    if (!user) {
      alert('Please wait while your account loads...');
      return;
    }

    if (!selectedSubject) {
      alert('Please select a subject first');
      return;
    }

    // IMMEDIATE STATE CHANGE - guarantees user sees something
    setIsGenerating(true);
    setError(null);
    setGenerationProgress({ phase: 'initializing', current: 0, total: questionCount, message: 'Starting generation...' });

    // HARD TIMEOUT: 15 seconds maximum (LIVENESS GUARANTEE)
    const FRONTEND_WATCHDOG_MS = 15000;
    const timeoutId = setTimeout(() => {
      // FORCE EXIT LOADING STATE
      setIsGenerating(false);
      setGenerationProgress(null);
      setError('Generation timed out. Please try again with fewer questions or a different subject.');
    }, FRONTEND_WATCHDOG_MS);
    
    try {
      // Credit check
      const { allowed } = await checkCredits(user, 'daily_practice_count');
      if (!allowed) {
        clearTimeout(timeoutId);
        setUpgradeModalOpen(true);
        setIsGenerating(false);
        setGenerationProgress(null);
        return;
      }

      const updatedUser = await useCredit(user, 'daily_practice_count');
      setUser(updatedUser);

      // Fetch units
      const subjectUnits = await base44.entities.Unit.filter({ subject_id: selectedSubject });
      
      let targetUnit = null;
      if (selectedUnit && selectedUnit !== 'all') {
        targetUnit = subjectUnits.find(u => u.id === selectedUnit);
      } else if (subjectUnits.length > 0) {
        targetUnit = subjectUnits[Math.floor(Math.random() * subjectUnits.length)];
      }
      
      if (!targetUnit) {
        throw new Error('No unit found for generation');
      }

      // BOUNDED GENERATION - guaranteed to terminate
      const result = await SafeQuestionGenerator.generateSafe({
        subject_id: selectedSubject,
        unit: targetUnit,
        skill: null,
        count: questionCount,
        difficulty: 'medium',
        onProgress: setGenerationProgress,
        maxTimeMs: 12000 // 12s backend limit (3s buffer before frontend watchdog)
      });

      // VALIDATE BEFORE SETTING STATE
      if (!result || !result.questions || result.questions.length === 0) {
        throw new Error('No valid questions generated');
      }

      // SUCCESS - clear watchdog and set questions
      clearTimeout(timeoutId);
      setQuestions(result.questions);
      setGenerationProgress(null);
      setIsGenerating(false);
      
    } catch (e) {
      clearTimeout(timeoutId);
      console.error('Practice generation failed:', e);
      
      // MANDATORY ERROR STATE
      setError(e.message || 'Failed to generate questions. Please try again.');
      setGenerationProgress(null);
      setIsGenerating(false);
    }
  };

  const [currentStreak, setCurrentStreak] = useState(0);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [newBadges, setNewBadges] = useState([]);

  const handleAnswer = (answer) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: answer }));
    
    const question = questions[currentIndex];
    const isCorrect = answer === question.correct_answer;
    
    // Update streak
    if (isCorrect) {
      setCurrentStreak(prev => prev + 1);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#6366F1', '#8B5CF6', '#A78BFA']
      });
    } else {
      setCurrentStreak(0);
    }
  };

  const handleLatexSubmit = (steps) => {
    setStudentSolution(prev => ({ ...prev, [currentIndex]: steps }));
    setShowLatexInput(false);
  };

  const handleNext = async () => {
    const question = questions[currentIndex];
    const selectedAnswer = answers[currentIndex];
    const isCorrect = selectedAnswer === question.correct_answer;

    // Record attempt
    await base44.entities.Attempt.create({
      question_id: question.id,
      subject_id: question.subject_id || selectedSubject,
      unit_id: question.unit_id,
      skill_id: question.skill_id,
      skill_name: question.skill_name,
      difficulty: question.difficulty,
      selected_answer: selectedAnswer,
      correct_answer: question.correct_answer,
      is_correct: isCorrect,
      mode: 'practice',
      error_type: 'none',
    });

    // Update gamification stats
    if (user) {
      const result = await updateStatsForAnswer(user.email, isCorrect, currentStreak);
      if (result) {
        setSessionPoints(prev => prev + result.pointsEarned);
        if (result.newBadges.length > 0) {
          setNewBadges(prev => [...prev, ...result.newBadges]);
        }
      }
    }

    // Update study plan progress if applicable
    if (studyPlanId) {
      try {
        const plan = await base44.entities.StudyPlan.filter({ id: studyPlanId });
        if (plan && plan[0]) {
          await base44.entities.StudyPlan.update(studyPlanId, {
            questions_completed: (plan[0].questions_completed || 0) + 1,
            practice_sessions_completed: currentIndex === questions.length - 1 
              ? (plan[0].practice_sessions_completed || 0) + 1 
              : plan[0].practice_sessions_completed
          });
        }
      } catch (e) {
        console.error('Failed to update study plan:', e);
      }
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
      queryClient.invalidateQueries({ queryKey: ['attempts'] });
      queryClient.invalidateQueries({ queryKey: ['studyPlans'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
    }
  };

  const resetPractice = () => {
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setIsComplete(false);
    setSelectedSubject('');
    setSelectedUnit('');
    setError(null);
    setCurrentStreak(0);
    setSessionPoints(0);
    setNewBadges([]);
  };

  // Setup view
  if (questions.length === 0 && !isGenerating) {
    return (
      <>
        <div className="page-header">
          <h1 className="page-title">Practice Mode</h1>
          <p className="page-description">Choose what to practice</p>
          {user?.plan === 'free' && (
            <p className="text-sm text-slate-500 mt-2">
              Daily practice exams: {(user.daily_practice_count || 0)}/5 used
            </p>
          )}
        </div>

        <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Subject Selector */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 shadow-lg">
            <label className="text-sm font-medium text-slate-100 mb-3 block">Select Subject</label>
            <Select value={selectedSubject} onValueChange={(value) => {
              setSelectedSubject(value);
              setSelectedUnit('');
            }}>
              <SelectTrigger className="w-full bg-slate-900/50 border-slate-700/50 text-slate-200">
                <SelectValue placeholder="All subjects or choose specific" />
              </SelectTrigger>
              <SelectContent className="max-h-96 bg-slate-900/95 backdrop-blur-xl border-slate-700/50">
                {Array.from(new Map(subjects.map(s => [s.subject_id, s])).values())
                  .reduce((acc, subject) => {
                    const category = subject.category;
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(subject);
                    return acc;
                  }, {})
                  && Object.entries(
                    Array.from(new Map(subjects.map(s => [s.subject_id, s])).values())
                      .reduce((acc, subject) => {
                        const category = subject.category;
                        if (!acc[category]) acc[category] = [];
                        acc[category].push(subject);
                        return acc;
                      }, {})
                  ).map(([category, categorySubjects]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-white uppercase tracking-wider">
                        {category}
                      </div>
                      {categorySubjects.map((subject) => (
                        <SelectItem key={subject.subject_id} value={subject.subject_id} className="text-slate-200">
                          <div className="flex items-center gap-2">
                            {subject.icon && <span>{subject.icon}</span>}
                            <span>{subject.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Unit Selector */}
          <AnimatePresence>
            {selectedSubject && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 shadow-lg"
              >
                <label className="text-sm font-medium text-slate-100 mb-3 block">Select Unit (Optional)</label>
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger className="w-full bg-slate-900/50 border-slate-700/50 text-slate-200">
                    <SelectValue placeholder="All units or choose specific" />
                  </SelectTrigger>
                  <SelectContent className="max-h-96 bg-slate-900/95 backdrop-blur-xl border-slate-700/50">
                    <SelectItem value="all" className="text-white font-semibold">
                      ✨ All Units (Mixed Practice)
                    </SelectItem>
                    {units.sort((a, b) => a.unit_number - b.unit_number).map((unit) => (
                      <SelectItem key={unit.id} value={unit.id} className="text-white">
                        Unit {unit.unit_number}: {unit.unit_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Question Count */}
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 shadow-lg"
          >
            <label className="text-sm font-medium text-slate-100 mb-3 block">
              Number of Questions {isStandardizedTest && '(Custom for SAT/ACT)'}
            </label>
            {isStandardizedTest ? (
              <div className="space-y-3">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={customQuestionCount}
                  onChange={(e) => {
                    const val = Math.min(60, Math.max(1, parseInt(e.target.value) || 1));
                    setCustomQuestionCount(val);
                    setQuestionCount(val);
                  }}
                  className="w-full px-4 py-3 rounded-lg border border-slate-700/50 bg-slate-900/50 text-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  placeholder="Enter 1-60"
                />
                <p className="text-xs text-slate-400">Max 60 questions for SAT/ACT practice</p>
              </div>
            ) : (
              <div className="flex gap-3">
                {[5, 10, 15, 20].map((count) => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className={cn(
                      "flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                      questionCount === count
                        ? "bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                        : "bg-slate-900/50 text-slate-300 hover:bg-slate-900/70 border border-slate-700/50"
                    )}
                  >
                    {count}
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Start Button */}
          <div className="mt-6 space-y-2">
            <button
              type="button"
              onClick={generateQuestions}
              disabled={isGenerating || !selectedSubject}
              className="w-full h-14 px-6 text-base font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Start Practice ({questionCount} questions)
                  {selectedSubject && (!selectedUnit || selectedUnit === 'all') && ' - All Units'}
                </>
              )}
            </button>
            {!selectedSubject && (
              <p className="text-xs text-slate-400 text-center">
                Please select a subject to start practice
              </p>
            )}
          </div>
        </motion.div>
      </>
    );
  }

  // Loading state - Show progress
  if (isGenerating && generationProgress) {
    return <GenerationProgress progress={generationProgress} />;
  }

  // Error state - Show retry UI
  if (error) {
    return (
      <GenerationErrorBoundary
        error={error}
        onRetry={() => {
          setError(null);
          generateQuestions();
        }}
        onCancel={() => {
          setError(null);
          setQuestions([]);
        }}
      />
    );
  }

  // Complete state
  if (isComplete) {
    const correctCount = questions.filter((q, i) => answers[i] === q.correct_answer).length;
    const accuracy = (correctCount / questions.length) * 100;

    return (
      <>
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 text-center mb-6 shadow-lg"
        >
          <Target className="w-16 h-16 mx-auto mb-4 text-violet-400" />
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Practice Complete!</h1>
          <p className="text-4xl font-bold text-violet-400 mb-4">{accuracy.toFixed(0)}%</p>
          <p className="text-slate-400">{correctCount} out of {questions.length} correct</p>
          
          {sessionPoints > 0 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="px-4 py-2 bg-violet-500/20 rounded-lg">
                <p className="text-2xl font-bold text-violet-400">+{sessionPoints}</p>
                <p className="text-xs text-slate-400">Points Earned</p>
              </div>
              {currentStreak > 0 && (
                <div className="px-4 py-2 bg-orange-500/20 rounded-lg">
                  <p className="text-2xl font-bold text-orange-400">{currentStreak}</p>
                  <p className="text-xs text-slate-400">Max Streak</p>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {newBadges.length > 0 && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-2xl border border-violet-500/30 p-6 mb-6"
          >
            <h3 className="text-xl font-bold text-slate-100 mb-4 text-center">🎉 New Badges Earned!</h3>
            <div className="grid grid-cols-2 gap-3">
              {newBadges.map((badge) => (
                <div key={badge.id} className="bg-slate-800/60 rounded-lg p-4 text-center">
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <p className="font-semibold text-slate-100">{badge.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{badge.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="flex gap-3">
          <Link to={createPageUrl('Dashboard')} className="flex-1">
            <Button variant="outline" className="w-full">Back to Dashboard</Button>
          </Link>
          <Button onClick={resetPractice} className="flex-1">
            <Sparkles className="w-4 h-4 mr-2" />
            New Practice
          </Button>
        </div>
        <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
      </>
    );
  }

  // Practicing state
  const currentQuestion = questions[currentIndex];
  const answered = answers[currentIndex] !== undefined;

  return (
    <div className="min-h-screen focus-mode">
      <div className="sticky top-0 focus-mode-card border-b z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm focus-mode-text-secondary">
              Question {currentIndex + 1} of {questions.length}
            </span>
            {currentStreak > 0 && (
              <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-semibold rounded-full flex items-center gap-1">
                🔥 {currentStreak} streak
              </span>
            )}
            {sessionPoints > 0 && (
              <span className="px-2 py-1 bg-violet-500/20 text-violet-400 text-xs font-semibold rounded-full">
                +{sessionPoints} pts
              </span>
            )}
          </div>
          <div className="h-2 w-48 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%`, backgroundColor: 'var(--color-focus-accent)' }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <QuestionCard
            question={currentQuestion}
            onAnswer={handleAnswer}
            selectedAnswer={answers[currentIndex]}
            showFeedback={answered}
            mode="practice"
          />
        </motion.div>

        <AnimatePresence>
          {!answered && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <Button
                onClick={() => setShowLatexInput(!showLatexInput)}
                variant="outline"
                className="w-full"
              >
                {showLatexInput ? 'Hide' : 'Show Your Work (LaTeX)'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showLatexInput && !answered && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <LatexStepInput
                onSubmit={handleLatexSubmit}
                canonicalSolution={currentQuestion.explanation}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {answered && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-end mt-4"
            >
              <Button onClick={handleNext}>
                {currentIndex < questions.length - 1 ? 'Next Question' : 'Complete Practice'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}