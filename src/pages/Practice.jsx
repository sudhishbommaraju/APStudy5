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
  const [studyPlan, setStudyPlan] = useState(null);
  const [practiceState, setPracticeState] = useState('plan'); // 'plan', 'practicing', 'complete'
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [generating, setGenerating] = useState(false);
  const [showErrorSelector, setShowErrorSelector] = useState(false);
  const [errorTypes, setErrorTypes] = useState({});
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (selectedSubject && !studyPlan && !generating && practiceState === 'plan') {
      generateStudyPlan();
    }
  }, [selectedSubject]);

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list('subject_id'),
  });

  const { data: masteryData = [] } = useQuery({
    queryKey: ['mastery', selectedSubject],
    queryFn: () => base44.entities.SkillMastery.filter({ 
      subject_id: selectedSubject,
      created_by: user?.email 
    }),
    enabled: !!selectedSubject && !!user,
  });

  const generateStudyPlan = async () => {
    if (!selectedSubject) return;
    
    setGenerating(true);
    try {
      const allSkills = await base44.entities.Skill.filter({ subject_id: selectedSubject });
      
      // If no skills, auto-start practice immediately
      if (allSkills.length === 0) {
        setStudyPlan({ subject_id: selectedSubject, focus_skills: [], estimated_minutes: 20, plan_type: 'daily', generated_reason: 'General practice' });
        setGenerating(false);
        await startPracticeDirectly(selectedSubject);
        return;
      }

      // Calculate mastery for each skill
      const skillsWithMastery = allSkills.map(skill => {
        const mastery = masteryData.find(m => m.skill_id === skill.id);
        return {
          ...skill,
          mastery_level: mastery?.mastery_level || 'not_started',
          recent_accuracy: mastery?.recent_accuracy || 0,
          total_attempts: mastery?.total_attempts || 0,
          last_practiced: mastery?.last_practiced,
        };
      });

      // Prioritize skills: developing/not_started, then proficient for review
      const needsWork = skillsWithMastery
        .filter(s => ['not_started', 'developing'].includes(s.mastery_level))
        .sort((a, b) => a.recent_accuracy - b.recent_accuracy)
        .slice(0, 3);

      const forReview = skillsWithMastery
        .filter(s => s.mastery_level === 'proficient')
        .sort((a, b) => {
          const daysA = a.last_practiced ? (Date.now() - new Date(a.last_practiced).getTime()) / (1000 * 60 * 60 * 24) : 999;
          const daysB = b.last_practiced ? (Date.now() - new Date(b.last_practiced).getTime()) / (1000 * 60 * 60 * 24) : 999;
          return daysB - daysA;
        })
        .slice(0, 1);

      const focusSkills = [...needsWork, ...forReview].slice(0, 3).map(skill => ({
        skill_id: skill.id,
        skill_name: skill.skill_name,
        unit_id: skill.unit_id,
        mastery_level: skill.mastery_level,
        reason: skill.mastery_level === 'not_started' 
          ? 'New skill to learn'
          : skill.mastery_level === 'developing'
          ? `Needs improvement (${skill.recent_accuracy.toFixed(0)}% accuracy)`
          : 'Spaced review',
      }));

      if (focusSkills.length === 0) {
        // No skills found, create a generic plan
        focusSkills.push({
          skill_id: null,
          skill_name: 'General practice',
          unit_id: null,
          mastery_level: 'not_started',
          reason: 'Start with any topic',
        });
      }

      const plan = {
        subject_id: selectedSubject,
        focus_skills: focusSkills,
        estimated_minutes: focusSkills.length * 10,
        plan_type: 'daily',
        generated_reason: needsWork.length > 0 
          ? 'Focusing on skills that need the most work'
          : 'Review practice to maintain mastery',
      };

      setStudyPlan(plan);
    } catch (e) {
      console.error('Failed to generate study plan:', e);
    }
    setGenerating(false);
  };

  const startPracticeDirectly = async (subjectId) => {
    setPracticeState('practicing');
    setGenerating(true);
    
    try {
      const subject = subjects.find(s => s.subject_id === subjectId);
      const questionsToGenerate = [];
      
      for (let i = 0; i < 10; i++) {
        const prompt = `Generate an exam-style multiple choice question for ${subject?.name || 'general topic'}.

Requirements:
- Match official exam style
- Exactly 4 answer choices (A, B, C, D)
- One correct answer
- Use proper LaTeX math notation
- Include clear explanation

Return JSON with: question_text, choice_a, choice_b, choice_c, choice_d, correct_answer ("A"/"B"/"C"/"D"), explanation, hint`;

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
            subject_id: subjectId,
            unit_id: '',
            skill_id: '',
            skill_name: 'General',
            difficulty: 'medium',
            question_text: r.question_text,
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

      setCurrentQuestions(questions);
    } catch (e) {
      console.error('Failed to generate questions:', e);
    }
    setGenerating(false);
  };

  const startPractice = async () => {
    if (!studyPlan) return;
    
    setGenerating(true);
    setPracticeState('practicing');
    
    try {
      const questionsToGenerate = [];
      
      // Generate 3-5 questions per skill, weighted by mastery
      for (const focusSkill of studyPlan.focus_skills) {
        const skill = await base44.entities.Skill.list().then(skills => 
          skills.find(s => s.id === focusSkill.skill_id)
        );
        
        if (!skill) continue;
        
        const questionCount = focusSkill.mastery_level === 'developing' ? 5 : 
                            focusSkill.mastery_level === 'not_started' ? 4 : 3;
        
        for (let i = 0; i < questionCount; i++) {
          const difficulty = focusSkill.mastery_level === 'not_started' ? 'easy' :
                           focusSkill.mastery_level === 'developing' ? 'medium' : 'hard';
          
          const prompt = `Generate an exam-style multiple choice question.

Skill: ${skill.skill_name}
Difficulty: ${difficulty}

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

Return JSON with: question_text, choice_a, choice_b, choice_c, choice_d, correct_answer ("A"/"B"/"C"/"D"), explanation, wrong_answer_explanations (object with A/B/C/D keys), conceptual_insight (key concept students should understand)`;

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
                  conceptual_insight: { type: 'string' },
                },
                required: ['question_text', 'choice_a', 'choice_b', 'choice_c', 'choice_d', 'correct_answer', 'explanation'],
              },
            }).then(response => ({
              ...response,
              skill_id: skill.id,
              unit_id: skill.unit_id,
              skill_name: skill.skill_name,
              difficulty,
            }))
          );
        }
      }

      const responses = await Promise.all(questionsToGenerate);
      
      const questions = await Promise.all(
        responses.map(r => 
          base44.entities.Question.create({
            subject_id: selectedSubject,
            unit_id: r.unit_id,
            skill_id: r.skill_id,
            skill_name: r.skill_name,
            difficulty: r.difficulty,
            question_text: r.question_text,
            choice_a: r.choice_a,
            choice_b: r.choice_b,
            choice_c: r.choice_c,
            choice_d: r.choice_d,
            correct_answer: r.correct_answer,
            explanation: r.explanation,
            wrong_answer_explanations: r.wrong_answer_explanations || {},
            hint: r.conceptual_insight || '',
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

    if (question.skill_id) {
      await updateMastery(question.skill_id, isCorrect, question.difficulty);
    }

    if (currentIndex < currentQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowErrorSelector(false);
    } else {
      await completePractice();
    }
  };

  const handleErrorType = async (errorType) => {
    const question = currentQuestions[currentIndex];
    const selectedAnswer = answers[currentIndex];
    const isCorrect = selectedAnswer === question.correct_answer;

    setErrorTypes(prev => ({ ...prev, [currentIndex]: errorType }));

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
      error_type: isCorrect ? 'none' : errorType,
    });

    await updateMastery(question.skill_id, isCorrect, question.difficulty);
    
    setShowErrorSelector(false);
  };

  const updateMastery = async (skillId, isCorrect, difficulty) => {
    const existing = masteryData.find(m => m.skill_id === skillId);
    
    const newTotal = (existing?.total_attempts || 0) + 1;
    const newCorrect = (existing?.correct_attempts || 0) + (isCorrect ? 1 : 0);
    const accuracy = (newCorrect / newTotal) * 100;
    
    // Calculate mastery level
    let masteryLevel = 'not_started';
    if (newTotal >= 10 && accuracy >= 85) masteryLevel = 'mastered';
    else if (newTotal >= 5 && accuracy >= 70) masteryLevel = 'proficient';
    else if (newTotal >= 2) masteryLevel = 'developing';
    
    if (existing) {
      await base44.entities.SkillMastery.update(existing.id, {
        total_attempts: newTotal,
        correct_attempts: newCorrect,
        recent_accuracy: accuracy,
        mastery_level: masteryLevel,
        last_practiced: new Date().toISOString(),
      });
    } else {
      const skill = await base44.entities.Skill.list().then(skills => skills.find(s => s.id === skillId));
      await base44.entities.SkillMastery.create({
        subject_id: selectedSubject,
        unit_id: skill?.unit_id,
        skill_id: skillId,
        skill_name: skill?.skill_name || 'Unknown',
        total_attempts: newTotal,
        correct_attempts: newCorrect,
        recent_accuracy: accuracy,
        mastery_level: masteryLevel,
        last_practiced: new Date().toISOString(),
      });
    }
    
    queryClient.invalidateQueries({ queryKey: ['mastery'] });
  };

  const completePractice = async () => {
    setPracticeState('complete');
    queryClient.invalidateQueries({ queryKey: ['attempts'] });
  };

  const currentQuestion = currentQuestions[currentIndex];
  const answered = answers[currentIndex] !== undefined;
  const isCorrect = answered && answers[currentIndex] === currentQuestion?.correct_answer;

  // Loading
  if (generating && practiceState === 'plan') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Generating your study plan...</p>
        </div>
      </div>
    );
  }

  // Plan view
  if (practiceState === 'plan') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" size="icon">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Practice Mode</h1>
              <p className="text-slate-500">Adaptive practice based on your progress</p>
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
          </div>
          {studyPlan && <StudyPlanCard plan={studyPlan} onStart={startPractice} />}
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
      <div className="min-h-screen bg-slate-50">
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
                setPracticeState('plan');
                setCurrentIndex(0);
                setAnswers({});
                setCurrentQuestions([]);
                generateStudyPlan();
              }}
              className="flex-1"
            >
              New Study Plan
            </Button>
          </div>
          </div>

          <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
          </div>
          );
          }
}