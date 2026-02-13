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
import { AdaptiveDifficultyEngine } from '@/components/practice/AdaptiveDifficultyEngine';
import { SpacedRepetitionHelper } from '@/components/practice/SpacedRepetitionHelper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import EnhancedAITutor from '@/components/tutor/EnhancedAITutor';
import { MessageSquare } from 'lucide-react';
import { PracticeState, PracticeStateManager } from '@/components/practice/PracticeStateMachine';
import { validatePracticeData } from '@/components/practice/PracticeSchema';
import { getFallbackPractice } from '@/components/practice/FallbackPractice';

// BASE SUBJECTS - REQUIRED AND ALWAYS AVAILABLE (NON-NEGOTIABLE)
const BASE_SUBJECTS = [
  { subject_id: 'reading_writing', name: 'Reading & Writing', category: 'English', icon: '📖' },
  { subject_id: 'math', name: 'Math', category: 'Math', icon: '🔢' },
  { subject_id: 'science', name: 'Science', category: 'Science', icon: '🔬' },
];

// COMPREHENSIVE AP CLASS LIST
const DEFAULT_SUBJECTS = [
  ...BASE_SUBJECTS,
  
  // Standardized Tests
  { subject_id: 'sat', name: 'SAT', category: 'Standardized', icon: '📝' },
  { subject_id: 'act', name: 'ACT', category: 'Standardized', icon: '📋' },
  
  // AP Math & Computer Science
  { subject_id: 'ap_calculus_ab', name: 'AP Calculus AB', category: 'Math', icon: '📐' },
  { subject_id: 'ap_calculus_bc', name: 'AP Calculus BC', category: 'Math', icon: '📊' },
  { subject_id: 'ap_statistics', name: 'AP Statistics', category: 'Math', icon: '📈' },
  { subject_id: 'ap_computer_science_a', name: 'AP Computer Science A', category: 'Computer Science', icon: '💻' },
  { subject_id: 'ap_computer_science_principles', name: 'AP Computer Science Principles', category: 'Computer Science', icon: '🖥️' },
  
  // AP Sciences
  { subject_id: 'ap_biology', name: 'AP Biology', category: 'Science', icon: '🧬' },
  { subject_id: 'ap_chemistry', name: 'AP Chemistry', category: 'Science', icon: '⚗️' },
  { subject_id: 'ap_physics_1', name: 'AP Physics 1', category: 'Science', icon: '🔬' },
  { subject_id: 'ap_physics_2', name: 'AP Physics 2', category: 'Science', icon: '⚛️' },
  { subject_id: 'ap_physics_c_mechanics', name: 'AP Physics C: Mechanics', category: 'Science', icon: '🎢' },
  { subject_id: 'ap_physics_c_em', name: 'AP Physics C: E&M', category: 'Science', icon: '⚡' },
  { subject_id: 'ap_environmental_science', name: 'AP Environmental Science', category: 'Science', icon: '🌍' },
  
  // AP English
  { subject_id: 'ap_english_language', name: 'AP English Language', category: 'English', icon: '✍️' },
  { subject_id: 'ap_english_literature', name: 'AP English Literature', category: 'English', icon: '📚' },
  
  // AP History & Social Studies
  { subject_id: 'ap_us_history', name: 'AP US History', category: 'History', icon: '🏛️' },
  { subject_id: 'ap_world_history', name: 'AP World History: Modern', category: 'History', icon: '🌎' },
  { subject_id: 'ap_european_history', name: 'AP European History', category: 'History', icon: '🏰' },
  { subject_id: 'ap_us_government', name: 'AP US Government & Politics', category: 'Social Science', icon: '⚖️' },
  { subject_id: 'ap_comparative_government', name: 'AP Comparative Government', category: 'Social Science', icon: '🗳️' },
  { subject_id: 'ap_human_geography', name: 'AP Human Geography', category: 'Social Science', icon: '🗺️' },
  { subject_id: 'ap_psychology', name: 'AP Psychology', category: 'Social Science', icon: '🧠' },
  { subject_id: 'ap_macroeconomics', name: 'AP Macroeconomics', category: 'Social Science', icon: '💰' },
  { subject_id: 'ap_microeconomics', name: 'AP Microeconomics', category: 'Social Science', icon: '💵' },
  
  // AP World Languages & Cultures
  { subject_id: 'ap_spanish_language', name: 'AP Spanish Language & Culture', category: 'Language', icon: '🇪🇸' },
  { subject_id: 'ap_spanish_literature', name: 'AP Spanish Literature', category: 'Language', icon: '📖' },
  { subject_id: 'ap_french_language', name: 'AP French Language & Culture', category: 'Language', icon: '🇫🇷' },
  { subject_id: 'ap_german_language', name: 'AP German Language & Culture', category: 'Language', icon: '🇩🇪' },
  { subject_id: 'ap_italian_language', name: 'AP Italian Language & Culture', category: 'Language', icon: '🇮🇹' },
  { subject_id: 'ap_chinese_language', name: 'AP Chinese Language & Culture', category: 'Language', icon: '🇨🇳' },
  { subject_id: 'ap_japanese_language', name: 'AP Japanese Language & Culture', category: 'Language', icon: '🇯🇵' },
  { subject_id: 'ap_latin', name: 'AP Latin', category: 'Language', icon: '🏺' },
  
  // AP Arts
  { subject_id: 'ap_art_history', name: 'AP Art History', category: 'Arts', icon: '🎨' },
  { subject_id: 'ap_music_theory', name: 'AP Music Theory', category: 'Arts', icon: '🎵' },
  { subject_id: 'ap_studio_art_2d', name: 'AP Studio Art: 2-D Design', category: 'Arts', icon: '🖼️' },
  { subject_id: 'ap_studio_art_3d', name: 'AP Studio Art: 3-D Design', category: 'Arts', icon: '🗿' },
  { subject_id: 'ap_studio_art_drawing', name: 'AP Studio Art: Drawing', category: 'Arts', icon: '✏️' },
  
  // AP Capstone
  { subject_id: 'ap_seminar', name: 'AP Seminar', category: 'Capstone', icon: '💡' },
  { subject_id: 'ap_research', name: 'AP Research', category: 'Capstone', icon: '🔍' },
];

