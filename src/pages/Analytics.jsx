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

  // Common Errors
  const skillErrors = {};
  filteredAttempts.filter(a => !a.is_correct).forEach(a => {
    if (!skillErrors[a.skill_name]) {
      skillErrors[a.skill_name] = 0;
    }
    skillErrors[a.skill_name]++;
  });

  const commonErrors = Object.entries(skillErrors)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

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

      {/* Common Errors */}
      {commonErrors.length > 0 && (
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Areas Need Attention</h3>
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