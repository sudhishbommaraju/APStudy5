import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Calendar, Target, Zap } from 'lucide-react';

export default function ProgressDashboard() {
  const [sessions, setSessions] = useState([]);
  const [skillPerf, setSkillPerf] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const user = await base44.auth.me();
      
      // Fetch practice sessions
      const sessionsData = await base44.entities.EnginePracticeSession.filter({
        user_email: user.email
      }, '-completed_at', 50);
      
      // Fetch skill performance
      const perfData = await base44.entities.EngineUserSkillPerformance.filter({
        user_email: user.email
      }, '-last_updated', 20);
      
      setSessions(sessionsData);
      setSkillPerf(perfData);
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare progress data by week
  const progressByWeek = sessions.reduce((acc, session) => {
    if (!session.completed_at) return acc;
    const date = new Date(session.completed_at);
    const week = `${date.getMonth() + 1}/${date.getDate()}`;
    const existing = acc.find(d => d.week === week);
    if (existing) {
      existing.sessions += 1;
      existing.accuracy = (existing.accuracy + (session.score || 0)) / 2;
    } else {
      acc.push({
        week,
        sessions: 1,
        accuracy: session.score || 0
      });
    }
    return acc;
  }, []);

  // Skill breakdown
  const skillBreakdown = skillPerf.map(s => ({
    name: s.skill_id,
    accuracy: Math.round(s.accuracy || 0),
    attempts: s.attempts || 0
  }));

  // Stats
  const totalSessions = sessions.length;
  const avgAccuracy = sessions.length > 0 
    ? Math.round(sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length)
    : 0;
  const weekStreak = progressByWeek.length;

  if (loading) {
    return <div className="text-white">Loading progress...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-5 h-5 text-blue-500" />
            <h3 className="text-neutral-400 text-sm">Total Sessions</h3>
          </div>
          <div className="text-3xl font-bold text-white">{totalSessions}</div>
        </div>
        
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h3 className="text-neutral-400 text-sm">Avg Accuracy</h3>
          </div>
          <div className="text-3xl font-bold text-white">{avgAccuracy}%</div>
        </div>
        
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-purple-500" />
            <h3 className="text-neutral-400 text-sm">Week Streak</h3>
          </div>
          <div className="text-3xl font-bold text-white">{weekStreak}</div>
        </div>
        
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-5 h-5 text-orange-500" />
            <h3 className="text-neutral-400 text-sm">Weak Areas</h3>
          </div>
          <div className="text-3xl font-bold text-white">
            {skillBreakdown.filter(s => s.accuracy < 60).length}
          </div>
        </div>
      </div>

      {/* Progress Over Time */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-6">Progress Over Time</h3>
        {progressByWeek.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={progressByWeek}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="week" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
              <Legend />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#3b82f6"
                name="Accuracy %"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="sessions"
                stroke="#10b981"
                name="Sessions"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-neutral-500 text-center py-12">
            No progress data yet. Start a practice session to see your progress.
          </div>
        )}
      </div>

      {/* Skill Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Skill Accuracy</h3>
          {skillBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={skillBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                <Bar dataKey="accuracy" fill="#8b5cf6" name="Accuracy %" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-neutral-500 text-center py-12">
              No skill data available yet.
            </div>
          )}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Areas of Focus</h3>
          <div className="space-y-3">
            {skillBreakdown.length > 0 ? (
              skillBreakdown
                .sort((a, b) => a.accuracy - b.accuracy)
                .slice(0, 5)
                .map((skill, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-300">{skill.name}</span>
                      <span className={skill.accuracy < 60 ? 'text-red-500' : 'text-white'}>
                        {skill.accuracy}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          skill.accuracy < 60 ? 'bg-red-500' : skill.accuracy < 80 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${skill.accuracy}%` }}
                      />
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">{skill.attempts} attempts</div>
                  </div>
                ))
            ) : (
              <div className="text-neutral-500 text-center py-8">
                Complete practice sessions to see your weak areas.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-6">Recent Sessions</h3>
        {sessions.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sessions.slice(0, 10).map((session, idx) => (
              <div key={idx} className="bg-neutral-800 rounded p-4 flex justify-between items-center">
                <div>
                  <div className="text-white font-medium">
                    {session.subject_id} - {session.unit_id}
                  </div>
                  <div className="text-sm text-neutral-400">
                    {session.question_count} questions · {session.completed_at 
                      ? new Date(session.completed_at).toLocaleDateString()
                      : 'In progress'}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${
                    (session.score || 0) >= 80 ? 'text-green-500' : (session.score || 0) >= 60 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {Math.round(session.score || 0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-neutral-500 text-center py-8">
            No sessions yet. Start practicing to see your history.
          </div>
        )}
      </div>
    </div>
  );
}