import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, ChevronLeft, Target, BookOpen, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import QuestionCard from '@/components/ui/QuestionCard';
import StudyPlanCard from '@/components/study/StudyPlanCard';
import MasteryBadge from '@/components/study/MasteryBadge';
import ErrorTypeSelector from '@/components/exam/ErrorTypeSelector';
import ErrorTypeFeedback from '@/components/ui/ErrorTypeFeedback';
import UpgradeModal from '@/components/monetization/UpgradeModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function Practice() {
  const [user, setUser] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [practiceState, setPracticeState] = useState('setup'); // 'setup', 'practicing', 'complete'
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [generating, setGenerating] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const queryClient = useQueryClient();

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

  const { data: units = [] } = useQuery({
    queryKey: ['units', selectedSubject],
    queryFn: () => base44.entities.Unit.filter({ subject_id: selectedSubject }),
    enabled: !!selectedSubject,
  });

  const startPractice = async () => {
    if (!selectedSubject || !selectedUnit) return;
    
    setGenerating(true);
    setPracticeState('practicing');
    
    try {
      const subject = subjects.find(s => s.subject_id === selectedSubject);
      const unit = units.find(u => u.id === selectedUnit);
      const questionsToGenerate = [];
      
      for (let i = 0; i < questionCount; i++) {
        const prompt = `Generate an exam-style multiple choice question for ${subject?.name || 'general topic'}.

Unit: ${unit?.unit_name || 'General'}

Requirements:
- Match official exam style
- Exactly 4 answer choices (A, B, C, D)
- One correct answer
- CRITICAL: Use VALID LaTeX with proper escape characters. ALL math must render cleanly.
- Wrap math: $ for inline, $$ for display blocks
- Examples of CORRECT LaTeX:
  * Fractions: $\\frac{\\sin(30^\\circ)}{\\pi}$ (with backslash before frac)
  * Limits: $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$ (backslash before lim and to)
  * Powers: $x^2 + 5x - 3$
  * Roots: $\\sqrt{3}$
  * Trig: $\\sin(45^\\circ)$, $\\cos(x)$, $\\tan(x)$ (backslash before all functions)
- NEVER write: "ext\\lim", "o" (use \\to for arrows), "frac" without backslash

For the explanation:
- Start with the key concept being tested
- Provide step-by-step solution with clear reasoning
- Show all work using proper LaTeX notation
- Include a final answer statement
- Add a "Common Mistakes" section explaining why each wrong answer is incorrect
- Use educational tone that builds understanding, not just procedures

Return JSON with: question_text, choice_a, choice_b, choice_c, choice_d, correct_answer ("A"/"B"/"C"/"D"), explanation, wrong_answer_explanations (object with A/B/C/D keys), hint`;

        questionsToGenerate.push(
          base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
              type: 'object',
              properties: {
                question_text: { type: 'string' },
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
    } catch (e) {
      console.error('Failed to start practice:', e);
    }
    setGenerating(false);
  };

  const handleAnswer = (answer) => {
    setAnswers(prev => ({
      ...prev,
      [currentIndex]: answer,
    }));
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
      setShowErrorSelector(false);
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
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d4a6f)', fontFamily: 'Georgia, serif' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" size="icon">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Practice Mode</h1>
              <p className="text-slate-500">Choose what to practice</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Subject Selector */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <label className="text-sm font-medium text-slate-700 mb-3 block">
                Select Subject
              </label>
              <Select value={selectedSubject} onValueChange={(value) => {
                setSelectedSubject(value);
                setSelectedUnit('');
              }}>
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
            </div>

            {/* Unit Selector */}
            {selectedSubject && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <label className="text-sm font-medium text-slate-700 mb-3 block">
                  Select Unit
                </label>
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a unit" />
                  </SelectTrigger>
                  <SelectContent className="max-h-96">
                    {units.sort((a, b) => a.unit_number - b.unit_number).map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        Unit {unit.unit_number}: {unit.unit_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Question Count */}
            {selectedUnit && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <label className="text-sm font-medium text-slate-700 mb-3 block">
                  Number of Questions
                </label>
                <div className="flex gap-3">
                  {[5, 10, 15, 20].map((count) => (
                    <button
                      key={count}
                      onClick={() => setQuestionCount(count)}
                      className={cn(
                        "flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                        questionCount === count
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Start Button */}
            {selectedUnit && (
              <Button
                onClick={startPractice}
                disabled={generating}
                className="w-full h-12 text-base font-medium"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-5 h-5 mr-2" />
                    Start Practice ({questionCount} questions)
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
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
          <QuestionCard
            question={currentQuestion}
            onAnswer={handleAnswer}
            selectedAnswer={answers[currentIndex]}
            showFeedback={answered}
            mode="practice"
          />

          {answered && (
            <div className="flex justify-end mt-4">
              <Button onClick={handleNext}>
                {currentIndex < currentQuestions.length - 1 ? 'Next Question' : 'Complete Practice'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Complete
  if (practiceState === 'complete') {
    const correctCount = currentQuestions.filter((q, i) => answers[i] === q.correct_answer).length;
    const accuracy = (correctCount / currentQuestions.length) * 100;

    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d4a6f)', fontFamily: 'Georgia, serif' }}>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center mb-6">
            <Target className="w-16 h-16 mx-auto mb-4 text-slate-900" />
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Practice Complete!</h1>
            <p className="text-xl text-slate-600 mb-4">
              {accuracy.toFixed(0)}% accuracy
            </p>
            <p className="text-slate-500">
              {correctCount} out of {currentQuestions.length} correct
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
                setPracticeState('setup');
                setCurrentIndex(0);
                setAnswers({});
                setCurrentQuestions([]);
                setSelectedSubject('');
                setSelectedUnit('');
              }}
              className="flex-1"
            >
              New Practice
            </Button>
          </div>
          </div>

          <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
          </div>
          );
          }
}