import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, ChevronLeft, Clock, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import QuestionCard from '@/components/ui/QuestionCard';
import SubjectUnitSelector from '@/components/study/SubjectUnitSelector';
import SubjectChangeDialog from '@/components/study/SubjectChangeDialog';
import { cn } from '@/lib/utils';

export default function Exam() {
  const urlParams = new URLSearchParams(window.location.search);
  const examFromUrl = urlParams.get('exam');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [user, setUser] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
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

  const { data: currentSubjectData } = useQuery({
    queryKey: ['subject', selectedSubject],
    queryFn: () => base44.entities.Subject.list(),
    enabled: !!selectedSubject,
    select: (subjects) => subjects.find(s => s.subject_id === selectedSubject),
  });

  const handleSubjectChange = (subjectId) => {
    setSelectedSubject(subjectId);
    setSelectedUnit('');
    setSelectedSkill('');
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
    if (!selectedSubject || !selectedUnit || !selectedSkill) return;
    
    setLoading(true);
    
    try {
      // Fetch the skill data
      const skillData = await base44.entities.Skill.list();
      const currentSkill = skillData.find(s => s.id === selectedSkill);
      
      if (!currentSkill) {
        console.error('Skill not found');
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
          const prompt = `Generate an exam-style multiple choice question for ${currentSubjectData?.name || selectedSubject}.

Topic/Skill: ${currentSkill.skill_name}
Difficulty: ${difficulty}

Requirements:
- Match official College Board/ACT question style exactly
- Exactly 4 answer choices (A, B, C, D)
- Exactly one correct answer
- Include plausible distractors
- Use proper mathematical notation

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
            unit_id: selectedUnit,
            skill_id: selectedSkill,
            unit_name: currentSkill.unit_name || '',
            skill_name: currentSkill.skill_name,
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
        unit_id: selectedUnit,
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
        unit_id: selectedUnit,
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
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-slate-700">Your Subject</label>
                {selectedSubject && (
                  <button
                    onClick={() => setShowSubjectDialog(true)}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Change
                  </button>
                )}
              </div>
              
              {selectedSubject && currentSubjectData ? (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  {currentSubjectData.icon && (
                    <span className="text-2xl">{currentSubjectData.icon}</span>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{currentSubjectData.name}</p>
                    <p className="text-xs text-slate-500">{currentSubjectData.category}</p>
                  </div>
                  <Check className="w-5 h-5 text-emerald-600" />
                </div>
              ) : (
                <button
                  onClick={() => setShowSubjectDialog(true)}
                  className="w-full p-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-slate-400 hover:text-slate-600 transition-colors"
                >
                  Select a subject to begin
                </button>
              )}

              {selectedSubject && (
                <Button
                  onClick={() => setShowSubjectDialog(true)}
                  variant="outline"
                  className="w-full mt-3"
                >
                  Change Subject
                </Button>
              )}
            </div>

            {/* Unit & Skill Selection */}
            {selectedSubject && (
              <div>
                <SubjectUnitSelector
                  selectedSubject={selectedSubject}
                  selectedUnit={selectedUnit}
                  selectedSkill={selectedSkill}
                  onSubjectChange={handleSubjectChange}
                  onUnitChange={(unitId) => {
                    setSelectedUnit(unitId);
                    setSelectedSkill('');
                  }}
                  onSkillChange={setSelectedSkill}
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
              disabled={loading || !selectedSubject || !selectedUnit || !selectedSkill}
              className="w-full h-12"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Clock className="w-4 h-4 mr-2" />
              )}
              Start Exam
            </Button>

            {(!selectedSubject || !selectedUnit || !selectedSkill) && (
              <p className="text-xs text-center text-slate-500">
                Please select a subject, unit, and skill to continue
              </p>
            )}
          </div>

          <SubjectChangeDialog
            open={showSubjectDialog}
            onOpenChange={setShowSubjectDialog}
            currentSubject={selectedSubject}
            onSubjectChange={handleSubjectChange}
          />
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