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
  
  const timerRef = useRef(null);

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
    
    setLoading(true);
    
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

      // Generate questions
      const generatedQuestions = [];
      const difficulties = selectedDifficulty === 'mixed' 
        ? ['easy', 'medium', 'hard'] 
        : [selectedDifficulty];
      
      const questionsPerDifficulty = Math.ceil(questionCount / difficulties.length);
      
      for (const difficulty of difficulties) {
        for (let i = 0; i < questionsPerDifficulty && generatedQuestions.length < questionCount; i++) {
          // Rotate through skills to ensure variety
          const skill = skillsToUse[generatedQuestions.length % skillsToUse.length];
          
          const prompt = `Generate an exam-style multiple choice question for ${currentSubject?.name || selectedSubject}.

Topic/Skill: ${skill.skill_name}
Difficulty: ${difficulty}

Requirements:
- Match official College Board/ACT question style exactly
- Exactly 4 answer choices (A, B, C, D)
- Exactly one correct answer
- Include plausible distractors
- CRITICAL: Use VALID LaTeX with proper escape characters. ALL math must render cleanly.
- Wrap math: $ for inline, $$ for display blocks
- Examples of CORRECT LaTeX:
  * Fractions: $\\frac{\\sin(30^\\circ)}{\\pi}$ (with backslash before frac)
  * Limits: $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$ (backslash before lim and to)
  * Powers: $x^2 + 5x - 3$
  * Roots: $\\sqrt{3}$
  * Trig: $\\sin(45^\\circ)$, $\\cos(x)$, $\\tan(x)$ (backslash before all functions)
- NEVER write: "ext\\lim", "o" (use \\to for arrows), "frac" without backslash
- Test that your LaTeX compiles correctly before using it

Return JSON with: question_text, choice_a, choice_b, choice_c, choice_d, correct_answer ("A"/"B"/"C"/"D"), explanation`;

          const response = await base44.integrations.Core.InvokeLLM({
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
              },
              required: ['question_text', 'choice_a', 'choice_b', 'choice_c', 'choice_d', 'correct_answer', 'explanation'],
            },
          });

          const saved = await base44.entities.Question.create({
            subject_id: selectedSubject,
            unit_id: skill.unit_id,
            skill_id: skill.id,
            unit_name: units.find(u => u.id === skill.unit_id)?.unit_name || '',
            skill_name: skill.skill_name,
            difficulty,
            question_text: response.question_text,
            choice_a: response.choice_a,
            choice_b: response.choice_b,
            choice_c: response.choice_c,
            choice_d: response.choice_d,
            correct_answer: response.correct_answer,
            explanation: response.explanation,
            is_ai_generated: true,
          });

          generatedQuestions.push(saved);
        }
      }

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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600 mb-4" />
        <p className="text-slate-600 font-medium">Generating your exam questions...</p>
        <p className="text-slate-400 text-sm mt-1">This may take a moment</p>
      </div>
    );
  }

  // Setup Screen
  if (examState === 'setup') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" size="icon">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Exam Mode</h1>
              <p className="text-slate-500">Timed test with no explanations until the end</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            {/* Subject Selection */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-3 block">
                Select Subject
              </label>
              <Select value={selectedSubject} onValueChange={handleSubjectChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a subject" />
                </SelectTrigger>
                <SelectContent className="max-h-96">
                  {subjects.length === 0 ? (
                    <div className="px-2 py-4 text-sm text-slate-500 text-center">
                      No subjects available
                    </div>
                  ) : (
                    (() => {
                      const grouped = subjects.reduce((acc, subject) => {
                        const category = subject.category;
                        if (!acc[category]) {
                          acc[category] = [];
                        }
                        acc[category].push(subject);
                        return acc;
                      }, {});
                      
                      return Object.entries(grouped).map(([category, categorySubjects]) => (
                        <div key={category}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
              {selectedSubject && currentSubject && (
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                  {currentSubject.icon && <span>{currentSubject.icon}</span>}
                  <span>Selected: {currentSubject.name}</span>
                </div>
              )}
            </div>

            {/* Unit Selection */}
            {selectedSubject && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-3 block">
                  Select Units
                </label>
                <UnitMultiSelect
                  selectedSubject={selectedSubject}
                  selectedUnits={selectedUnits}
                  onUnitsChange={setSelectedUnits}
                />
              </div>
            )}

            {/* Question Count */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-3 block">Number of Questions</label>
              <div className="flex gap-2">
                {[10, 15, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setQuestionCount(n)}
                    className={cn(
                      "flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                      questionCount === n
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {n} questions
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-3 block">Difficulty</label>
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
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Limit */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-3 block">Time Limit</label>
              <div className="flex gap-2">
                {[10, 15, 20, 30].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeLimit(t)}
                    className={cn(
                      "flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                      timeLimit === t
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {t} min
                  </button>
                ))}
              </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Exam conditions</p>
                <p className="mt-1">You won't see explanations until you complete the exam. The timer will start immediately.</p>
              </div>
            </div>

            <Button
              onClick={startExam}
              disabled={loading || !selectedSubject || selectedUnits.length === 0}
              className="w-full h-12"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Clock className="w-4 h-4 mr-2" />
              )}
              Start Exam
            </Button>

            {(!selectedSubject || selectedUnits.length === 0) && (
              <p className="text-xs text-center text-slate-500">
                {!selectedSubject 
                  ? 'Please select a subject to continue' 
                  : 'Please select at least one unit to continue'}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // In Progress
  if (examState === 'in_progress') {
    const currentQuestion = questions[currentIndex];
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="min-h-screen bg-slate-50">
        {/* Timer Bar */}
        <div className="sticky top-0 bg-white border-b border-slate-200 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-sm text-slate-500">
                {answeredCount} answered
              </span>
            </div>
            <div className={cn(
              "flex items-center gap-2 font-mono text-lg font-semibold",
              timeRemaining < 60 ? "text-rose-600" : "text-slate-900"
            )}>
              <Clock className="w-4 h-4" />
              {formatTime(timeRemaining)}
            </div>
          </div>
          <div className="h-1 bg-slate-100">
            <div 
              className="h-full bg-slate-900 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Question Navigator */}
            <div className="order-2 lg:order-1 lg:col-span-1">
              <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-20">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
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
                          ? "bg-slate-900 text-white"
                          : answers[q.id]
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Score Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              {Number(accuracy) >= 70 ? (
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              ) : (
                <XCircle className="w-10 h-10 text-amber-600" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {accuracy}%
            </h1>
            <p className="text-slate-500">
              You got {correctCount} out of {questions.length} questions correct
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{correctCount}</p>
              <p className="text-sm text-slate-500">Correct</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{questions.length - correctCount}</p>
              <p className="text-sm text-slate-500">Incorrect</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">
                {formatTime((timeLimit * 60) - timeRemaining)}
              </p>
              <p className="text-sm text-slate-500">Time Used</p>
            </div>
          </div>

          {/* Weak Skills */}
          {weakSkills.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Areas to Improve</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {weakSkills.map((skill) => (
                  <div key={skill.name} className="px-5 py-4 flex items-center justify-between">
                    <span className="font-medium text-slate-900">{skill.name}</span>
                    <span className={cn(
                      "font-semibold",
                      skill.accuracy >= 70 ? "text-emerald-600" :
                      skill.accuracy >= 50 ? "text-amber-600" :
                      "text-rose-600"
                    )}>
                      {skill.accuracy.toFixed(0)}% ({skill.correct}/{skill.total})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Questions */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Review Questions</h3>
            </div>
            <div className="divide-y divide-slate-100">
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
                        <p className="text-sm text-slate-900 line-clamp-2">{q.question_text}</p>
                        {!isCorrect && (
                          <p className="text-xs text-slate-500 mt-1">
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
            }} className="flex-1">
              Take Another Exam
            </Button>
          </div>
        </div>
      </div>
    );
  }
}