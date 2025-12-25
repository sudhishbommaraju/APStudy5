import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, ChevronLeft, Target, BookOpen, Zap, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import QuestionCard from '@/components/ui/QuestionCard';
import StudyPlanCard from '@/components/study/StudyPlanCard';
import MasteryBadge from '@/components/study/MasteryBadge';
import ErrorTypeSelector from '@/components/exam/ErrorTypeSelector';
import ErrorTypeFeedback from '@/components/ui/ErrorTypeFeedback';
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
  const [user, setUser] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [customQuestionCount, setCustomQuestionCount] = useState(10);
  const [practiceState, setPracticeState] = useState('setup'); // 'setup', 'practicing', 'complete'
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [generating, setGenerating] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        const { user: refreshedUser } = await checkAndResetCredits(currentUser);
        setUser(refreshedUser);
      } catch (e) {
        // User not authenticated, continue without user
      }
    };
    loadUser();
  }, []);

  // Handle preloaded questions from Dashboard
  useEffect(() => {
    if (location.state?.preloadedQuestions && location.state?.subjectId) {
      setCurrentQuestions(location.state.preloadedQuestions);
      setSelectedSubject(location.state.subjectId);
      setPracticeState('practicing');
      setGenerating(false);
    }
  }, [location.state]);



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

  const startPractice = async () => {
    if (!selectedSubject || !selectedUnit) return;
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
    
    setGenerating(true);
    
    try {
      // Use a credit
      const updatedUser = await useCredit(user, 'daily_practice_count');
      setUser(updatedUser);
      const subject = subjects.find(s => s.subject_id === selectedSubject);
      const unit = units.find(u => u.id === selectedUnit);
      const questionsToGenerate = [];

      for (let i = 0; i < questionCount; i++) {
        let contextInstructions = '';

        // SAT/ACT specific instructions
        if (selectedSubject === 'sat' && unit?.unit_name === 'Math') {
          contextInstructions = `Generate a SAT Math question. Topics include: algebra, problem-solving, data analysis, advanced math (quadratics, exponentials, functions), geometry, trigonometry. Use real SAT format and difficulty.`;
        } else if (selectedSubject === 'sat' && unit?.unit_name === 'Reading and Writing') {
          contextInstructions = `Generate a SAT Reading and Writing question. Include a short passage (2-4 sentences) about literature, history, science, or social studies. Ask about grammar, vocabulary in context, rhetorical skills, or comprehension. Use real SAT format.`;
        } else if (selectedSubject === 'act' && unit?.unit_name === 'Math') {
          contextInstructions = `Generate an ACT Math question. Topics include: pre-algebra, elementary algebra, intermediate algebra, coordinate geometry, plane geometry, trigonometry. Use real ACT format and difficulty.`;
        } else if (selectedSubject === 'act' && unit?.unit_name === 'English') {
          contextInstructions = `Generate an ACT English question. Include a sentence or short passage with grammar, punctuation, sentence structure, strategy, organization, or style issues. Test grammar rules, rhetorical skills, and writing conventions. Use real ACT format.`;
        } else if (selectedSubject === 'act' && unit?.unit_name === 'Reading') {
          contextInstructions = `Generate an ACT Reading question. Include a passage excerpt (3-5 sentences) from prose fiction, social science, humanities, or natural science. Ask about main ideas, details, inferences, vocabulary, or author's craft. Use real ACT format.`;
        } else if (selectedSubject === 'act' && unit?.unit_name === 'Science') {
          contextInstructions = `Generate an ACT Science question. Present data (describe a chart/graph/experiment) about biology, chemistry, physics, or earth science. Ask about data interpretation, scientific investigation, or evaluation of models. Use real ACT format.`;
        } else {
          contextInstructions = `Generate an exam-style multiple choice question for ${subject?.name || 'general topic'}. Unit: ${unit?.unit_name || 'General'}`;
        }

        const prompt = `${contextInstructions}

        TABLES AND GRAPHS (For Science/Math):
        - If the question involves data analysis, comparisons, or scientific results, include a table or graph description
        - Format tables as markdown: | Header 1 | Header 2 |\n|---------|----------|\n| Data 1 | Data 2 |
        - For graphs, describe the data points as JSON: {"type": "line/bar/scatter", "data": [{"x": 1, "y": 2}, ...], "labels": {"x": "Time (s)", "y": "Distance (m)"}}
        - Only include visual data when it enhances understanding

        CRITICAL LATEX FORMATTING RULES - FOLLOW EXACTLY:

        1. CHEMICAL FORMULAS: ALWAYS use LaTeX with _ for subscripts, write ONCE
           ✓ CORRECT: "$CH_{4}$"
           ✗ WRONG: "CH₄CH4" or "$CH_{4}$CH4" or "CH4" or "ext" corruption
           
           ✓ CORRECT: "$H_{2}O$"
           ✗ WRONG: "H₂OH2O" or "$H_{2}O$H2O" or "H2O" or "ext" corruption
           
           ✓ CORRECT: "$NH_{3}$"
           ✗ WRONG: "NH₃NH3" or "$NH_{3}$NH3" or "NH3" or "ext" corruption
           
           ✓ CORRECT: "$N_{2}$"
           ✗ WRONG: "N₂N2" or "$N_{2}$N2" or "N2" or "ext" corruption

        2. TEMPERATURE UNITS: Use \\text{°C} properly inside math mode
           ✓ CORRECT: "$-161.5\\text{°C}$"
           ✗ WRONG: "-161.5ext°C" or "ext°C" or any "ext" corruption

        3. EXPONENTS: Use ^ with curly braces
           ✓ CORRECT: "$x^{2}$"
           ✗ WRONG: "x²" or "x^2" (without $)

        4. FRACTIONS: Use \\frac{}{} inside math mode
           ✓ CORRECT: "$\\frac{v^{2}}{r}$"
           ✗ WRONG: "v²/r" or "v^2/r"

        5. NO DUPLICATION: Write formula ONCE only in LaTeX
           - NEVER write both unicode and LaTeX versions
           - NEVER write formula twice in any form
           - NEVER have corrupted "ext" text

        6. PERCENTAGES: Plain text, not in math mode
           ✓ CORRECT: "80%"
           ✗ WRONG: "$80\\%$"
        
        EXAMPLES - ANSWER CHOICES (FOLLOW EXACTLY):

        Chemistry with boiling points:
        ✓ CORRECT: "$CH_{4}$ (boiling point: $-161.5\\text{°C}$)"
        ✗ WRONG: "CH₄CH4 (boiling point: -161.5ext°C-161.5ext°C)"
        ✗ WRONG: "$CH_{4}$CH4 (boiling point: -161.5ext°C)"
        
        ✓ CORRECT: "$H_{2}O$ (boiling point: $100\\text{°C}$)"
        ✗ WRONG: "H₂OH2O (boiling point: 100ext°C100ext°C)"
        ✗ WRONG: "$H_{2}O$H2O (boiling point: 100ext°C)"
        
        ✓ CORRECT: "$NH_{3}$ (boiling point: $-33.3\\text{°C}$)"
        ✗ WRONG: "NH₃NH3 (boiling point: -33.3ext°C-33.3ext°C)"
        
        ✓ CORRECT: "$N_{2}$ (boiling point: $-195.8\\text{°C}$)"
        ✗ WRONG: "N₂N2 (boiling point: -195.8ext°C-195.8ext°C)"

        Simple chemistry:
        ✓ CORRECT: "$NaCl$"
        ✗ WRONG: "NaClNaCl" or "$NaCl$NaCl"
        
        ✓ CORRECT: "$CO_{2}$"
        ✗ WRONG: "CO₂CO2" or "$CO_{2}$CO2"

        ABSOLUTE RULE: Each choice contains ONLY LaTeX formulas written ONCE. NO unicode subscripts. NO "ext" corruption. NO duplication.

        EXPLANATION FORMAT (FOLLOW EXACTLY):

        "Brief concept explanation.

        The formula is:

        $$
        [equation with \\frac{}{} for fractions, proper exponents]
        $$

        Given values:

        $$
        [var] = [value] \\text{ [unit]}
        $$

        Substituting:

        $$
        [step 1 with \\frac{}{} if needed]
        $$

        $$
        [step 2]
        $$

        $$
        [result] = [answer] \\text{ [unit]}
        $$

        Final answer in plain text. Percentages like 80% stay as plain text."

        CORRECT EXAMPLES:

        Physics acceleration:
        "The centripetal acceleration formula is:

        $$
        a_{c} = \\frac{v^{2}}{r}
        $$

        Given:

        $$
        v = 10 \\text{ m/s}, \\quad r = 5 \\text{ m}
        $$

        Calculate:

        $$
        a_{c} = \\frac{(10)^{2}}{5} = \\frac{100}{5} = 20 \\text{ m/s}^{2}
        $$

        The answer is 20 m/s²."

        Math derivative:
        "Using the power rule:

        $$
        \\frac{d}{dx}[x^{n}] = nx^{n-1}
        $$

        For $x^{3}$:

        $$
        \\frac{d}{dx}[x^{3}] = 3x^{2}
        $$"

        Percentage:
        "The solution is 85% correct."
        (Note: Plain text, NOT $85\\%$)

        NEVER WRITE (COMMON MISTAKES):
        - CH₄CH4 or $CH_{4}$CH4 (duplicated - write "$CH_{4}$" ONCE)
        - H₂OH2O or $H_{2}O$H2O (duplicated - write "$H_{2}O$" ONCE)
        - NH₃NH3 or $NH_{3}$NH3 (duplicated - write "$NH_{3}$" ONCE)
        - N₂N2 or $N_{2}$N2 (duplicated - write "$N_{2}$" ONCE)
        - "-161.5ext°C" or "100ext°C" or ANY "ext" corruption (use "$-161.5\\text{°C}$")
        - "ext" appearing ANYWHERE (this means broken LaTeX)
        - Unicode subscripts like ₂ ₃ ₄ (use LaTeX: $_{2}$ $_{3}$ $_{4}$)
        - Unicode superscripts like ² ³ (use LaTeX: $^{2}$ $^{3}$)
        - Plain text formulas without $ delimiters
        - Any duplication of formulas in any form

        For the explanation:
        - Use the format shown above EXACTLY
        - Each equation appears ONCE in its own $$ block
        - Plain English between blocks
        - Units always in \\text{} with proper spacing

        CRITICAL RULES FOR ANSWER CHOICES:

        1. NO DUPLICATION: Each choice contains the value ONCE only
           - Correct: choice_a: "$H_{2}O$"
           - Wrong: choice_a: "$H_{2}O$H2O"
           - Wrong: choice_a: "H₂OH2O"

        2. LaTeX format for all formulas/chemicals, written ONCE:
           - choice_a: "$H_{2}O$"  NOT "$H_{2}O$H2O" or "H2O" or "H₂OH2O"
           - choice_b: "$CH_{4}$"  NOT "$CH_{4}$CH4" or "CH4" or "CH₄CH4"
           - choice_c: "$NaCl$"  NOT "$NaCl$NaCl" or "NaCl" or "NaClNaCl"

        3. ANSWER CONSISTENCY:
           - Calculate correct answer using the math shown
           - correct_answer field must match the choice with the right value

Return JSON with: question_text, choice_a, choice_b, choice_c, choice_d, correct_answer ("A"/"B"/"C"/"D"), explanation, wrong_answer_explanations (object with A/B/C/D keys), hint

VERIFY BEFORE RETURNING: Check that choice_a, choice_b, choice_c, choice_d each contain NO duplicated text`;

        questionsToGenerate.push(
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
                wrong_answer_explanations: { 
                  type: 'object',
                  properties: {
                    A: { type: 'string' },
                    B: { type: 'string' },
                    C: { type: 'string' },
                    D: { type: 'string' }
                  }
                },
                hint: { type: 'string' },
              },
              required: ['question_text', 'choice_a', 'choice_b', 'choice_c', 'choice_d', 'correct_answer', 'explanation'],
            },
          })
        );
      }

      const responses = await Promise.all(questionsToGenerate);
      
      const questions = await Promise.all(
        responses.map(r => 
          base44.entities.Question.create({
            subject_id: selectedSubject,
            unit_id: selectedUnit,
            skill_id: '',
            unit_name: unit?.unit_name || '',
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
            wrong_answer_explanations: r.wrong_answer_explanations || {},
            hint: r.hint || '',
            is_ai_generated: true,
          })
        )
      );

      setCurrentQuestions(questions);
      setPracticeState('practicing');
    } catch (e) {
      console.error('Failed to start practice:', e);
      alert('Failed to generate questions. Please try again.');
      setGenerating(false);
      setPracticeState('setup');
      return;
    }
    setGenerating(false);
  };

  const handleAnswer = (answer) => {
    setAnswers(prev => ({
      ...prev,
      [currentIndex]: answer,
    }));
    
    // Trigger confetti on correct answer
    const question = currentQuestions[currentIndex];
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
    const question = currentQuestions[currentIndex];
    const selectedAnswer = answers[currentIndex];
    const isCorrect = selectedAnswer === question.correct_answer;

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
      is_correct: isCorrect,
      mode: 'practice',
      error_type: 'none',
    });

    if (currentIndex < currentQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      await completePractice();
    }
  };



  const completePractice = async () => {
    setPracticeState('complete');
    queryClient.invalidateQueries({ queryKey: ['attempts'] });
  };

  const currentQuestion = currentQuestions[currentIndex];
  const answered = answers[currentIndex] !== undefined;
  const isCorrect = answered && answers[currentIndex] === currentQuestion?.correct_answer;

  // Setup view
  if (practiceState === 'setup') {
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

          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Subject Selector */}
            <motion.div 
              className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 shadow-lg"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <label className="text-sm font-medium text-slate-100 mb-3 block">
                Select Subject
              </label>
              <Select value={selectedSubject} onValueChange={(value) => {
                setSelectedSubject(value);
                setSelectedUnit('');
              }}>
                <SelectTrigger className="w-full bg-slate-900/50 border-slate-700/50 text-slate-200 hover:bg-slate-900/70">
                  <SelectValue placeholder="Choose a subject" />
                </SelectTrigger>
                <SelectContent className="max-h-96 bg-slate-900/95 backdrop-blur-xl border-slate-700/50">
                  {(() => {
                    // Remove duplicates by subject_id
                    const uniqueSubjects = Array.from(
                      new Map(subjects.map(s => [s.subject_id, s])).values()
                    );
                    
                    const grouped = uniqueSubjects.reduce((acc, subject) => {
                      const category = subject.category;
                      if (!acc[category]) acc[category] = [];
                      acc[category].push(subject);
                      return acc;
                    }, {});
                    
                    return Object.entries(grouped).map(([category, categorySubjects]) => (
                      <div key={category}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-white uppercase tracking-wider">
                          {category}
                        </div>
                        {categorySubjects.map((subject) => (
                          <SelectItem key={subject.subject_id} value={subject.subject_id} className="text-slate-200 focus:bg-slate-800/50 focus:text-white">
                            <div className="flex items-center gap-2">
                              {subject.icon && <span>{subject.icon}</span>}
                              <span>{subject.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    ));
                    })()}
                </SelectContent>
              </Select>
            </motion.div>

            {/* Unit Selector */}
            <AnimatePresence>
              {selectedSubject && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 shadow-lg"
                  whileHover={{ scale: 1.01 }}
                >
                <label className="text-sm font-medium text-slate-100 mb-3 block">
                  Select Unit
                </label>
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger className="w-full bg-slate-900/50 border-slate-700/50 text-slate-200 hover:bg-slate-900/70">
                    <SelectValue placeholder="Choose a unit" />
                  </SelectTrigger>
                  <SelectContent className="max-h-96 bg-slate-900/95 backdrop-blur-xl border-slate-700/50">
                    {units.sort((a, b) => a.unit_number - b.unit_number).map((unit) => (
                      <SelectItem key={unit.id} value={unit.id} className="text-white focus:bg-slate-800/50 focus:text-white">
                        Unit {unit.unit_number}: {unit.unit_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Question Count */}
            <AnimatePresence>
              {selectedUnit && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
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
                      <motion.button
                        key={count}
                        onClick={() => setQuestionCount(count)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          "flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                          questionCount === count
                            ? "bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                            : "bg-slate-900/50 text-slate-300 hover:bg-slate-900/70 border border-slate-700/50"
                        )}
                        >
                        {count}
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
              )}
            </AnimatePresence>

            {/* Start Button */}
            <AnimatePresence>
              {selectedUnit && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative z-10"
                  style={{ pointerEvents: 'auto' }}
                >
                  <Button
                    onClick={startPractice}
                    disabled={generating}
                    className="w-full h-12 text-base font-medium bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 relative z-10"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      {generating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Generating Questions...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Start Practice ({questionCount} questions)
                        </>
                      )}
                    </span>
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
      </>
    );
  }

  // Practicing
  if (practiceState === 'practicing') {
    if (generating) {
      return (
        <div className="min-h-screen focus-mode flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: 'var(--color-focus-accent)' }} />
            <p className="focus-mode-text font-medium">Generating practice questions...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen focus-mode">
        <div className="sticky top-0 focus-mode-card border-b z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <span className="text-sm focus-mode-text-secondary">
              Question {currentIndex + 1} of {currentQuestions.length}
            </span>
            <div className="flex items-center gap-3">
              <div className="h-2 w-48 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all"
                  style={{ width: `${((currentIndex + 1) / currentQuestions.length) * 100}%`, backgroundColor: 'var(--color-focus-accent)' }}
                />
              </div>
              {user?.plan === 'free' && (
                <button
                  onClick={() => setUpgradeModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-xs text-white transition-all hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)' }}
                >
                  <Zap className="w-3 h-3" />
                  Upgrade
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
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
                exit={{ opacity: 0, y: 20 }}
                className="flex justify-end mt-4"
              >
                <Button 
                  onClick={handleNext}
                  className="group"
                >
                  {currentIndex < currentQuestions.length - 1 ? 'Next Question' : 'Complete Practice'}
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </motion.div>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Complete
  if (practiceState === 'complete') {
    const correctCount = currentQuestions.filter((q, i) => answers[i] === q.correct_answer).length;
    const accuracy = (correctCount / currentQuestions.length) * 100;

    return (
      <>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="bg-white rounded-2xl border border-slate-200 p-8 text-center mb-6 shadow-lg"
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 0.6 }}
            >
              <Target className="w-16 h-16 mx-auto mb-4 text-indigo-600" />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold text-slate-900 mb-2"
            >
              Practice Complete!
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="text-4xl font-bold text-indigo-600 mb-4"
            >
              {accuracy.toFixed(0)}%
            </motion.p>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-slate-500"
            >
              {correctCount} out of {currentQuestions.length} correct
            </motion.p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex gap-3"
          >
            <Link to={createPageUrl('Dashboard')} className="flex-1">
              <Button variant="outline" className="w-full hover:scale-105 transition-transform">
                Back to Dashboard
              </Button>
            </Link>
            <Button 
              onClick={() => {
                setPracticeState('setup');
                setCurrentIndex(0);
                setAnswers({});
                setCurrentQuestions([]);
                setSelectedSubject('');
                setSelectedUnit('');
                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 }
                });
              }}
              className="flex-1 hover:scale-105 transition-transform"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              New Practice
            </Button>
          </motion.div>
        <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
      </>
    );
  }
}