export default function Practice() {
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const [user, setUser] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [adaptiveMode, setAdaptiveMode] = useState(true);
  const [spacedRepetitionMode, setSpacedRepetitionMode] = useState(false);
  const [recommendedTopics, setRecommendedTopics] = useState([]);
  const [adaptiveEngine, setAdaptiveEngine] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  
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
  const [practiceState, setPracticeState] = useState({ state: PracticeState.IDLE });
  const [showTutor, setShowTutor] = useState(false);
  const [tutorMode, setTutorMode] = useState('closed'); // 'closed', 'hints', 'split'

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        const { user: refreshedUser } = await checkAndResetCredits(currentUser);
        setUser(refreshedUser);
        
        // Initialize adaptive engine
        const engine = new AdaptiveDifficultyEngine(currentUser.email);
        setAdaptiveEngine(engine);
        
        // Load recommended topics for spaced repetition
        const recommended = await SpacedRepetitionHelper.getRecommendedTopics(currentUser.email, 5);
        setRecommendedTopics(recommended);
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

  const { data: backendSubjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      try {
        return await base44.entities.Subject.list('subject_id');
      } catch (e) {
        console.warn('[Practice] Failed to fetch backend subjects, using defaults');
        return [];
      }
    },
  });

  // MERGE BACKEND SUBJECTS WITH DEFAULTS - ALWAYS HAVE SUBJECTS
  const subjects = React.useMemo(() => {
    const subjectMap = new Map();
    
    // CRITICAL: Add base subjects first (Reading & Writing, Math, Science)
    BASE_SUBJECTS.forEach(s => subjectMap.set(s.subject_id, s));
    
    // Add additional defaults
    DEFAULT_SUBJECTS.forEach(s => subjectMap.set(s.subject_id, s));
    
    // Merge backend subjects (deduplicate by lowercase name)
    backendSubjects.forEach(s => {
      const normalizedName = s.name.toLowerCase().trim();
      const existingKeys = Array.from(subjectMap.keys());
      const isDuplicate = existingKeys.some(key => 
        subjectMap.get(key).name.toLowerCase().trim() === normalizedName
      );
      
      if (!isDuplicate) {
        subjectMap.set(s.subject_id, s);
      }
    });
    
    const finalSubjects = Array.from(subjectMap.values());
    
    // DEBUG: Verify base subjects are present
    const hasReadingWriting = finalSubjects.some(s => s.name.toLowerCase().includes('reading'));
    const hasMath = finalSubjects.some(s => s.name.toLowerCase().includes('math'));
    const hasScience = finalSubjects.some(s => s.name.toLowerCase().includes('science'));
    
    console.log('[Practice] Subject validation:', {
      total: finalSubjects.length,
      hasReadingWriting,
      hasMath,
      hasScience,
      subjects: finalSubjects.map(s => s.name)
    });
    
    if (!hasReadingWriting || !hasMath || !hasScience) {
      console.error('⚠️ CRITICAL: Missing base subjects!', {
        hasReadingWriting,
        hasMath,
        hasScience
      });
    }
    
    return finalSubjects;
  }, [backendSubjects]);
  
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
    const WATCHDOG_MS = 25000;
    const timeoutId = setTimeout(() => {
      setIsGenerating(false);
      setGenerationProgress(null);
      setError('Generation timed out. Please try again.');
    }, WATCHDOG_MS);

    try {
      // Skip credit check - allow unlimited generation
      // const { allowed } = await checkCredits(user, 'daily_practice_count');
      // if (!allowed) {
      //   clearTimeout(timeoutId);
      //   setUpgradeModalOpen(true);
      //   setIsGenerating(false);
      //   setGenerationProgress(null);
      //   return;
      // }

      // const updatedUser = await useCredit(user, 'daily_practice_count');
      // setUser(updatedUser);

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

      // BOUNDED GENERATION - Subject-specific College Board level questions
      const result = await SafeQuestionGenerator.generateSafe({
        subject_id: plan.subject_id,
        unit: targetUnit,
        skill: null,
        count: 10,
        difficulty: 'hard',
        onProgress: setGenerationProgress,
        maxTimeMs: 20000,
        ensureUnique: true // Guarantee unique questions per subject/unit
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

    // AUTH GUARDRAIL - Check session before proceeding
    if (!user?.email) {
      console.error('[Practice] Auth check failed - no user session');
      setPracticeState({ 
        state: PracticeState.ERROR, 
        error: 'Please log in to start practice' 
      });
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    if (!selectedSubject) {
      console.error('[Practice] No subject selected');
      setPracticeState({ 
        state: PracticeState.ERROR, 
        error: 'Please select a subject first' 
      });
      return;
    }

    // TRANSITION TO LOADING STATE
    const stateManager = new PracticeStateManager(setPracticeState);
    stateManager.transition(PracticeState.LOADING, { questionCount });
    
    setIsGenerating(true);
    setError(null);
    setGenerationProgress({ phase: 'initializing', current: 0, total: questionCount, message: 'Starting generation...' });

    // HARD TIMEOUT: 25 seconds maximum (LIVENESS GUARANTEE)
    const FRONTEND_WATCHDOG_MS = 25000;
    const timeoutId = setTimeout(() => {
      // FORCE EXIT LOADING STATE
      setIsGenerating(false);
      setGenerationProgress(null);
      setError('Generation timed out. Please try again with fewer questions or a different subject.');
    }, FRONTEND_WATCHDOG_MS);
    
    try {
      // Skip credit check - allow unlimited generation
      // const { allowed } = await checkCredits(user, 'daily_practice_count');
      // if (!allowed) {
      //   clearTimeout(timeoutId);
      //   setUpgradeModalOpen(true);
      //   setIsGenerating(false);
      //   setGenerationProgress(null);
      //   return;
      // }

      // const updatedUser = await useCredit(user, 'daily_practice_count');
      // setUser(updatedUser);

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

      // BOUNDED GENERATION - Subject-specific College Board level difficulty
      const result = await SafeQuestionGenerator.generateSafe({
        subject_id: selectedSubject,
        unit: targetUnit,
        skill: null,
        count: questionCount,
        difficulty: 'hard',
        onProgress: setGenerationProgress,
        maxTimeMs: 20000, // 20s backend limit
        ensureUnique: true // Guarantee unique questions per subject/unit
      });

      // STRICT SCHEMA VALIDATION
      if (!result || !result.questions || result.questions.length === 0) {
        throw new Error('No valid questions generated');
      }

      const validation = validatePracticeData(result.questions);
      if (!validation.valid) {
        console.error('[Practice] Schema validation failed:', validation.error);
        throw new Error(`Invalid question data: ${validation.error}`);
      }

      // SUCCESS - clear watchdog and set questions
      clearTimeout(timeoutId);
      console.log('[Practice] Generation successful:', result.questions.length, 'questions');
      
      const stateManager = new PracticeStateManager(setPracticeState);
      stateManager.transition(PracticeState.GENERATED, { 
        questions: result.questions 
      });
      
      setQuestions(result.questions);
      setGenerationProgress(null);
      setIsGenerating(false);
      
    } catch (e) {
      clearTimeout(timeoutId);
      console.error('[Practice] Generation failed:', e);
      
      // FAILSAFE: Load fallback practice
      console.log('[Practice] Loading fallback practice');
      const fallbackQuestions = getFallbackPractice(selectedSubject);
      
      const stateManager = new PracticeStateManager(setPracticeState);
      stateManager.transition(PracticeState.GENERATED, { 
        questions: fallbackQuestions,
        isFallback: true
      });
      
      setQuestions(fallbackQuestions);
      setError(null);
      setGenerationProgress(null);
      setIsGenerating(false);
      
      // Show toast notification
      console.warn('[Practice] Using fallback questions due to generation error');
    }
  };

  const [currentStreak, setCurrentStreak] = useState(0);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [newBadges, setNewBadges] = useState([]);

  const handleAnswer = (answer) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: answer }));
    
    const question = questions[currentIndex];
    const isCorrect = answer === question.correct_answer;
    
    // Calculate time spent on question
    const timeSpent = questionStartTime 
      ? Math.floor((Date.now() - questionStartTime) / 1000) 
      : 0;
    
    // Update adaptive engine
    if (adaptiveEngine && adaptiveMode) {
      adaptiveEngine.recordAnswer(
        question.id,
        question.skill_name,
        question.difficulty,
        isCorrect,
        timeSpent
      );
    }
    
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

    // Update spaced repetition mastery
    if (user && spacedRepetitionMode) {
      await SpacedRepetitionHelper.updateTopicMastery(
        user.email,
        question.skill_name,
        selectedSubject,
        isCorrect,
        question.difficulty
      );
    }

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
      setQuestionStartTime(Date.now()); // Reset timer for next question
    } else {
      setIsComplete(true);
      queryClient.invalidateQueries({ queryKey: ['attempts'] });
      queryClient.invalidateQueries({ queryKey: ['studyPlans'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
    }
  };

  const resetPractice = () => {
    console.log('[Practice] Reset to idle state');
    const stateManager = new PracticeStateManager(setPracticeState);
    stateManager.transition(PracticeState.IDLE);
    
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

  // RENDER GUARANTEE: Always show UI based on state
  // State: IDLE or ERROR with no questions
  if ((practiceState.state === PracticeState.IDLE || practiceState.state === PracticeState.ERROR) && questions.length === 0 && !isGenerating) {
    return (
      <>
        <div className="page-header">
          <h1 className="page-title">Practice Mode</h1>
          <p className="page-description">Choose what to practice</p>
          {practiceState.state === PracticeState.ERROR && practiceState.error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 font-medium">⚠️ {practiceState.error}</p>
            </div>
          )}
          {user?.plan === 'free' && (
            <p className="text-sm text-slate-500 mt-2">
              Daily practice exams: {(user.daily_practice_count || 0)}/5 used
            </p>
          )}
        </div>

        <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Subject Selector - ALWAYS VISIBLE */}
          <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-6 shadow-lg">
            <label className="text-sm font-medium text-[#F5F5F5] mb-3 block">Select Subject</label>
            <Select 
              value={selectedSubject} 
              onValueChange={(value) => {
                console.log('[Practice] Subject selected:', value);
                setSelectedSubject(value);
                setSelectedUnit('');
              }}
              disabled={subjectsLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a subject" />
              </SelectTrigger>
              <SelectContent className="max-h-96 z-[1000]">
                {(
                  (() => {
                    const uniqueSubjects = Array.from(
                      new Map(subjects.map(s => [s.subject_id, s])).values()
                    );
                    
                    const grouped = uniqueSubjects.reduce((acc, subject) => {
                      const category = subject.category || 'Other';
                      if (!acc[category]) acc[category] = [];
                      acc[category].push(subject);
                      return acc;
                    }, {});
                    
                    return Object.entries(grouped).map(([category, categorySubjects]) => (
                      <div key={category}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-[#D6B98C] uppercase tracking-wider">
                          {category}
                        </div>
                        {categorySubjects.map((subject) => (
                          <SelectItem key={subject.subject_id} value={subject.subject_id}>
                            <div className="flex items-center gap-2">
                              {subject.icon && <span>{subject.icon}</span>}
                              <span>{subject.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    ));
                  })()
                )}
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
                className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-6 shadow-lg"
              >
                <label className="text-sm font-medium text-[#F5F5F5] mb-3 block">Select Unit (Optional)</label>
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All units or choose specific" />
                  </SelectTrigger>
                  <SelectContent className="max-h-96 z-[1000]">
                    <SelectItem value="all" className="font-semibold">
                      ✨ All Units (Mixed Practice)
                    </SelectItem>
                    {units.sort((a, b) => a.unit_number - b.unit_number).map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        Unit {unit.unit_number}: {unit.unit_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Skill Selector */}
          <AnimatePresence>
            {selectedSubject && skills.filter(s => s.subject_id === selectedSubject).length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-6 shadow-lg"
              >
                <label className="text-sm font-medium text-[#F5F5F5] mb-3 block">Focus on Specific Skills (Optional)</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {skills
                    .filter(s => s.subject_id === selectedSubject)
                    .filter(s => !selectedUnit || selectedUnit === 'all' || s.unit_id === selectedUnit)
                    .slice(0, 20)
                    .map((skill) => (
                      <button
                        key={skill.id}
                        onClick={() => {
                          setSelectedSkills(prev => 
                            prev.includes(skill.id) 
                              ? prev.filter(id => id !== skill.id)
                              : [...prev, skill.id]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedSkills.includes(skill.id)
                            ? 'bg-[#D6B98C] text-[#0C0C0C]'
                            : 'bg-[#171717] text-[#B5B5B5] border border-[#2A2A2A] hover:border-[#D6B98C]/50'
                        }`}
                      >
                        {skill.skill_name}
                      </button>
                    ))}
                </div>
                {selectedSkills.length > 0 && (
                  <button
                    onClick={() => setSelectedSkills([])}
                    className="mt-2 text-xs text-[#8A8A8A] hover:text-[#F5F5F5]"
                  >
                    Clear selection ({selectedSkills.length} selected)
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Spaced Repetition Recommendations */}
          {recommendedTopics.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-xl border border-violet-500/30 p-6 shadow-lg"
            >
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-violet-400" />
                <h3 className="text-sm font-semibold text-[#F5F5F5]">📚 Recommended Review Topics</h3>
              </div>
              <p className="text-xs text-[#8A8A8A] mb-3">Based on spaced repetition and your performance</p>
              <div className="space-y-2">
                {recommendedTopics.slice(0, 3).map((topic, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#171717] rounded-lg p-3 border border-[#2A2A2A]">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#F5F5F5]">{topic.topic_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-[#8A8A8A]">
                          {topic.mastery_level} • {topic.accuracy.toFixed(0)}% accuracy
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSpacedRepetitionMode(true);
                        const topicSkills = skills.filter(s => 
                          s.skill_name.toLowerCase().includes(topic.topic_name.toLowerCase())
                        );
                        if (topicSkills.length > 0) {
                          setSelectedSkills([topicSkills[0].id]);
                          setSelectedSubject(topicSkills[0].subject_id);
                        }
                      }}
                      className="px-3 py-1 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded text-xs font-medium"
                    >
                      Practice
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Practice Mode Options */}
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-6 shadow-lg"
          >
            <label className="text-sm font-medium text-[#F5F5F5] mb-3 block">Practice Mode</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={adaptiveMode}
                  onChange={(e) => setAdaptiveMode(e.target.checked)}
                  className="w-4 h-4 rounded border-[#2A2A2A] bg-[#171717] text-[#D6B98C] focus:ring-[#D6B98C]"
                />
                <div className="flex-1">
                  <p className="text-sm text-[#F5F5F5]">🎯 Adaptive Difficulty</p>
                  <p className="text-xs text-[#8A8A8A]">AI adjusts question difficulty based on your performance</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={spacedRepetitionMode}
                  onChange={(e) => setSpacedRepetitionMode(e.target.checked)}
                  className="w-4 h-4 rounded border-[#2A2A2A] bg-[#171717] text-[#D6B98C] focus:ring-[#D6B98C]"
                />
                <div className="flex-1">
                  <p className="text-sm text-[#F5F5F5]">📅 Spaced Repetition</p>
                  <p className="text-xs text-[#8A8A8A]">Focus on topics you struggle with at optimal intervals</p>
                </div>
              </label>
            </div>
          </motion.div>

          {/* Question Count */}
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-6 shadow-lg"
          >
            <label className="text-sm font-medium text-[#F5F5F5] mb-3 block">
              Number of Questions
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={questionCount}
              onChange={(e) => {
                const val = Math.min(100, Math.max(1, parseInt(e.target.value) || 10));
                setQuestionCount(val);
              }}
              className="w-full px-4 py-3 rounded-lg border border-[#2A2A2A] bg-[#171717] text-[#F5F5F5] text-base font-medium focus:outline-none focus:ring-2 focus:ring-[#D6B98C]/50"
              placeholder="Enter number (1-100)"
            />
            <p className="text-xs text-[#8A8A8A] mt-2">Choose as many questions as you want (up to 100)</p>
          </motion.div>

          {/* Start Button */}
          <div className="mt-6 space-y-2">
            <button
              type="button"
              onClick={generateQuestions}
              disabled={isGenerating || !selectedSubject}
              className="w-full h-14 px-6 text-base font-semibold rounded-xl bg-[#D6B98C] hover:bg-[#C9A96A] text-[#0C0C0C] shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              <p className="text-xs text-[#8A8A8A] text-center">
                Please select a subject to start practice
              </p>
            )}
          </div>
        </motion.div>
      </>
    );
  }

  // LOADING STATE - Must be visible (simplified - no progress counter)
  if (practiceState.state === PracticeState.LOADING || isGenerating) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <Loader2 className="w-16 h-16 text-[#D6B98C] animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-[#F5F5F5] mb-2">Generating Practice Questions</h2>
        <p className="text-[#B5B5B5]">Preparing your custom practice session...</p>
        <p className="text-xs text-[#8A8A8A] mt-2">This may take a few moments</p>
      </div>
    );
  }

  // ERROR STATE - Must show error UI (backup if state machine fails)
  if (error && questions.length === 0) {
    return (
      <GenerationErrorBoundary
        error={error}
        onRetry={() => {
          setError(null);
          setPracticeState({ state: PracticeState.IDLE });
          generateQuestions();
        }}
        onCancel={() => {
          setError(null);
          setPracticeState({ state: PracticeState.IDLE });
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
          className="bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] p-8 text-center mb-6 shadow-lg"
        >
          <Target className="w-16 h-16 mx-auto mb-4 text-[#D6B98C]" />
          <h1 className="text-3xl font-bold text-[#F5F5F5] mb-2">Practice Complete!</h1>
          <p className="text-4xl font-bold text-[#D6B98C] mb-4">{accuracy.toFixed(0)}%</p>
          <p className="text-[#B5B5B5]">{correctCount} out of {questions.length} correct</p>
          
          {sessionPoints > 0 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="px-4 py-2 bg-[#D6B98C]/20 rounded-lg">
                <p className="text-2xl font-bold text-[#D6B98C]">+{sessionPoints}</p>
                <p className="text-xs text-[#8A8A8A]">Points Earned</p>
              </div>
              {currentStreak > 0 && (
                <div className="px-4 py-2 bg-orange-500/20 rounded-lg">
                  <p className="text-2xl font-bold text-orange-400">{currentStreak}</p>
                  <p className="text-xs text-[#8A8A8A]">Max Streak</p>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {newBadges.length > 0 && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#1E1E1E] rounded-2xl border border-[#D6B98C]/30 p-6 mb-6"
          >
            <h3 className="text-xl font-bold text-[#F5F5F5] mb-4 text-center">🎉 New Badges Earned!</h3>
            <div className="grid grid-cols-2 gap-3">
              {newBadges.map((badge) => (
                <div key={badge.id} className="bg-[#171717] rounded-lg p-4 text-center">
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <p className="font-semibold text-[#F5F5F5]">{badge.name}</p>
                  <p className="text-xs text-[#8A8A8A] mt-1">{badge.description}</p>
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

  // ACTIVE PRACTICE STATE - Only render if we have questions
  if (practiceState.state !== PracticeState.GENERATED && questions.length === 0) {
    console.error('[Practice] Invalid state: trying to render practice without questions');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-red-500/10 border border-red-500/30 rounded-xl">
          <h2 className="text-2xl font-bold text-red-400 mb-4">⚠️ Practice Error</h2>
          <p className="text-[#B5B5B5] mb-4">Something went wrong. No questions available.</p>
          <Button onClick={resetPractice}>Start Over</Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const answered = answers[currentIndex] !== undefined;

  // Show fallback notification if applicable
  const isFallback = practiceState.isFallback;

  return (
    <div className="min-h-screen focus-mode">
      <div className="sticky top-0 focus-mode-card border-b z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm focus-mode-text-secondary">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <div className="flex gap-2">
              <Button
                variant={tutorMode === 'hints' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTutorMode(tutorMode === 'hints' ? 'closed' : 'hints')}
              >
                💡 Hints
              </Button>
              <Button
                variant={tutorMode === 'split' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTutorMode(tutorMode === 'split' ? 'closed' : 'split')}
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                AI Tutor
              </Button>
            </div>
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

      <div className={cn("mx-auto px-4 py-6", tutorMode === 'split' ? "max-w-7xl" : "max-w-4xl")}>
        <div className={cn("grid gap-6", tutorMode === 'split' && "lg:grid-cols-2")}>
        {/* Question Panel */}
        <div>
          {isFallback && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-sm">
                ℹ️ Using practice questions while custom generation loads
              </p>
            </div>
          )}
          
          {/* Hints Panel */}
          {tutorMode === 'hints' && !answered && currentQuestion.hint && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <h4 className="font-semibold text-[#F5F5F5] mb-1">Hint</h4>
                  <p className="text-sm text-[#B5B5B5]">{currentQuestion.hint}</p>
                </div>
              </div>
            </motion.div>
          )}
          
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

        {/* Split-Screen AI Tutor */}
        {tutorMode === 'split' && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:sticky lg:top-24 h-fit"
          >
            <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#F5F5F5]">🤖 AI Tutor</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setTutorMode('closed')}
                >
                  Close
                </Button>
              </div>
              <EnhancedAITutor
                context={{
                  type: 'practice',
                  subject: selectedSubject,
                  currentQuestion: currentQuestion,
                  initialPrompt: `Help me understand this ${selectedSubject} question. What approach should I take?`
                }}
                userEmail={user?.email}
                inline={true}
              />
            </div>
          </motion.div>
        )}
        </div>
      </div>
    </div>
  );
}