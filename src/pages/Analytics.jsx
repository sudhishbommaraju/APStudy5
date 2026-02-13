import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Target, TrendingUp, Clock, Award, BookOpen, Zap } from 'lucide-react';
import { format, parseISO, subDays, differenceInMinutes } from 'date-fns';

export default function Analytics() {
  const [user, setUser] = useState(null);
  const [timeRange, setTimeRange] = useState('30'); // days
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedUnit, setSelectedUnit] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // date, accuracy, time

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

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list(),
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-slate-700 border-t-violet-500 rounded-full" />
      </div>
    );
  }

  // Filter by time range, subject, and unit
  const cutoffDate = subDays(new Date(), parseInt(timeRange));
  let filteredAttempts = attempts.filter(a => 
    new Date(a.created_date) >= cutoffDate
  );
  let filteredSessions = sessions.filter(s => 
    new Date(s.created_date) >= cutoffDate
  );

  if (selectedSubject !== 'all') {
    filteredAttempts = filteredAttempts.filter(a => a.subject_id === selectedSubject);
    filteredSessions = filteredSessions.filter(s => s.subject_id === selectedSubject);
  }

  if (selectedUnit !== 'all') {
    filteredAttempts = filteredAttempts.filter(a => a.unit_id === selectedUnit);
  }

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
      correct: stats.correct,
      byDifficulty: stats.byDifficulty,
    }))
    .sort((a, b) => b.total - a.total);

  // Identify common misconceptions
  const misconceptions = {};
  filteredAttempts.filter(a => !a.is_correct).forEach(a => {
    const key = `${a.skill_name}_${a.difficulty}`;
    if (!misconceptions[key]) {
      misconceptions[key] = {
        skill: a.skill_name,
        difficulty: a.difficulty,
        count: 0,
        examples: [],
      };
    }
    misconceptions[key].count++;
  });

  const topMisconceptions = Object.values(misconceptions)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Skill progression over time (last 30 days)
  const skillProgressionData = {};
  const last30Days = subDays(new Date(), 30);
  
  filteredAttempts
    .filter(a => parseISO(a.created_date) >= last30Days)
    .forEach(a => {
      const week = format(parseISO(a.created_date), 'MMM d');
      if (!skillProgressionData[a.skill_name]) {
        skillProgressionData[a.skill_name] = {};
      }
      if (!skillProgressionData[a.skill_name][week]) {
        skillProgressionData[a.skill_name][week] = { correct: 0, total: 0 };
      }
      skillProgressionData[a.skill_name][week].total++;
      if (a.is_correct) skillProgressionData[a.skill_name][week].correct++;
    });

  const COLORS = ['#8B5CF6', '#6366F1', '#EC4899', '#F59E0B', '#10B981'];

  // Average time per question
  const avgTimePerQuestion = filteredAttempts.length > 0 
    ? (filteredAttempts.reduce((sum, a) => sum + (a.time_spent_seconds || 30), 0) / filteredAttempts.length).toFixed(0)
    : 0;

  // Calculate current streak
  const sortedAttempts = [...filteredAttempts].sort((a, b) => 
    new Date(b.created_date) - new Date(a.created_date)
  );
  let currentStreak = 0;
  for (const attempt of sortedAttempts) {
    if (attempt.is_correct) currentStreak++;
    else break;
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Performance Analytics</h1>
        <p className="page-description">Deep insights into your learning journey</p>
      </div>

      {/* Filters */}
      <div className="space-y-4 mb-6">
        {/* Time Range Selector */}
        <div className="flex gap-2">
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

        {/* Subject and Unit Filters */}
        <div className="flex gap-3 flex-wrap">
          <select 
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setSelectedUnit('all');
            }}
            className="px-4 py-2 rounded-lg bg-slate-800/40 text-slate-300 border border-slate-700/50 text-sm"
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => (
              <option key={s.subject_id} value={s.subject_id}>{s.name}</option>
            ))}
          </select>

          {selectedSubject !== 'all' && (
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="px-4 py-2 rounded-lg bg-slate-800/40 text-slate-300 border border-slate-700/50 text-sm"
            >
              <option value="all">All Units</option>
              {units.filter(u => u.subject_id === selectedSubject).map(u => (
                <option key={u.id} value={u.id}>Unit {u.unit_number}: {u.unit_name}</option>
              ))}
            </select>
          )}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-800/40 text-slate-300 border border-slate-700/50 text-sm"
          >
            <option value="date">Sort by Date</option>
            <option value="accuracy">Sort by Accuracy</option>
            <option value="time">Sort by Time Spent</option>
          </select>
        </div>
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
          <p className="text-3xl font-bold text-slate-100">{avgTimePerQuestion}s</p>
          <p className="text-xs text-slate-500 mt-1">Per question</p>
        </div>
      </div>

      {/* Streaks Card */}
      <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 backdrop-blur-sm rounded-xl border border-orange-500/30 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-100 mb-1">🔥 Current Streak</h3>
            <p className="text-5xl font-bold text-orange-400">{currentStreak}</p>
            <p className="text-sm text-slate-400 mt-1">consecutive correct answers</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Keep it going!</p>
            <p className="text-xs text-slate-500 mt-1">Your best: {Math.max(currentStreak, 0)} answers</p>
          </div>
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

      {/* Skill Mastery Tracking */}
      {skillBreakdownData.length > 0 && (
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Skill Mastery Tracker</h3>
          <div className="space-y-4">
            {skillBreakdownData.slice(0, 10).map((skillData, index) => {
              const masteryLevel = 
                parseFloat(skillData.accuracy) >= 90 ? 'mastered' :
                parseFloat(skillData.accuracy) >= 75 ? 'proficient' :
                parseFloat(skillData.accuracy) >= 50 ? 'developing' : 'needs_work';
              
              const masteryColors = {
                mastered: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30',
                proficient: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
                developing: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
                needs_work: 'from-rose-500/20 to-red-500/20 border-rose-500/30',
              };

              const masteryLabels = {
                mastered: '✨ Mastered',
                proficient: '💪 Proficient',
                developing: '📈 Developing',
                needs_work: '⚠️ Needs Work',
              };

              return (
                <div key={index} className={`bg-gradient-to-r ${masteryColors[masteryLevel]} rounded-lg p-4 border`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-medium text-slate-100">{skillData.skill}</span>
                      <span className="ml-2 text-xs text-slate-400">
                        {skillData.correct}/{skillData.total} correct
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400 mb-1">{masteryLabels[masteryLevel]}</div>
                      <div className="text-xl font-bold text-slate-100">{skillData.accuracy}%</div>
                    </div>
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
              );
            })}
          </div>
        </div>
      )}

      {/* Common Misconceptions */}
      {topMisconceptions.length > 0 && (
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">⚠️ Common Misconceptions</h3>
          <p className="text-sm text-slate-400 mb-4">Topics where you frequently make mistakes</p>
          <div className="space-y-3">
            {topMisconceptions.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg">
                <div>
                  <span className="text-slate-200 font-medium">{item.skill}</span>
                  <span className="ml-2 text-xs text-slate-400">({item.difficulty})</span>
                </div>
                <span className="text-rose-400 font-semibold">{item.count} errors</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session History with Filters */}
      <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Practice Session History</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredSessions
            .sort((a, b) => {
              if (sortBy === 'date') return new Date(b.created_date) - new Date(a.created_date);
              if (sortBy === 'accuracy') return (b.correct_count || 0) / (b.total_questions || 1) - (a.correct_count || 0) / (a.total_questions || 1);
              if (sortBy === 'time') return (b.time_spent_seconds || 0) - (a.time_spent_seconds || 0);
              return 0;
            })
            .slice(0, 20)
            .map((session, index) => {
              const sessionAccuracy = session.total_questions > 0 
                ? ((session.correct_count / session.total_questions) * 100).toFixed(1)
                : 0;
              const subject = subjects.find(s => s.subject_id === session.subject_id);
              
              return (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-700/30 rounded-lg hover:border-violet-500/30 transition-all">
                  <div>
                    <p className="font-medium text-slate-100">{subject?.name || session.subject_id}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {format(parseISO(session.created_date), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-violet-400">{sessionAccuracy}%</p>
                    <p className="text-xs text-slate-500">{session.correct_count}/{session.total_questions} correct</p>
                    <p className="text-xs text-slate-500">{Math.floor((session.time_spent_seconds || 0) / 60)}m {((session.time_spent_seconds || 0) % 60)}s</p>
                  </div>
                </div>
              );
            })}
          {filteredSessions.length === 0 && (
            <p className="text-center text-slate-400 py-8">No practice sessions found for the selected filters</p>
          )}
        </div>
      </div>

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