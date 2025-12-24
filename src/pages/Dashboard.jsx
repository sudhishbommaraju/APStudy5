import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  BookOpen, 
  Target, 
  Clock, 
  TrendingUp, 
  ArrowRight, 
  Play,
  FileText,
  Brain,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, subDays, parseISO } from 'date-fns';
import Calendar from '@/components/dashboard/Calendar';
import { checkCredits, useCredit } from '@/components/monetization/CreditHelper';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [generatingWeakPractice, setGeneratingWeakPractice] = useState(false);
  
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        // Redirect to onboarding if not completed
        if (currentUser && !currentUser.onboarding_complete) {
          window.location.href = createPageUrl('Onboarding');
        }
      } catch (e) {
        // User not authenticated, continue without user
      }
    };
    loadUser();
  }, []);

  const { data: attempts = [] } = useQuery({
    queryKey: ['attempts', user?.email],
    queryFn: () => base44.entities.Attempt.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', user?.email],
    queryFn: () => base44.entities.Session.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list('subject_id'),
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units', selectedSubject],
    queryFn: () => base44.entities.Unit.filter({ subject_id: selectedSubject }),
    enabled: !!selectedSubject,
  });

  // Already filtered by user at query level
  const userAttempts = attempts;

  // Calculate stats
  const totalQuestions = userAttempts.length;
  const correctCount = userAttempts.filter(a => a.is_correct).length;
  const overallAccuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

  // Get time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Recommendation based on recent activity
  const lastAttempt = userAttempts[0];
  const recommendedSubject = lastAttempt ? subjects.find(s => s.subject_id === lastAttempt.subject_id) : null;

  const handleStartPractice = () => {
    if (selectedSubject) {
      navigate(createPageUrl('Practice') + `?subject=${selectedSubject}${selectedUnit ? `&unit=${selectedUnit}` : ''}`);
    }
  };

  const handleStartExam = () => {
    if (selectedSubject) {
      navigate(createPageUrl('Exam') + `?subject=${selectedSubject}`);
    }
  };

  // Recent sessions - already filtered by user
  const recentSessions = sessions
    .filter(s => s.status === 'completed')
    .slice(0, 5);

  // Study streak (days in a row with attempts)
  const studyDays = new Set();
  userAttempts.forEach(a => {
    studyDays.add(format(parseISO(a.created_date), 'yyyy-MM-dd'));
  });

  const handleWeakSubjectPractice = async (weakSubject) => {
    // Check credits
    const { allowed } = await checkCredits(user, 'daily_practice_count');
    if (!allowed) {
      alert('Daily practice limit reached. Please upgrade to Pro for unlimited practice.');
      return;
    }

    setGeneratingWeakPractice(true);

    try {
      // Use a credit
      const updatedUser = await useCredit(user, 'daily_practice_count');
      setUser(updatedUser);

      const subject = subjects.find(s => s.subject_id === weakSubject.subject_id);
      const allUnits = await base44.entities.Unit.filter({ subject_id: weakSubject.subject_id });
      
      // Generate 10 questions for the weak subject
      const questionsToGenerate = [];
      for (let i = 0; i < 10; i++) {
        const randomUnit = allUnits[Math.floor(Math.random() * allUnits.length)];
        
        const prompt = `Generate an exam-style multiple choice question for ${subject?.name || 'general topic'}. Unit: ${randomUnit?.unit_name || 'General'}

CRITICAL FORMATTING REQUIREMENTS:
1. FORMAT ALL NUMBERS AND FORMULAS IN LaTeX
2. Use inline math $...$ for ALL numbers, variables, and formulas
3. Units MUST use \\text{} inside math: $9.8 \\text{ m/s}^{2}$
4. PERCENTAGES: Write as plain numbers with % sign: "80%" NOT "$80\\%$" or "$80 \\text{%}$"
5. COORDINATES: Format as $(x, y)$ with a space after the comma, e.g., $(3, 5)$ NOT $(3,5)$

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
          }).then(r => ({ ...r, unit: randomUnit }))
        );
      }

      const responses = await Promise.all(questionsToGenerate);
      
      const questions = await Promise.all(
        responses.map(({ unit, ...r }) => 
          base44.entities.Question.create({
            subject_id: weakSubject.subject_id,
            unit_id: unit?.id || '',
            skill_id: '',
            unit_name: unit?.unit_name || '',
            skill_name: 'General',
            difficulty: 'medium',
            question_text: r.question_text,
            table_data: '',
            graph_data: '',
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

      // Navigate to practice with the generated questions
      navigate(createPageUrl('Practice'), { 
        state: { 
          preloadedQuestions: questions,
          subjectId: weakSubject.subject_id 
        } 
      });
    } catch (e) {
      console.error('Failed to generate practice:', e);
      alert('Failed to generate practice questions. Please try again.');
    }
    
    setGeneratingWeakPractice(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-slate-700 border-t-violet-500 rounded-full" />
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">
          {getGreeting()}{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="page-description">
          Choose a subject and start a personalized study session.
        </p>
      </div>

      <div className="space-y-6">
  
        {/* Recommended Study Subject */}
        {totalQuestions > 10 && (() => {
          // Find weakest subject based on accuracy
          const subjectStats = {};
          userAttempts.forEach(a => {
            if (!subjectStats[a.subject_id]) {
              subjectStats[a.subject_id] = { correct: 0, total: 0 };
            }
            subjectStats[a.subject_id].total++;
            if (a.is_correct) subjectStats[a.subject_id].correct++;
          });
          
          const weakestSubject = Object.entries(subjectStats)
            .filter(([_, stats]) => stats.total >= 5) // Only consider subjects with at least 5 attempts
            .map(([subject_id, stats]) => ({
              subject_id,
              accuracy: (stats.correct / stats.total) * 100,
              ...stats
            }))
            .sort((a, b) => a.accuracy - b.accuracy)[0];
          
          if (weakestSubject) {
            const subjectData = subjects.find(s => s.subject_id === weakestSubject.subject_id);
            if (subjectData) {
              return (
                <div className="bg-gradient-to-br from-rose-500/10 to-orange-500/10 backdrop-blur-sm rounded-xl border border-rose-500/30 p-6 shadow-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-rose-200 mb-1">⚠️ Needs Attention</h3>
                      <p className="text-xs text-rose-300/80">Focus on your weakest area</p>
                    </div>
                    <Target className="w-5 h-5 text-rose-400" />
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{subjectData.icon}</span>
                    <div>
                      <p className="text-base font-semibold text-slate-100">{subjectData.name}</p>
                      <p className="text-sm text-rose-300">
                        {weakestSubject.accuracy.toFixed(0)}% accuracy • {weakestSubject.correct}/{weakestSubject.total} correct
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleWeakSubjectPractice(weakestSubject)}
                    size="sm"
                    className="w-full bg-rose-500 hover:bg-rose-600"
                    disabled={generatingWeakPractice}
                  >
                    {generatingWeakPractice ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-4 h-4 mr-2" />
                        Practice {subjectData.name}
                      </>
                    )}
                  </Button>
                </div>
              );
            }
          }
          return null;
        })()}

        {/* Progress Snapshot */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Your Progress</h3>
          <div className="grid sm:grid-cols-3 gap-2">
            <div className="text-center p-2 bg-slate-900/50 rounded-lg border border-slate-700/30">
              <div className="text-xl font-bold text-slate-100">{totalQuestions}</div>
              <div className="text-xs text-slate-400 mt-0.5">Questions</div>
            </div>
            <div className="text-center p-2 bg-slate-900/50 rounded-lg border border-slate-700/30">
              <div className="text-xl font-bold text-violet-400">{overallAccuracy.toFixed(0)}%</div>
              <div className="text-xs text-slate-400 mt-0.5">Accuracy</div>
            </div>
            <div className="text-center p-2 bg-slate-900/50 rounded-lg border border-slate-700/30">
              <div className="text-xl font-bold text-slate-100">{studyDays.size}</div>
              <div className="text-xs text-slate-400 mt-0.5">Study Days</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate(createPageUrl('Practice'))}
            className="bg-slate-800/40 backdrop-blur-sm rounded-lg border border-slate-700/50 p-3 hover:border-violet-500/50 hover:bg-slate-800/60 transition-all text-left"
          >
            <BookOpen className="w-5 h-5 text-violet-400 mb-2" />
            <div className="text-sm font-medium text-slate-100">Practice</div>
            <div className="text-xs text-slate-400 mt-0.5">Master topics</div>
          </button>

          <button
            onClick={() => navigate(createPageUrl('Exam'))}
            className="bg-slate-800/40 backdrop-blur-sm rounded-lg border border-slate-700/50 p-3 hover:border-violet-500/50 hover:bg-slate-800/60 transition-all text-left"
          >
            <Clock className="w-5 h-5 text-violet-400 mb-2" />
            <div className="text-sm font-medium text-slate-100">Exam</div>
            <div className="text-xs text-slate-400 mt-0.5">Timed test</div>
          </button>

          <button
            onClick={() => navigate(createPageUrl('Notes'))}
            className="bg-slate-800/40 backdrop-blur-sm rounded-lg border border-slate-700/50 p-3 hover:border-violet-500/50 hover:bg-slate-800/60 transition-all text-left"
          >
            <FileText className="w-5 h-5 text-violet-400 mb-2" />
            <div className="text-sm font-medium text-slate-100">Notes</div>
            <div className="text-xs text-slate-400 mt-0.5">Key concepts</div>
          </button>

          <button
            onClick={() => navigate(createPageUrl('Progress'))}
            className="bg-slate-800/40 backdrop-blur-sm rounded-lg border border-slate-700/50 p-3 hover:border-violet-500/50 hover:bg-slate-800/60 transition-all text-left"
          >
            <TrendingUp className="w-5 h-5 text-violet-400 mb-2" />
            <div className="text-sm font-medium text-slate-100">Progress</div>
            <div className="text-xs text-slate-400 mt-0.5">Track growth</div>
          </button>
        </div>

        {/* Calendar */}
        <Calendar user={user} />
      </div>
    </>
  );
}