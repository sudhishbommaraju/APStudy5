import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Trophy, Loader2 } from 'lucide-react';

export default function ExamLeaderboard({ examType, currentUser }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, [examType]);

  const loadLeaderboard = async () => {
    try {
      // Fetch sessions for specific exam and sort by score
      const sessions = await base44.entities.EnginePracticeSession.filter({
        exam_id: examType
      }, '-score', 1000);

      // Group by user and get top performers
      const userScores = {};
      sessions.forEach(session => {
        if (session.user_email && session.score && session.completed_at) {
          if (!userScores[session.user_email]) {
            userScores[session.user_email] = [];
          }
          userScores[session.user_email].push(session.score);
        }
      });

      // Calculate average score per user
      const rankings = Object.entries(userScores)
        .map(([email, scores]) => ({
          email,
          avgScore: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
          totalSessions: scores.length,
          highScore: Math.max(...scores)
        }))
        .sort((a, b) => parseFloat(b.avgScore) - parseFloat(a.avgScore))
        .slice(0, 10);

      setLeaderboard(rankings);

      if (currentUser) {
        const rank = rankings.findIndex(r => r.email === currentUser.email) + 1;
        if (rank > 0) {
          setUserRank(rank);
        }
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (position) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return position;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-900 border border-neutral-800 rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <h3 className="font-semibold text-white">{examType} Leaderboard</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
        </div>
      ) : leaderboard.length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {leaderboard.map((user, idx) => (
            <motion.div
              key={user.email}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                currentUser?.email === user.email
                  ? 'bg-blue-500/20 border border-blue-500/50'
                  : 'hover:bg-neutral-800'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-lg font-bold text-yellow-500 w-6">
                  {getMedalIcon(idx + 1)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-200 truncate">
                    {user.email.split('@')[0]}
                  </p>
                  <p className="text-xs text-neutral-500">{user.totalSessions} sessions</p>
                </div>
              </div>
              <p className="font-semibold text-blue-400 text-sm">{user.avgScore}</p>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-neutral-400 text-sm py-4 text-center">No data yet</p>
      )}

      {userRank && userRank > 10 && currentUser && (
        <div className="mt-3 pt-3 border-t border-neutral-800">
          <div className="flex items-center justify-between p-2 bg-blue-500/10 rounded-lg">
            <p className="text-xs font-semibold text-blue-300">Your Rank: #{userRank}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}