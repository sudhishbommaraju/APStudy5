import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, Target, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import QuestionCard from '@/components/ui/QuestionCard';
import UpgradeModal from '@/components/monetization/UpgradeModal';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { checkAndResetCredits, checkCredits, useCredit } from '@/components/monetization/CreditHelper';
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
    
    // Auto-generate for study plan
    if (location.state?.autoGenerate && location.state?.studyPlan && user) {
      const plan = location.state.studyPlan;
      setStudyPlanId(plan.id);
      setSelectedSubject(plan.subject_id);
      
      // Auto-generate immediately
      generateQuestionsForPlan(plan);
    }
  }, [location.state, user]);

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list('subject_id'),
  });

  const selectedSubjectData = subjects.find(s => s.subject_id === selectedSubject);
  const isStandardizedTest = selectedSubjectData?.category === 'Standardized';

  const { data: units = [] } = useQuery({
    queryKey: ['units', selectedSubject],
    queryFn: () => base44.entities.Unit.filter({ subject_id: selectedSubject }),
    enabled: !!selectedSubject,
  });

  const generateQuestionsForPlan = async (plan) => {
    setIsGenerating(true);
    setError(null);

    try {
      const { allowed } = await checkCredits(user, 'daily_practice_count');
      if (!allowed) {
        setUpgradeModalOpen(true);
        setIsGenerating(false);
        return;
      }

      const updatedUser = await useCredit(user, 'daily_practice_count');
      setUser(updatedUser);

      const subject = subjects.find(s => s.subject_id === plan.subject_id);
      
      // Fetch units for this subject
      const planUnits = await base44.entities.Unit.filter({ subject_id: plan.subject_id });
      
      // Use first unit from plan's unit_ids, or random unit if no specific units
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

      const count = 10; // Default for study plans

      // Generate questions
      const llmPromises = [];
      for (let i = 0; i < count; i++) {
        let contextInstructions = `Generate an exam-style multiple choice question for ${subject.name}. Unit: ${targetUnit.unit_name}`;

        const prompt = `${contextInstructions}

CRITICAL LATEX FORMATTING RULES:
1. Chemical formulas: Use LaTeX with subscripts, write ONCE
   ✓ CORRECT: "$CH_{4}$"
   ✗ WRONG: "CH₄CH4" or "$CH_{4}$CH4"
2. Temperature: Use \\text{°C} inside math mode
3. NO DUPLICATION: Write each formula ONCE only
4. PERCENTAGES: Plain text - "80%" NOT "$80\\%$"

Return JSON with: question_text, choice_a, choice_b, choice_c, choice_d, correct_answer ("A"/"B"/"C"/"D"), explanation, hint`;

        llmPromises.push(
          base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
              type: 'object',
              properties: {
                question_text: { type: 'string' },
                table_data: { type: 'string' },
                graph_data: { type: 'string' },
                choice_a: { type: 'string' },
                choice_b: { type: 'string' },
                choice_c: { type: 'string' },
                choice_d: { type: 'string' },
                correct_answer: { type: 'string' },
                explanation: { type: 'string' },
                hint: { type: 'string' },
              },
              required: ['question_text', 'choice_a', 'choice_b', 'choice_c', 'choice_d', 'correct_answer', 'explanation'],
            },
          })
        );
      }

      const responses = await Promise.all(llmPromises);

      const createdQuestions = await Promise.all(
        responses.map(r =>
          base44.entities.Question.create({
            subject_id: plan.subject_id,
            unit_id: targetUnit.id,
            skill_id: '',
            unit_name: targetUnit.unit_name,
            skill_name: 'General',
            difficulty: 'medium',
            question_text: r.question_text,
            table_data: r.table_data || '',
            graph_data: r.graph_data || '',
            choice_a: r.choice_a,
            choice_b: r.choice_b,
            choice_c: r.choice_c,
            choice_d: r.choice_d,
            correct_answer: r.correct_answer,
            explanation: r.explanation,
            wrong_answer_explanations: {},
            hint: r.hint || '',
            is_ai_generated: true,
          })
        )
      );

      setQuestions(createdQuestions);
      setIsGenerating(false);
    } catch (e) {
      console.error('Failed to generate questions:', e);
      setError(e.message);
      setIsGenerating(false);
      alert(`Failed to generate questions: ${e.message}`);
    }
  };

  const generateQuestions = async () => {
    if (!user) {
      alert('Please wait while your account loads...');
      return;
    }

    // Check credits
    const { allowed } = await checkCredits(user, 'daily_practice_count');
    if (!allowed) {
      setUpgradeModalOpen(true);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Use credit
      const updatedUser = await useCredit(user, 'daily_practice_count');
      setUser(updatedUser);

      // Determine what to generate
      let targetSubjects = [];
      let targetUnits = [];

      if (!selectedSubject) {
        // All subjects - pick random subjects
        targetSubjects = subjects.slice(0, 3); // Mix from multiple subjects
      } else {
        targetSubjects = [subjects.find(s => s.subject_id === selectedSubject)];
      }

      // Fetch units for each subject
      for (const subject of targetSubjects) {
        const subjectUnits = await base44.entities.Unit.filter({ subject_id: subject.subject_id });
        if (!selectedUnit) {
          // All units - add all units from this subject
          targetUnits.push(...subjectUnits.map(u => ({ ...u, subject })));
        } else {
          // Specific unit
          const unit = subjectUnits.find(u => u.id === selectedUnit);
          if (unit) targetUnits.push({ ...unit, subject });
        }
      }

      if (targetUnits.length === 0) {
        throw new Error('No units found to generate questions from');
      }

      // Generate questions via LLM
      const llmPromises = [];
      for (let i = 0; i < questionCount; i++) {
        // Pick random unit for variety
        const randomUnit = targetUnits[Math.floor(Math.random() * targetUnits.length)];
        const subject = randomUnit.subject;
        const unit = randomUnit;

        let contextInstructions = `Generate an exam-style multiple choice question for ${subject.name}. Unit: ${unit.unit_name}`;

        // SAT/ACT specific instructions
        if (subject.subject_id === 'sat' && unit.unit_name === 'Math') {
          contextInstructions = `Generate a SAT Math question. Topics include: algebra, problem-solving, data analysis, advanced math (quadratics, exponentials, functions), geometry, trigonometry. Use real SAT format and difficulty.`;
        } else if (subject.subject_id === 'sat' && unit.unit_name === 'Reading and Writing') {
          contextInstructions = `Generate a SAT Reading and Writing question. Include a short passage (2-4 sentences) about literature, history, science, or social studies. Ask about grammar, vocabulary in context, rhetorical skills, or comprehension. Use real SAT format.`;
        } else if (subject.subject_id === 'act' && unit.unit_name === 'Math') {
          contextInstructions = `Generate an ACT Math question. Topics include: pre-algebra, elementary algebra, intermediate algebra, coordinate geometry, plane geometry, trigonometry. Use real ACT format and difficulty.`;
        } else if (subject.subject_id === 'act' && unit.unit_name === 'English') {
          contextInstructions = `Generate an ACT English question. Include a sentence or short passage with grammar, punctuation, sentence structure, strategy, organization, or style issues. Test grammar rules, rhetorical skills, and writing conventions. Use real ACT format.`;
        } else if (subject.subject_id === 'act' && unit.unit_name === 'Reading') {
          contextInstructions = `Generate an ACT Reading question. Include a passage excerpt (3-5 sentences) from prose fiction, social science, humanities, or natural science. Ask about main ideas, details, inferences, vocabulary, or author's craft. Use real ACT format.`;
        } else if (subject.subject_id === 'act' && unit.unit_name === 'Science') {
          contextInstructions = `Generate an ACT Science question. Present data (describe a chart/graph/experiment) about biology, chemistry, physics, or earth science. Ask about data interpretation, scientific investigation, or evaluation of models. Use real ACT format.`;
        }

        const prompt = `${contextInstructions}

CRITICAL LATEX FORMATTING RULES:

1. Chemical formulas: Use LaTeX with subscripts, write ONCE
   ✓ CORRECT: "$CH_{4}$"
   ✗ WRONG: "CH₄CH4" or "$CH_{4}$CH4"

2. Temperature: Use \\text{°C} inside math mode
   ✓ CORRECT: "$-161.5\\text{°C}$"
   ✗ WRONG: "-161.5ext°C" or "ext°C"

3. NO DUPLICATION: Write each formula ONCE only
4. PERCENTAGES: Plain text - "80%" NOT "$80\\%$"

Return JSON with: question_text, choice_a, choice_b, choice_c, choice_d, correct_answer ("A"/"B"/"C"/"D"), explanation, hint`;

        llmPromises.push(
          base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
              type: 'object',
              properties: {
                question_text: { type: 'string' },
                table_data: { type: 'string' },
                graph_data: { type: 'string' },
                choice_a: { type: 'string' },
                choice_b: { type: 'string' },
                choice_c: { type: 'string' },
                choice_d: { type: 'string' },
                correct_answer: { type: 'string' },
                explanation: { type: 'string' },
                hint: { type: 'string' },
              },
              required: ['question_text', 'choice_a', 'choice_b', 'choice_c', 'choice_d', 'correct_answer', 'explanation'],
            },
          }).then(r => ({ ...r, unit, subject }))
        );
      }

      const responses = await Promise.all(llmPromises);

      // Create question entities
      const createdQuestions = await Promise.all(
        responses.map(({ unit, subject, ...r }) =>
          base44.entities.Question.create({
            subject_id: subject.subject_id,
            unit_id: unit.id,
            skill_id: '',
            unit_name: unit.unit_name,
            skill_name: 'General',
            difficulty: 'medium',
            question_text: r.question_text,
            table_data: r.table_data || '',
            graph_data: r.graph_data || '',
            choice_a: r.choice_a,
            choice_b: r.choice_b,
            choice_c: r.choice_c,
            choice_d: r.choice_d,
            correct_answer: r.correct_answer,
            explanation: r.explanation,
            wrong_answer_explanations: {},
            hint: r.hint || '',
            is_ai_generated: true,
          })
        )
      );

      setQuestions(createdQuestions);
      setIsGenerating(false);
    } catch (e) {
      console.error('Failed to generate questions:', e);
      setError(e.message);
      setIsGenerating(false);
      alert(`Failed to generate questions: ${e.message}`);
    }
  };

  const handleAnswer = (answer) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: answer }));
    
    const question = questions[currentIndex];
    if (answer === question.correct_answer) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#6366F1', '#8B5CF6', '#A78BFA']
      });
    }
  };

  const handleNext = async () => {
    const question = questions[currentIndex];
    const selectedAnswer = answers[currentIndex];

    // Record attempt
    await base44.entities.Attempt.create({
      question_id: question.id,
      subject_id: selectedSubject,
      unit_id: question.unit_id,
      skill_id: question.skill_id,
      skill_name: question.skill_name,
      difficulty: question.difficulty,
      selected_answer: selectedAnswer,
      correct_answer: question.correct_answer,
      is_correct: selectedAnswer === question.correct_answer,
      mode: 'practice',
      error_type: 'none',
    });

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
                <SelectItem value="all" className="text-white font-semibold">
                  ✨ All Subjects (Mixed Practice)
                </SelectItem>
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
          <div className="mt-6">
            <button
              type="button"
              onClick={generateQuestions}
              disabled={isGenerating}
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
                  {!selectedSubject && ' - All Subjects'}
                  {selectedSubject && (!selectedUnit || selectedUnit === 'all') && ' - All Units'}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </>
    );
  }

  // Loading state
  if (isGenerating) {
    return (
      <div className="min-h-screen focus-mode flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: 'var(--color-focus-accent)' }} />
          <p className="focus-mode-text font-medium">Generating practice questions...</p>
          <p className="focus-mode-text-secondary text-sm mt-2">This may take 10-20 seconds</p>
        </div>
      </div>
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
          className="bg-white rounded-2xl border border-slate-200 p-8 text-center mb-6 shadow-lg"
        >
          <Target className="w-16 h-16 mx-auto mb-4 text-indigo-600" />
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Practice Complete!</h1>
          <p className="text-4xl font-bold text-indigo-600 mb-4">{accuracy.toFixed(0)}%</p>
          <p className="text-slate-500">{correctCount} out of {questions.length} correct</p>
        </motion.div>

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
          <span className="text-sm focus-mode-text-secondary">
            Question {currentIndex + 1} of {questions.length}
          </span>
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