import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { ArrowLeft, TrendingUp, Target, BookOpen, Zap, Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';

const DIFFICULTY_COLORS = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444' };
const SUBJECT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

export default function AnalyticsDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [skillMastery, setSkillMastery] = useState([]);
  const [filter, setFilter] = useState('all'); // all | SAT | ACT | AP

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const user = await base44.auth.me();
    const [hist, atts, skills] = await Promise.all([
      base44.entities.PracticeHistory.filter({ user_email: user.email }, '-completed_at', 100),
      base44.entities.Attempt.filter({}, '-created_date', 200),
      base44.entities.SkillMastery.filter({}, '-last_practiced', 50),
    ]);
    setSessions(hist);
    setAttempts(atts);
    setSkillMastery(skills);
    setLoading(false);
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const filtered = filter === 'all' ? sessions : sessions.filter(s =>
    filter === 'AP' ? !['SAT', 'ACT'].includes(s.subject_id?.toUpperCase()) :
    s.subject_id?.toUpperCase().startsWith(filter)
  );

  // Trend over time (last 20 sessions)
  const trendData = [...filtered].reverse().slice(-20).map((s, i) => ({
    idx: i + 1,
    score: s.score_pct ?? Math.round((s.correct_count / s.total_questions) * 100),
    label: s.subject_name?.slice(0, 12) || `#${i + 1}`,
  }));

  // By subject accuracy
  const subjectMap = {};
  filtered.forEach(s => {
    const key = s.subject_name || s.subject_id || 'Unknown';
    if (!subjectMap[key]) subjectMap[key] = { total: 0, correct: 0, sessions: 0 };
    subjectMap[key].total += s.total_questions || 0;
    subjectMap[key].correct += s.correct_count || 0;
    subjectMap[key].sessions += 1;
  });
  const subjectData = Object.entries(subjectMap)
    .map(([name, d]) => ({ name: name.length > 16 ? name.slice(0, 14) + '…' : name, accuracy: d.total ? Math.round((d.correct / d.total) * 100) : 0, sessions: d.sessions }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 8);

  // Difficulty distribution from attempts
  const diffMap = { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } };
  attempts.forEach(a => {
    const d = a.difficulty || 'medium';
    if (diffMap[d]) { diffMap[d].total++; if (a.is_correct) diffMap[d].correct++; }
  });
  const diffData = Object.entries(diffMap).map(([name, d]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    accuracy: d.total ? Math.round((d.correct / d.total) * 100) : 0,
    count: d.total,
  }));

  // Mastery pie
  const masteryMap = { not_started: 0, developing: 0, proficient: 0, mastered: 0 };
  skillMastery.forEach(s => { if (masteryMap[s.mastery_level] !== undefined) masteryMap[s.mastery_level]++; });
  const masteryData = [
    { name: 'Not Started', value: masteryMap.not_started, color: '#e5e7eb' },
    { name: 'Developing', value: masteryMap.developing, color: '#fbbf24' },
    { name: 'Proficient', value: masteryMap.proficient, color: '#60a5fa' },
    { name: 'Mastered', value: masteryMap.mastered, color: '#34d399' },
  ].filter(d => d.value > 0);

  // KPIs
  const totalSessions = filtered.length;
  const avgScore = totalSessions > 0 ? Math.round(filtered.reduce((s, x) => s + (x.score_pct ?? 0), 0) / totalSessions) : 0;
  const totalQuestions = filtered.reduce((s, x) => s + (x.total_questions || 0), 0);
  const overallAccuracy = totalQuestions > 0
    ? Math.round((filtered.reduce((s, x) => s + (x.correct_count || 0), 0) / totalQuestions) * 100)
    : 0;

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <button
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Performance Analytics</h1>
            <p className="text-gray-500 text-sm mt-1">Your practice trends across all subjects</p>
          </div>
          {/* Filter */}
          <div className="flex gap-2">
            {['all', 'SAT', 'ACT', 'AP'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  filter === f
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Sessions', value: totalSessions, icon: BookOpen, color: 'text-blue-500' },
            { label: 'Avg Score', value: `${avgScore}%`, icon: TrendingUp, color: 'text-green-500' },
            { label: 'Overall Accuracy', value: `${overallAccuracy}%`, icon: Target, color: 'text-purple-500' },
            { label: 'Questions Answered', value: totalQuestions, icon: Zap, color: 'text-orange-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <p className="text-sm text-gray-500">{label}</p>
              </div>
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Score Trend */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Score Trend (Last 20 Sessions)</h2>
          {trendData.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="idx" stroke="#94a3b8" tick={{ fontSize: 12 }} label={{ value: 'Session', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v) => [`${v}%`, 'Score']} contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState text="Complete more sessions to see your score trend." />
          )}
        </div>

        {/* Subject Accuracy + Difficulty */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Accuracy by Subject</h2>
            {subjectData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={subjectData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Accuracy']} contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
                    {subjectData.map((_, i) => (
                      <Cell key={i} fill={SUBJECT_COLORS[i % SUBJECT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState text="No subject data yet." />
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Accuracy by Difficulty</h2>
            {attempts.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={diffData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(v, n) => n === 'accuracy' ? [`${v}%`, 'Accuracy'] : [v, 'Questions']} contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                    {diffData.map((d) => (
                      <Cell key={d.name} fill={DIFFICULTY_COLORS[d.name.toLowerCase()] || '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState text="No attempt data yet." />
            )}
          </div>
        </div>

        {/* Skill Mastery Pie + Difficulty Count */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Skill Mastery Distribution</h2>
            {masteryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={masteryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {masteryData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState text="No skill mastery data yet." />
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Questions by Difficulty</h2>
            {attempts.length > 0 ? (
              <div className="space-y-4 pt-2">
                {diffData.map(d => (
                  <div key={d.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{d.name}</span>
                      <span className="text-gray-500">{d.count} questions · {d.accuracy}% correct</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all"
                        style={{ width: `${d.accuracy}%`, background: DIFFICULTY_COLORS[d.name.toLowerCase()] }}
                      />
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total attempts</span>
                    <span className="font-semibold text-gray-900">{attempts.length}</span>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState text="No attempt data yet." />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="h-40 flex items-center justify-center text-gray-400 text-sm">{text}</div>
  );
}