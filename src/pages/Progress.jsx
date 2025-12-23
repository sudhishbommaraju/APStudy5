import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  ChevronLeft, 
  TrendingUp, 
  Target, 
  Calendar,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SkillAccuracyChart from '@/components/dashboard/SkillAccuracyChart';
import AccuracyOverTimeChart from '@/components/dashboard/AccuracyOverTimeChart';
import { format, subDays, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Progress() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          base44.auth.redirectToLogin(window.location.pathname);
          return;
        }
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        base44.auth.redirectToLogin(window.location.pathname);
      }
    };
    loadUser();
  }, []);

  const { data: attempts = [] } = useQuery({
    queryKey: ['attempts'],
    queryFn: () => base44.entities.Attempt.list('-created_date', 1000),
    enabled: !!user,
  });

  const userAttempts = attempts.filter(a => a.created_by === user?.email);

  // Calculate skill stats
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
      name: name.length > 25 ? name.substring(0, 25) + '...' : name,
      fullName: name,
      accuracy: (stats.correct / stats.total) * 100,
      correct: stats.correct,
      total: stats.total,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);

  // Accuracy over time
  const accuracyByDate = {};
  for (let i = 29; i >= 0; i--) {
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
      total: stats.total,
    }));

  // Difficulty breakdown
  const difficultyStats = { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 }};
  userAttempts.forEach(attempt => {
    if (difficultyStats[attempt.difficulty]) {
      difficultyStats[attempt.difficulty].total++;
      if (attempt.is_correct) difficultyStats[attempt.difficulty].correct++;
    }
  });

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #e8f1f8, #d9e9f5)', fontFamily: 'Georgia, serif' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Progress Report</h1>
            <p className="text-slate-500">Detailed breakdown of your performance</p>
          </div>
        </div>

        {userAttempts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">No data yet</h3>
            <p className="text-slate-500 text-sm mb-6">
              Complete some practice questions to see your progress
            </p>
            <Link to={createPageUrl('Practice')}>
              <Button>
                Start Practicing
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="text-sm font-medium text-slate-500">Total Questions</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{userAttempts.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="text-sm font-medium text-slate-500">Overall Accuracy</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {((userAttempts.filter(a => a.is_correct).length / userAttempts.length) * 100).toFixed(0)}%
                </p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="text-sm font-medium text-slate-500">Skills Practiced</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{Object.keys(skillStats).length}</p>
              </div>
            </div>

            {/* Difficulty Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Performance by Difficulty</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {Object.entries(difficultyStats).map(([difficulty, stats]) => {
                  const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
                  return (
                    <div key={difficulty} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium capitalize",
                          difficulty === 'easy' && "bg-emerald-100 text-emerald-700",
                          difficulty === 'medium' && "bg-amber-100 text-amber-700",
                          difficulty === 'hard' && "bg-rose-100 text-rose-700"
                        )}>
                          {difficulty}
                        </span>
                        <span className="text-sm text-slate-500">{stats.total} questions</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all",
                            accuracy >= 70 ? "bg-emerald-500" :
                            accuracy >= 50 ? "bg-amber-500" :
                            "bg-rose-500"
                          )}
                          style={{ width: `${accuracy}%` }}
                        />
                      </div>
                      <p className="text-lg font-semibold text-slate-900 mt-2">
                        {accuracy.toFixed(0)}%
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Progress Over Time */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Accuracy Over Time</h3>
              <AccuracyOverTimeChart data={accuracyOverTimeData} />
            </div>

            {/* Skill Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Accuracy by Skill</h3>
              <SkillAccuracyChart data={skillAccuracyData} />
            </div>

            {/* Weak Skills */}
            {skillAccuracyData.filter(s => s.accuracy < 70).length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-900">Focus Areas</h3>
                </div>
                <div className="space-y-3">
                  {skillAccuracyData
                    .filter(s => s.accuracy < 70)
                    .slice(0, 5)
                    .map((skill) => (
                      <div key={skill.fullName} className="flex items-center justify-between">
                        <span className="text-sm text-amber-900">{skill.fullName}</span>
                        <span className="text-sm font-medium text-amber-700">
                          {skill.accuracy.toFixed(0)}% ({skill.correct}/{skill.total})
                        </span>
                      </div>
                    ))}
                </div>
                <Link to={createPageUrl('Practice')}>
                  <Button className="mt-4 bg-amber-600 hover:bg-amber-700">
                    Practice These Skills
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}