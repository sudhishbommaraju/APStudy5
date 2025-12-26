import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Target, TrendingUp, Clock, Award, BookOpen, Zap } from 'lucide-react';
import { format, parseISO, subDays, differenceInMinutes } from 'date-fns';

export default function Analytics() {
  const [user, setUser] = useState(null);
  const [timeRange, setTimeRange] = useState('30'); // days

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        console.error('Failed to load user:', e);
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-slate-700 border-t-violet-500 rounded-full" />
      </div>
    );
  }

  // Filter by time range
  const cutoffDate = subDays(new Date(), parseInt(timeRange));
  const filteredAttempts = attempts.filter(a => 
    new Date(a.created_date) >= cutoffDate
  );
  const filteredSessions = sessions.filter(s => 
    new Date(s.created_date) >= cutoffDate
  );

  // Overall Stats
  const totalQuestions = filteredAttempts.length;
  const correctCount = filteredAttempts.filter(a => a.is_correct).length;
  const overallAccuracy = totalQuestions > 0 ? ((correctCount / totalQuestions) * 100).toFixed(1) : 0;
  const totalSessions = filteredSessions.length;

  // Time spent calculation
  const totalMinutes = filteredSessions.reduce((sum, s) => {
    return sum + (s.time_spent_seconds || 0) / 60;
  }, 0);
  const avgMinutesPerSession = totalSessions > 0 ? (totalMinutes / totalSessions).toFixed(0) : 0;

  // Accuracy by Subject
  const subjectStats = {};
  filteredAttempts.forEach(a => {
    if (!subjectStats[a.subject_id]) {
      subjectStats[a.subject_id] = { correct: 0, total: 0 };
    }
    subjectStats[a.subject_id].total++;
    if (a.is_correct) subjectStats[a.subject_id].correct++;
  });

  const subjectAccuracyData = Object.entries(subjectStats).map(([subjectId, stats]) => {
    const subject = subjects.find(s => s.subject_id === subjectId);
    return {
      name: subject?.name || subjectId,
      accuracy: ((stats.correct / stats.total) * 100).toFixed(1),
      total: stats.total,
    };
  }).sort((a, b) => b.accuracy - a.accuracy);

  // Accuracy by Unit
  const unitStats = {};
  filteredAttempts.forEach(a => {
    const key = `${a.subject_id}-${a.unit_name}`;
    if (!unitStats[key]) {
      unitStats[key] = { subject: a.subject_id, unit: a.unit_name, correct: 0, total: 0 };
    }
    unitStats[key].total++;
    if (a.is_correct) unitStats[key].correct++;
  });

  const unitAccuracyData = Object.values(unitStats)
    .map(stats => ({
      name: stats.unit,
      accuracy: ((stats.correct / stats.total) * 100).toFixed(1),
      total: stats.total,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Difficulty Breakdown
  const difficultyStats = { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } };
  filteredAttempts.forEach(a => {
    if (difficultyStats[a.difficulty]) {
      difficultyStats[a.difficulty].total++;
      if (a.is_correct) difficultyStats[a.difficulty].correct++;
    }
  });

  const difficultyData = Object.entries(difficultyStats).map(([difficulty, stats]) => ({
    name: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
    accuracy: stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : 0,
    total: stats.total,
  }));

  // Progress Over Time
  const dailyStats = {};
  filteredAttempts.forEach(a => {
    const date = format(parseISO(a.created_date), 'MMM dd');
    if (!dailyStats[date]) {
      dailyStats[date] = { correct: 0, total: 0 };
    }
    dailyStats[date].total++;
    if (a.is_correct) dailyStats[date].correct++;
  });

  const progressData = Object.entries(dailyStats).map(([date, stats]) => ({
    date,
    accuracy: ((stats.correct / stats.total) * 100).toFixed(1),
    questions: stats.total,
  })).slice(-14); // Last 14 days

  // Common Errors with Error Type Analysis
  const skillErrors = {};
  const errorTypeStats = {};
  filteredAttempts.filter(a => !a.is_correct).forEach(a => {
    if (!skillErrors[a.skill_name]) {
      skillErrors[a.skill_name] = 0;
    }
    skillErrors[a.skill_name]++;
    
    if (a.error_type && a.error_type !== 'none') {
      if (!errorTypeStats[a.error_type]) {
        errorTypeStats[a.error_type] = 0;
      }
      errorTypeStats[a.error_type]++;
    }
  });

  const commonErrors = Object.entries(skillErrors)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // AI-Powered Study Recommendations
  const generateRecommendations = () => {
    const recommendations = [];
    
    // Recommendation based on accuracy
    if (overallAccuracy < 70) {
      recommendations.push({
        type: 'accuracy',
        icon: '🎯',
        title: 'Focus on Understanding',
        description: 'Your accuracy is below 70%. Review explanations carefully and take more time per question.',
        action: 'Review weak skills',
      });
    }
    
    // Recommendation based on weak skills
    if (commonErrors.length > 0) {
      recommendations.push({
        type: 'skills',
        icon: '📚',
        title: `Master ${commonErrors[0].skill}`,
        description: `You've missed ${commonErrors[0].count} questions on this topic. Consider targeted practice.`,
        action: 'Practice this skill',
      });
    }
    
    // Recommendation based on consistency
    if (progressData.length >= 5) {
      const recentAccuracy = progressData.slice(-5).map(d => parseFloat(d.accuracy));
      const avgRecent = recentAccuracy.reduce((a, b) => a + b, 0) / recentAccuracy.length;
      if (avgRecent < overallAccuracy - 10) {
        recommendations.push({
          type: 'consistency',
          icon: '📊',
          title: 'Recent Performance Dip',
          description: 'Your recent accuracy is lower than usual. Consider taking a break or reviewing fundamentals.',
          action: 'Review basics',
        });
      }
    }
    
    // Recommendation based on study frequency
    if (totalSessions < 5 && timeRange === '30') {
      recommendations.push({
        type: 'frequency',
        icon: '⏰',
        title: 'Study More Consistently',
        description: 'Regular practice leads to better retention. Aim for at least 3 sessions per week.',
        action: 'Set study schedule',
      });
    }
    
    return recommendations;
  };

  const recommendations = generateRecommendations();

  // Skill-level detailed breakdown
  const skillDetailedStats = {};
  filteredAttempts.forEach(a => {
    if (!skillDetailedStats[a.skill_name]) {
      skillDetailedStats[a.skill_name] = {
        correct: 0,
        total: 0,
        byDifficulty: { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } },
      };
    }
    skillDetailedStats[a.skill_name].total++;
    if (a.is_correct) skillDetailedStats[a.skill_name].correct++;
    
    if (a.difficulty && skillDetailedStats[a.skill_name].byDifficulty[a.difficulty]) {
      skillDetailedStats[a.skill_name].byDifficulty[a.difficulty].total++;
      if (a.is_correct) skillDetailedStats[a.skill_name].byDifficulty[a.difficulty].correct++;
    }
  });

  const skillBreakdownData = Object.entries(skillDetailedStats)
    .map(([skill, stats]) => ({
      skill,
      accuracy: ((stats.correct / stats.total) * 100).toFixed(1),
      total: stats.total,
      byDifficulty: stats.byDifficulty,
    }))
    .sort((a, b) => b.total - a.total);

  const COLORS = ['#8B5CF6', '#6366F1', '#EC4899', '#F59E0B', '#10B981'];

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Performance Analytics</h1>
        <p className="page-description">Deep insights into your learning journey</p>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2 mb-6">
        {[7, 30, 90, 365].map(days => (
          <button
            key={days}
            onClick={() => setTimeRange(days.toString())}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              timeRange === days.toString()
                ? 'bg-violet-600 text-white shadow-lg'
                : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            {days === 365 ? 'All Time' : `${days} Days`}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-violet-400" />
            <span className="text-sm text-slate-400">Accuracy</span>
          </div>
          <p className="text-3xl font-bold text-slate-100">{overallAccuracy}%</p>
          <p className="text-xs text-slate-500 mt-1">{correctCount}/{totalQuestions} correct</p>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span className="text-sm text-slate-400">Questions</span>
          </div>
          <p className="text-3xl font-bold text-slate-100">{totalQuestions}</p>
          <p className="text-xs text-slate-500 mt-1">Total answered</p>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span className="text-sm text-slate-400">Sessions</span>
          </div>
          <p className="text-3xl font-bold text-slate-100">{totalSessions}</p>
          <p className="text-xs text-slate-500 mt-1">Practice sessions</p>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-slate-400">Avg Time</span>
          </div>
          <p className="text-3xl font-bold text-slate-100">{avgMinutesPerSession}m</p>
          <p className="text-xs text-slate-500 mt-1">Per session</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Accuracy Over Time */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Accuracy Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Line type="monotone" dataKey="accuracy" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: '#8B5CF6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Accuracy */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Accuracy by Subject</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={subjectAccuracyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="accuracy" fill="#6366F1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Difficulty Breakdown */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Performance by Difficulty</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={difficultyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, accuracy }) => `${name}: ${accuracy}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {difficultyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Units */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Most Practiced Units</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={unitAccuracyData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#94a3b8" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={100} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="accuracy" fill="#EC4899" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 backdrop-blur-sm rounded-xl border border-violet-500/30 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🤖</span>
            <h3 className="text-lg font-semibold text-slate-100">AI Study Recommendations</h3>
          </div>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div key={index} className="bg-slate-800/60 rounded-lg p-4 border border-slate-700/30">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{rec.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-100 mb-1">{rec.title}</h4>
                    <p className="text-sm text-slate-400">{rec.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Skill Breakdown */}
      {skillBreakdownData.length > 0 && (
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Detailed Skill Analysis</h3>
          <div className="space-y-4">
            {skillBreakdownData.slice(0, 10).map((skillData, index) => (
              <div key={index} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-slate-100">{skillData.skill}</span>
                  <span className={`font-semibold ${
                    parseFloat(skillData.accuracy) >= 80 ? 'text-emerald-400' :
                    parseFloat(skillData.accuracy) >= 60 ? 'text-amber-400' :
                    'text-rose-400'
                  }`}>
                    {skillData.accuracy}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-2 text-center">
                    <p className="text-emerald-400 font-semibold">Easy</p>
                    <p className="text-slate-300 mt-1">
                      {skillData.byDifficulty.easy.total > 0 
                        ? `${((skillData.byDifficulty.easy.correct / skillData.byDifficulty.easy.total) * 100).toFixed(0)}%`
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded p-2 text-center">
                    <p className="text-amber-400 font-semibold">Medium</p>
                    <p className="text-slate-300 mt-1">
                      {skillData.byDifficulty.medium.total > 0 
                        ? `${((skillData.byDifficulty.medium.correct / skillData.byDifficulty.medium.total) * 100).toFixed(0)}%`
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded p-2 text-center">
                    <p className="text-rose-400 font-semibold">Hard</p>
                    <p className="text-slate-300 mt-1">
                      {skillData.byDifficulty.hard.total > 0 
                        ? `${((skillData.byDifficulty.hard.correct / skillData.byDifficulty.hard.total) * 100).toFixed(0)}%`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Common Errors */}
      {commonErrors.length > 0 && (
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Most Common Mistakes</h3>
          <div className="space-y-3">
            {commonErrors.map((error, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg">
                <span className="text-slate-200">{error.skill}</span>
                <span className="text-rose-400 font-semibold">{error.count} errors</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}