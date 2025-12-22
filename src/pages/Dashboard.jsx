import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  BookOpen, 
  Target, 
  Clock, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2,
  XCircle,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatsCard from '@/components/dashboard/StatsCard';
import SkillAccuracyChart from '@/components/dashboard/SkillAccuracyChart';
import AccuracyOverTimeChart from '@/components/dashboard/AccuracyOverTimeChart';
import RecommendationCard from '@/components/dashboard/RecommendationCard';
import { format, subDays, parseISO } from 'date-fns';

const EXAM_NAMES = {
  ap_calculus: 'AP Calculus',
  sat_math: 'SAT Math',
  act_math: 'ACT Math',
  psat_math: 'PSAT Math',
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      // Redirect to onboarding if not completed
      if (!currentUser.onboarding_complete) {
        window.location.href = createPageUrl('Onboarding');
      }
    };
    loadUser();
  }, []);

  const { data: attempts = [] } = useQuery({
    queryKey: ['attempts'],
    queryFn: () => base44.entities.Attempt.list('-created_date', 500),
    enabled: !!user,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.Session.list('-created_date', 50),
    enabled: !!user,
  });

  const userAttempts = attempts.filter(a => a.created_by === user?.email);

  // Calculate stats
  const totalQuestions = userAttempts.length;
  const correctCount = userAttempts.filter(a => a.is_correct).length;
  const overallAccuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

  // Accuracy by skill
  const skillStats = {};
  userAttempts.forEach(attempt => {
    if (!skillStats[attempt.skill_name]) {
      skillStats[attempt.skill_name] = { correct: 0, total: 0 };
    }
    skillStats[attempt.skill_name].total++;
    if (attempt.is_correct) skillStats[attempt.skill_name].correct++;
  });

  const skillAccuracyData = Object.entries(skillStats)
    .map(([name, stats]) => ({
      name: name.length > 20 ? name.substring(0, 20) + '...' : name,
      fullName: name,
      accuracy: (stats.correct / stats.total) * 100,
      correct: stats.correct,
      total: stats.total,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);

  // Accuracy over time (last 14 days)
  const accuracyByDate = {};
  for (let i = 13; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'MMM d');
    accuracyByDate[date] = { correct: 0, total: 0 };
  }

  userAttempts.forEach(attempt => {
    const date = format(parseISO(attempt.created_date), 'MMM d');
    if (accuracyByDate[date]) {
      accuracyByDate[date].total++;
      if (attempt.is_correct) accuracyByDate[date].correct++;
    }
  });

  const accuracyOverTimeData = Object.entries(accuracyByDate)
    .filter(([_, stats]) => stats.total > 0)
    .map(([date, stats]) => ({
      date,
      accuracy: (stats.correct / stats.total) * 100,
    }));

  // Recommendations
  const recommendations = skillAccuracyData
    .filter(s => s.total >= 2)
    .slice(0, 5)
    .map(s => ({
      skill_name: s.fullName,
      accuracy: s.accuracy,
      attempts: s.total,
      priority: s.accuracy < 50 ? 'high' : s.accuracy < 70 ? 'medium' : 'low',
      difficulty: s.accuracy < 40 ? 'easy' : s.accuracy < 70 ? 'medium' : 'hard',
    }));

  // Recent sessions
  const recentSessions = sessions
    .filter(s => s.created_by === user?.email && s.status === 'completed')
    .slice(0, 5);

  // Study streak (days in a row with attempts)
  const studyDays = new Set();
  userAttempts.forEach(a => {
    studyDays.add(format(parseISO(a.created_date), 'yyyy-MM-dd'));
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d4a6f)', fontFamily: 'Georgia, serif' }}>
      {/* Galaxy Hero Header */}
      <div className="galaxy-gradient">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-slate-300">
            Ready to master your subjects
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 -mt-6">

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Link to={createPageUrl('Practice')}>
            <div className="rounded-xl p-5 cursor-pointer shadow-lg hover:shadow-xl transition-all" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Practice Mode</p>
                  <p className="text-lg font-semibold mt-1">Start Practicing</p>
                </div>
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </Link>
          <Link to={createPageUrl('Exam')}>
            <div className="bg-white rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer" style={{ border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Exam Mode</p>
                  <p className="text-lg font-semibold mt-1" style={{ color: 'var(--color-text-primary)' }}>Take a Test</p>
                </div>
                <Clock className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
              </div>
            </div>
          </Link>
          <Link to={createPageUrl('Generate')}>
            <div className="bg-white rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer" style={{ border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>AI Generator</p>
                  <p className="text-lg font-semibold mt-1" style={{ color: 'var(--color-text-primary)' }}>Create Questions</p>
                </div>
                <Zap className="w-5 h-5" style={{ color: 'var(--color-accent-secondary)' }} />
              </div>
            </div>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Questions Answered"
            value={totalQuestions}
            icon={BookOpen}
          />
          <StatsCard
            title="Overall Accuracy"
            value={`${overallAccuracy.toFixed(0)}%`}
            subtitle={`${correctCount} correct`}
            icon={Target}
          />
          <StatsCard
            title="Study Days"
            value={studyDays.size}
            icon={TrendingUp}
          />
          <StatsCard
            title="Exams Completed"
            value={recentSessions.length}
            icon={CheckCircle2}
          />
        </div>

        {/* Charts and Recommendations */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Skill Accuracy */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Accuracy by Skill</h3>
            <SkillAccuracyChart data={skillAccuracyData.slice(0, 8)} />
          </div>

          {/* Recommendations */}
          <RecommendationCard 
            recommendations={recommendations}
          />
        </div>

        {/* Accuracy Over Time */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <h3 className="font-semibold text-slate-900 mb-4">Progress Over Time</h3>
          <AccuracyOverTimeChart data={accuracyOverTimeData} />
        </div>

        {/* Recent Activity */}
        {recentSessions.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Recent Exams</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {recentSessions.map((session) => (
                <div key={session.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">
                      {session.total_questions} questions
                    </p>
                    <p className="text-sm text-slate-500">
                      {format(parseISO(session.created_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {((session.correct_count / session.total_questions) * 100).toFixed(0)}%
                    </p>
                    <p className="text-sm text-slate-500">
                      {session.correct_count}/{session.total_questions} correct
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}