import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, ChevronLeft, Clock, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import QuestionCard from '@/components/ui/QuestionCard';
import UnitMultiSelect from '@/components/exam/UnitMultiSelect';
import { cn } from '@/lib/utils';
import { checkAndResetCredits, checkCredits, useCredit } from '@/components/monetization/CreditHelper';
import UpgradeModal from '@/components/monetization/UpgradeModal';
import ExamExporter from '@/components/exam/ExamExporter';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Exam() {
  const urlParams = new URLSearchParams(window.location.search);
  const examFromUrl = urlParams.get('exam');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [user, setUser] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedDifficulty, setSelectedDifficulty] = useState('mixed');
  const [timeLimit, setTimeLimit] = useState(15); // minutes
  
  const [examState, setExamState] = useState('setup'); // 'setup', 'in_progress', 'completed'
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  
  const timerRef = useRef(null);

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

  const currentSubject = subjects.find(s => s.subject_id === selectedSubject);

  const handleSubjectChange = (subjectId) => {
    setSelectedSubject(subjectId);
    setSelectedUnits([]);
  };

  // Timer
  useEffect(() => {
    if (examState === 'in_progress' && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            finishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [examState]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startExam = async () => {
    if (!selectedSubject || selectedUnits.length === 0) return;
    
    // Check credits
    const { allowed, remaining } = await checkCredits(user, 'daily_exam_count');
    if (!allowed) {
      setUpgradeModalOpen(true);
      return;
    }
    
    setLoading(true);
    
    // Use a credit
    const updatedUser = await useCredit(user, 'daily_exam_count');
    setUser(updatedUser);
    
    try {
      // Get skills from selected units - if no skills exist, use unit info directly
      const unitsToUse = selectedUnits.length > 0 ? selectedUnits : units.map(u => u.id);
      
      const allSkills = await base44.entities.Skill.list();
      const relevantSkills = allSkills.filter(skill => 
        unitsToUse.includes(skill.unit_id)
      );
      
      // If no skills, create temporary skill data from units
      const skillsToUse = relevantSkills.length > 0 
        ? relevantSkills 
        : unitsToUse.map(unitId => {
            const unit = units.find(u => u.id === unitId);
            return {
              id: unitId,
              unit_id: unitId,
              skill_name: unit?.unit_name || 'General',
              subject_id: selectedSubject,
            };
          });
      
      if (skillsToUse.length === 0) {
        console.error('No skills or units found');
        setLoading(false);
        return;
      }

      // Generate questions in parallel
      const difficulties = selectedDifficulty === 'mixed' 
        ? ['easy', 'medium', 'hard'] 
        : [selectedDifficulty];
      
      const questionsPerDifficulty = Math.ceil(questionCount / difficulties.length);
      
      // Build array of questions to generate
      const questionPromises = [];
      let questionIndex = 0;
      
      for (const difficulty of difficulties) {
        for (let i = 0; i < questionsPerDifficulty && questionIndex < questionCount; i++) {
          const skill = skillsToUse[questionIndex % skillsToUse.length];
          const unit = units.find(u => u.id === skill.unit_id);
          
          let contextInstructions = '';
          
          // SAT/ACT specific instructions
          if (selectedSubject === 'sat' && unit?.unit_name === 'Math') {
            contextInstructions = `Generate a SAT Math question (${difficulty} difficulty). Topics: algebra, problem-solving, data analysis, advanced math (quadratics, exponentials, functions), geometry, trigonometry. Use real SAT format.`;
          } else if (selectedSubject === 'sat' && unit?.unit_name === 'Reading and Writing') {
            contextInstructions = `Generate a SAT Reading and Writing question (${difficulty} difficulty). Include a short passage (2-4 sentences) about literature, history, science, or social studies. Ask about grammar, vocabulary in context, rhetorical skills, or comprehension. Use real SAT format.`;
          } else if (selectedSubject === 'act' && unit?.unit_name === 'Math') {
            contextInstructions = `Generate an ACT Math question (${difficulty} difficulty). Topics: pre-algebra, elementary algebra, intermediate algebra, coordinate geometry, plane geometry, trigonometry. Use real ACT format.`;
          } else if (selectedSubject === 'act' && unit?.unit_name === 'English') {
            contextInstructions = `Generate an ACT English question (${difficulty} difficulty). Include a sentence or short passage with grammar, punctuation, sentence structure, strategy, organization, or style issues. Test grammar rules, rhetorical skills, and writing conventions. Use real ACT format.`;
          } else if (selectedSubject === 'act' && unit?.unit_name === 'Reading') {
            contextInstructions = `Generate an ACT Reading question (${difficulty} difficulty). Include a passage excerpt (3-5 sentences) from prose fiction, social science, humanities, or natural science. Ask about main ideas, details, inferences, vocabulary, or author's craft. Use real ACT format.`;
          } else if (selectedSubject === 'act' && unit?.unit_name === 'Science') {
            contextInstructions = `Generate an ACT Science question (${difficulty} difficulty). Present data (describe a chart/graph/experiment) about biology, chemistry, physics, or earth science. Ask about data interpretation, scientific investigation, or evaluation of models. Use real ACT format.`;
          } else {
            contextInstructions = `Generate an exam-style multiple choice question for ${currentSubject?.name || selectedSubject}.

Topic/Skill: ${skill.skill_name}
Difficulty: ${difficulty}`;
          }
          
          const prompt = `${contextInstructions}

TABLES AND GRAPHS (For Science/Math):
- If the question involves data analysis, comparisons, or scientific results, include a table or graph description
- Format tables as markdown: | Header 1 | Header 2 |\n|---------|----------|\n| Data 1 | Data 2 |
- For graphs, describe the data points as JSON: {"type": "line/bar/scatter", "data": [{"x": 1, "y": 2}, ...], "labels": {"x": "Time (s)", "y": "Distance (m)"}}
- Only include visual data when it enhances understanding

ABSOLUTELY CRITICAL - PREVENT DUPLICATION AND CORRUPTION:

STEP 1 - Write content normally with LaTeX:
- Question: "What is $4x^{5} - 3x^{3}$?"
- Choice: "$CH_{4}$ (boiling point: $-161.5\\text{°C}$)"

STEP 2 - Before submitting, CHECK EACH FIELD for these FATAL ERRORS:
❌ Duplication: "$4x^{5}$4x5" or "NaClNaCl"
❌ Unicode: "4x⁵" or "H₂O" or "°C" 
❌ "ext" corruption: "100ext°C" or "−161ext"
❌ Plain text after LaTeX: "$x^{2}$x2"

STEP 3 - MANDATORY FIXES:
✅ Use \\text{} for units: "$100\\text{°C}$" NOT "100ext°C"
✅ Use LaTeX subscripts: "$H_{2}O$" NOT "H₂O"
✅ Use LaTeX superscripts: "$x^{5}$" NOT "x⁵"
✅ Write ONCE: "$4x^{5}$" NOT "$4x^{5}$4x5"
✅ Degree symbol in \\text{}: "$100\\text{°C}$" NOT "$100°C$"

EXAMPLES OF CORRECT OUTPUT:
question_text: "What is $4x^{5} - 3x^{3} + 2x^{2} - 7$?"
choice_a: "$CH_{4}$ (boiling point: $-161.5\\text{°C}$)"
choice_b: "$NaCl$ (melting point: $801\\text{°C}$)"
choice_c: "$C_{6}H_{6}$ (melting point: $5.5\\text{°C}$)"
choice_d: "$H_{2}O$ (boiling point: $100\\text{°C}$)"

FINAL VERIFICATION CHECKLIST (answer YES to all):
□ No duplication anywhere?
□ No unicode subscripts/superscripts?
□ No "ext" corruption?
□ All degree symbols in \\text{}?
□ All chemical formulas in LaTeX?
□ All math expressions in $...$?

ABSOLUTE RULE: NO duplication anywhere. Each formula/value written EXACTLY ONCE in LaTeX format.

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

Requirements:
- Match official exam style
- 4 choices (A, B, C, D)
- One correct answer
- Each equation appears ONCE
- Units always in \\text{}

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

Return JSON with: question_text, choice_a, choice_b, choice_c, choice_d, correct_answer, explanation, wrong_answer_explanations

VERIFY BEFORE RETURNING: Check that choice_a, choice_b, choice_c, choice_d each contain NO duplicated text`;

          questionPromises.push(
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
                  }
                },
                required: ['question_text', 'choice_a', 'choice_b', 'choice_c', 'choice_d', 'correct_answer', 'explanation'],
              },
            }).then(response => ({ response, skill, difficulty }))
          );
          
          questionIndex++;
        }
      }
      
      // Wait for all questions to generate
      const questionResponses = await Promise.all(questionPromises);
      
      // Save all questions to database
      const generatedQuestions = await Promise.all(
        questionResponses.map(({ response, skill, difficulty }) =>
          base44.entities.Question.create({
            subject_id: selectedSubject,
            unit_id: skill.unit_id,
            skill_id: skill.id,
            unit_name: units.find(u => u.id === skill.unit_id)?.unit_name || '',
            skill_name: skill.skill_name,
            difficulty,
            question_text: response.question_text,
            table_data: response.table_data || '',
            graph_data: response.graph_data || '',
            choice_a: response.choice_a,
            choice_b: response.choice_b,
            choice_c: response.choice_c,
            choice_d: response.choice_d,
            correct_answer: response.correct_answer,
            explanation: response.explanation,
            is_ai_generated: true,
          })
        )
      );

      // Create session
      const newSession = await base44.entities.Session.create({
        subject_id: selectedSubject,
        unit_id: unitsToUse[0], // Store first unit for compatibility
        mode: 'exam',
        status: 'in_progress',
        total_questions: generatedQuestions.length,
        question_ids: generatedQuestions.map(q => q.id),
        time_limit_minutes: timeLimit,
        started_at: new Date().toISOString(),
        difficulty: selectedDifficulty,
      });

      setSession(newSession);
      setQuestions(generatedQuestions);
      setTimeRemaining(timeLimit * 60);
      setExamState('in_progress');
    } catch (e) {
      console.error('Failed to start exam:', e);
    }
    setLoading(false);
  };

  const handleAnswer = (answer) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentIndex].id]: answer,
    }));
  };

  const goToQuestion = (index) => {
    setCurrentIndex(index);
  };

  const finishExam = async () => {
    clearInterval(timerRef.current);
    setLoading(true);

    // Calculate results and save attempts
    let correctCount = 0;
    const skillResults = {};

    for (const question of questions) {
      const selectedAnswer = answers[question.id];
      const isCorrect = selectedAnswer === question.correct_answer;
      if (isCorrect) correctCount++;

      if (!skillResults[question.skill_name]) {
        skillResults[question.skill_name] = { correct: 0, total: 0 };
      }
      skillResults[question.skill_name].total++;
      if (isCorrect) skillResults[question.skill_name].correct++;

      await base44.entities.Attempt.create({
        question_id: question.id,
        session_id: session.id,
        subject_id: selectedSubject,
        unit_id: question.unit_id,
        skill_id: question.skill_id,
        unit_name: question.unit_name,
        skill_name: question.skill_name,
        difficulty: question.difficulty,
        selected_answer: selectedAnswer || '',
        correct_answer: question.correct_answer,
        is_correct: isCorrect,
        mode: 'exam',
      });
    }

    // Update session
    await base44.entities.Session.update(session.id, {
      status: 'completed',
      correct_count: correctCount,
      completed_at: new Date().toISOString(),
      time_spent_seconds: (timeLimit * 60) - timeRemaining,
    });

    setSession(prev => ({
      ...prev,
      correct_count: correctCount,
      status: 'completed',
    }));

    queryClient.invalidateQueries({ queryKey: ['attempts'] });
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
    
    setExamState('completed');
    setLoading(false);
  };

  // Loading state
  if (loading && examState === 'setup') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-violet-400" />
        <p className="text-slate-100 font-medium">Generating your exam questions...</p>
        <p className="text-slate-400 text-sm mt-1">This may take a moment</p>
      </div>
    );
  }

  // Setup Screen
  if (examState === 'setup') {
    return (
      <>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" size="icon">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-100">Exam Mode</h1>
              <p className="text-white">Timed test with no explanations until the end</p>
              {user?.plan === 'free' && (
                <p className="text-xs text-slate-500 mt-1">
                  Daily timed exams: {(user.daily_exam_count || 0)}/3 used
                </p>
              )}
            </div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 space-y-6">
            {/* Subject Selection */}
            <div>
              <label className="text-sm font-medium text-slate-100 mb-3 block">
                Select Subject
              </label>
              <Select value={selectedSubject} onValueChange={handleSubjectChange}>
                <SelectTrigger className="w-full bg-slate-900/50 border-slate-700/50 text-white">
                  <SelectValue placeholder="Choose a subject" />
                </SelectTrigger>
                <SelectContent className="max-h-96 bg-slate-900/95 backdrop-blur-xl border-slate-700/50">
                  {subjects.length === 0 ? (
                    <div className="px-2 py-4 text-sm text-slate-500 text-center">
                      No subjects available
                    </div>
                  ) : (
                    (() => {
                      // Remove duplicates by subject_id
                      const uniqueSubjects = Array.from(
                        new Map(subjects.map(s => [s.subject_id, s])).values()
                      );
                      
                      const grouped = uniqueSubjects.reduce((acc, subject) => {
                        const category = subject.category;
                        if (!acc[category]) {
                          acc[category] = [];
                        }
                        acc[category].push(subject);
                        return acc;
                      }, {});
                      
                      return Object.entries(grouped).map(([category, categorySubjects]) => (
                        <div key={category}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            {category}
                          </div>
                          {categorySubjects.map((subject) => (
                            <SelectItem key={subject.subject_id} value={subject.subject_id} className="text-white focus:bg-slate-800/50 focus:text-white">
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
              {selectedSubject && currentSubject && (
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                  {currentSubject.icon && <span>{currentSubject.icon}</span>}
                  <span>Selected: {currentSubject.name}</span>
                </div>
              )}
            </div>

            {/* Unit Selection */}
            {selectedSubject && (
              <div>
                <label className="text-sm font-medium text-slate-100 mb-3 block">
                  Select Units
                </label>
                <UnitMultiSelect
                  selectedSubject={selectedSubject}
                  selectedUnits={selectedUnits}
                  onUnitsChange={setSelectedUnits}
                />
                <style>{`
                  [role="option"] {
                    color: white !important;
                  }
                `}</style>
              </div>
            )}

            {/* Question Count */}
            <div>
              <label className="text-sm font-medium text-slate-100 mb-3 block">
                Number of Questions {isStandardizedTest && '(Custom for SAT/ACT)'}
              </label>
              {isStandardizedTest ? (
                <div className="space-y-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={questionCount}
                    onChange={(e) => {
                      const val = Math.min(60, Math.max(1, parseInt(e.target.value) || 1));
                      setQuestionCount(val);
                    }}
                    className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-900/50 text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Enter 1-60"
                  />
                  <p className="text-xs text-slate-400">Max 60 questions for SAT/ACT exams</p>
                </div>
              ) : (
                <div className="flex gap-2">
                  {[10, 15, 20].map((n) => (
                    <button
                      key={n}
                      onClick={() => setQuestionCount(n)}
                      className={cn(
                        "flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                        questionCount === n
                          ? "bg-violet-600 text-white"
                          : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                      )}
                    >
                      {n} questions
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Difficulty */}
            <div>
              <label className="text-sm font-medium text-slate-100 mb-3 block">Difficulty</label>
              <div className="flex gap-2">
                {[
                  { id: 'mixed', label: 'Mixed' },
                  { id: 'easy', label: 'Easy' },
                  { id: 'medium', label: 'Medium' },
                  { id: 'hard', label: 'Hard' },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDifficulty(d.id)}
                    className={cn(
                      "flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                      selectedDifficulty === d.id
                        ? "bg-violet-600 text-white"
                        : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Limit */}
            <div>
              <label className="text-sm font-medium text-slate-100 mb-3 block">Time Limit</label>
              <div className="flex gap-2">
                {[10, 15, 20, 30].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeLimit(t)}
                    className={cn(
                      "flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                      timeLimit === t
                        ? "bg-violet-600 text-white"
                        : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                    )}
                  >
                    {t} min
                  </button>
                ))}
              </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="text-sm text-amber-200">
                <p className="font-medium">Exam conditions</p>
                <p className="mt-1">You won't see explanations until you complete the exam. The timer will start immediately.</p>
              </div>
            </div>

            <Button
              onClick={startExam}
              disabled={loading || !selectedSubject || selectedUnits.length === 0}
              className="w-full h-12 bg-violet-600 hover:bg-violet-700"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Clock className="w-4 h-4 mr-2" />
              )}
              Start Exam
            </Button>

            {(!selectedSubject || selectedUnits.length === 0) && (
              <p className="text-xs text-center text-slate-400">
                {!selectedSubject 
                  ? 'Please select a subject to continue' 
                  : 'Please select at least one unit to continue'}
              </p>
            )}
          </div>
        </div>
      </>
    );
  }

  // In Progress
  if (examState === 'in_progress') {
    const currentQuestion = questions[currentIndex];
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="min-h-screen focus-mode">
        {/* Timer Bar */}
        <div className="sticky top-0 focus-mode-card border-b z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-white">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-sm text-white">
                {answeredCount} answered
              </span>
            </div>
            <div className={cn(
              "flex items-center gap-2 font-mono text-lg font-semibold",
              timeRemaining < 60 ? "text-rose-400" : "focus-mode-text"
            )}>
              <Clock className="w-4 h-4" />
              {formatTime(timeRemaining)}
            </div>
          </div>
          <div className="h-1 bg-slate-800">
            <div 
              className="h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%`, backgroundColor: 'var(--color-focus-accent)' }}
            />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Question Navigator */}
            <div className="order-2 lg:order-1 lg:col-span-1">
              <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 sticky top-20">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Questions
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, i) => (
                    <button
                      key={q.id}
                      onClick={() => goToQuestion(i)}
                      className={cn(
                        "w-full aspect-square rounded-lg text-sm font-medium transition-all",
                        i === currentIndex
                          ? "bg-violet-600 text-white"
                          : answers[q.id]
                            ? "bg-indigo-500/30 text-indigo-200"
                            : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <Button
                  onClick={finishExam}
                  disabled={loading}
                  variant="outline"
                  className="w-full mt-4"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Finish Exam'}
                </Button>
              </div>
            </div>

            {/* Question */}
            <div className="order-1 lg:order-2 lg:col-span-3">
              <QuestionCard
                key={currentQuestion.id}
                question={currentQuestion}
                onAnswer={handleAnswer}
                selectedAnswer={answers[currentQuestion.id]}
                mode="exam"
              />

              <div className="flex justify-between mt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                  disabled={currentIndex === questions.length - 1}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Completed
  if (examState === 'completed') {
    const correctCount = session?.correct_count || 0;
    const accuracy = ((correctCount / questions.length) * 100).toFixed(0);
    
    // Group results by skill
    const skillResults = {};
    questions.forEach(q => {
      if (!skillResults[q.skill_name]) {
        skillResults[q.skill_name] = { correct: 0, total: 0 };
      }
      skillResults[q.skill_name].total++;
      if (answers[q.id] === q.correct_answer) {
        skillResults[q.skill_name].correct++;
      }
    });

    const weakSkills = Object.entries(skillResults)
      .map(([name, stats]) => ({
        name,
        accuracy: (stats.correct / stats.total) * 100,
        ...stats,
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3);

    return (
      <>
        <div className="max-w-3xl mx-auto">
          {/* Score Card */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
              {Number(accuracy) >= 70 ? (
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              ) : (
                <XCircle className="w-10 h-10 text-amber-400" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-slate-100 mb-2">
              {accuracy}%
            </h1>
            <p className="text-slate-400">
              You got {correctCount} out of {questions.length} questions correct
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 text-center">
              <p className="text-2xl font-bold text-slate-100">{correctCount}</p>
              <p className="text-sm text-slate-400">Correct</p>
            </div>
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 text-center">
              <p className="text-2xl font-bold text-slate-100">{questions.length - correctCount}</p>
              <p className="text-sm text-slate-400">Incorrect</p>
            </div>
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 text-center">
              <p className="text-2xl font-bold text-slate-100">
                {formatTime((timeLimit * 60) - timeRemaining)}
              </p>
              <p className="text-sm text-slate-400">Time Used</p>
            </div>
          </div>

          {/* Weak Skills */}
          {weakSkills.length > 0 && (
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden mb-6">
              <div className="px-5 py-4 border-b border-slate-700/30">
                <h3 className="font-semibold text-slate-100">Areas to Improve</h3>
              </div>
              <div className="divide-y divide-slate-700/30">
                {weakSkills.map((skill) => (
                  <div key={skill.name} className="px-5 py-4 flex items-center justify-between">
                    <span className="font-medium text-slate-100">{skill.name}</span>
                    <span className={cn(
                      "font-semibold",
                      skill.accuracy >= 70 ? "text-emerald-400" :
                      skill.accuracy >= 50 ? "text-amber-400" :
                      "text-rose-400"
                    )}>
                      {skill.accuracy.toFixed(0)}% ({skill.correct}/{skill.total})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Questions */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-slate-700/30">
              <h3 className="font-semibold text-slate-100">Review Questions</h3>
            </div>
            <div className="divide-y divide-slate-700/30">
              {questions.map((q, i) => {
                const isCorrect = answers[q.id] === q.correct_answer;
                return (
                  <div key={q.id} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                        isCorrect ? "bg-emerald-100" : "bg-rose-100"
                      )}>
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600" />
                        )}
                        </div>
                        <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-100 line-clamp-2">{q.question_text}</p>
                        {!isCorrect && (
                          <p className="text-xs text-slate-400 mt-1">
                            Your answer: {answers[q.id] || 'Not answered'} · Correct: {q.correct_answer}
                          </p>
                        )}
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Export Options */}
          <div className="mb-6">
            <ExamExporter 
              exam={{
                subject_name: currentSubject?.name || selectedSubject,
                time_limit_minutes: timeLimit,
                total_questions: questions.length
              }}
              questions={questions}
              answers={Object.fromEntries(questions.map((q, i) => [i, answers[q.id]]))}
              showSolutions={true}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link to={createPageUrl('Dashboard')} className="flex-1">
              <Button variant="outline" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
            <Button onClick={() => {
              setExamState('setup');
              setAnswers({});
              setCurrentIndex(0);
            }} className="flex-1 bg-violet-600 hover:bg-violet-700">
              Take Another Exam
            </Button>
          </div>
        </div>
        
        <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
      </>
    );
  }
}