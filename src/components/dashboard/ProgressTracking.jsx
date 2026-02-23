import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Zap } from 'lucide-react';

export default function ProgressTracking() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const user = await base44.auth.me();
      const sessionsData = await base44.entities.EnginePracticeSession.filter(
        { user_email: user.email },
        '-completed_at',
        10
      );
      setSessions(sessionsData);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const progressData = sessions
    .filter(s => s.completed_at)
    .reverse()
    .map((s, i) => ({
      session: `Session ${i + 1}`,
      accuracy: Math.round(s.score || 0),
      questions: s.question_count
    }));

  const avgAccuracy = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length)
    : 0;

  if (loading) return null;

  if (sessions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center"
      >
        <Zap className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
        <h3 className="text-white font-medium mb-2">No sessions yet</h3>
        <p className="text-neutral-400 text-sm">Start a practice session to see your progress.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="space-y-6"
    >
      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-neutral-400">Avg Accuracy</span>
          </div>
          <div className="text-2xl font-bold text-white">{avgAccuracy}%</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-neutral-400">Sessions</span>
          </div>
          <div className="text-2xl font-bold text-white">{sessions.length}</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-green-400" />
            <span className="text-xs text-neutral-400">Total Q's</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {sessions.reduce((sum, s) => sum + (s.question_count || 0), 0)}
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      {progressData.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-white font-medium mb-4">Accuracy Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="session" stroke="#999" style={{ fontSize: '12px' }} />
              <YAxis stroke="#999" domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}