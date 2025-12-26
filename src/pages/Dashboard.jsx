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
  Loader2,
  Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, subDays, parseISO, differenceInDays } from 'date-fns';
import Calendar from '@/components/dashboard/Calendar';
import { checkCredits, useCredit } from '@/components/monetization/CreditHelper';
import ReviewPopup from '@/components/reviews/ReviewPopup';
import ReviewCard from '@/components/reviews/ReviewCard';
import Leaderboard from '@/components/gamification/Leaderboard';
import { getUserStats } from '@/components/gamification/GamificationHelper';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [generatingWeakPractice, setGeneratingWeakPractice] = useState(false);
  const [showReviewPopup, setShowReviewPopup] = useState(false);
  const [userStats, setUserStats] = useState(null);
  
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        // Redirect to onboarding if not completed
        if (currentUser && !currentUser.onboarding_complete) {
          window.location.href = createPageUrl('Onboarding');
        }
        // Load gamification stats
        const stats = await getUserStats(currentUser.email);
        setUserStats(stats);
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

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => base44.entities.Review.filter({ is_public: true }),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
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

  // Check if user should see review prompt
  useEffect(() => {
    if (!user) return;

    const checkReviewPrompt = async () => {
      // Condition 1: User has not submitted a review
      if (user.review_submitted) return;

      // Condition 2: User has not dismissed in last 30 days
      if (user.last_review_prompt_dismissed) {
        const daysSinceDismiss = differenceInDays(new Date(), parseISO(user.last_review_prompt_dismissed));
        if (daysSinceDismiss < 30) return;
      }

      // Condition 3: User has completed at least 3 sessions OR 1 exam
      const completedSessions = sessions.filter(s => s.status === 'completed').length;
      const completedExams = sessions.filter(s => s.status === 'completed' && s.mode === 'exam').length;
      if (completedSessions < 3 && completedExams < 1) return;

      // Condition 4: User has been active for at least 5 days
      if (studyDays.size < 5) return;

      // Show popup
      setShowReviewPopup(true);
    };

    checkReviewPrompt();
  }, [user, sessions, studyDays]);

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

        CRITICAL RULE - ANSWER CHOICES PURE LATEX (NO PLAIN TEXT AFTER):

        ✓ CORRECT choice_a: "$F = \\frac{Gm^{2}}{r^{2}}$"
        ✗ WRONG choice_a: "$F = \\frac{Gm^{2}}{r^{2}}$ F = r2Gm2"

        ✓ CORRECT choice_b: "$CH_{4}$"
        ✗ WRONG choice_b: "$CH_{4}$CH4"

        ABSOLUTE RULES:
        1. Write formulas ONCE in LaTeX ($...$) only - NO plain text after
        2. NO unicode (₂ ³) - use LaTeX subscripts/superscripts
        3. NO "ext" - use \\text{}: "$100\\text{°C}$"
        4. NO duplication: NOT "$m=5$m=5", NOT "$H_{2}O$H2O"

        VERIFY EACH CHOICE before returning:
        - choice_a has LaTeX then plain text? DELETE plain text
        - choice_b has LaTeX then plain text? DELETE plain text
        - choice_c has LaTeX then plain text? DELETE plain text
        - choice_d has LaTeX then plain text? DELETE plain text

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

  const handleReviewSubmit = async (rating, reviewText) => {
    try {
      // Get most recent subject
      const recentSubject = userAttempts[0]?.subject_id;
      const subjectName = subjects.find(s => s.subject_id === recentSubject)?.name;

      await base44.entities.Review.create({
        user_id: user.email,
        star_rating: rating,
        review_text: reviewText || '',
        subject_context: subjectName || '',
        is_public: true,
      });

      await base44.auth.updateMe({
        review_submitted: true,
      });

      setUser({ ...user, review_submitted: true });
    } catch (e) {
      console.error('Failed to submit review:', e);
    }
  };

  const handleReviewDismiss = async () => {
    try {
      await base44.auth.updateMe({
        last_review_prompt_dismissed: new Date().toISOString(),
      });
      setUser({ ...user, last_review_prompt_dismissed: new Date().toISOString() });
    } catch (e) {
      console.error('Failed to dismiss review:', e);
    }
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

        {/* Progress Snapshot with Level */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Your Progress</h3>
            <div className="grid grid-cols-3 gap-2">
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

          {userStats && (
            <div className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl border border-violet-500/30 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-2xl font-bold text-slate-100">Level {userStats.level}</h3>
                  <p className="text-sm text-slate-400">{userStats.total_points} points</p>
                </div>
                <Trophy className="w-10 h-10 text-violet-400" />
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-gradient-to-r from-violet-600 to-purple-600"
                  style={{ width: `${((userStats.total_points % 100) / 100) * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">{((userStats.level) * 100) - userStats.total_points} points to level {userStats.level + 1}</p>
            </div>
          )}
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

        {/* Leaderboard */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 shadow-lg mb-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">🏆 Top Learners</h3>
          <Leaderboard />
        </div>

        {/* Student Reviews Section */}
        {reviews.length > 0 && (
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Student Reviews</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {reviews.slice(0, 4).map((review) => {
                const reviewUser = allUsers.find(u => u.email === review.user_id);
                return (
                  <ReviewCard key={review.id} review={review} user={reviewUser} />
                );
              })}
            </div>
          </div>
        )}
        </div>

      {/* Review Popup */}
      <ReviewPopup
        open={showReviewPopup}
        onOpenChange={setShowReviewPopup}
        onSubmit={handleReviewSubmit}
        onDismiss={handleReviewDismiss}
      />
    </>
  );
}