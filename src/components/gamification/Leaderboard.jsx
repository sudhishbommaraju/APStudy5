import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Trophy, Loader2, Medal } from 'lucide-react';

export default function Leaderboard({ currentUser }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      // Fetch all users and sort by points
      const users = await base44.entities.User.list('-total_points', 10);
      setLeaderboard(users || []);

      if (currentUser) {
        const rank = users?.findIndex(u => u.id === currentUser.id) + 1 || 0;
        setUserRank(rank);
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

  const isCurrentUser = (userId) => currentUser?.id === userId;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 max-h-96 overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <h3 className="font-semibold text-white">Leaderboard</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
        </div>
      ) : leaderboard.length > 0 ? (
        <div className="space-y-2">
          {leaderboard.map((user, idx) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                isCurrentUser(user.id)
                  ? 'bg-blue-500/20 border border-blue-500/50'
                  : 'hover:bg-neutral-800'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="text-lg font-bold text-yellow-500 w-6">
                  {getMedalIcon(idx + 1)}
                </span>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isCurrentUser(user.id) ? 'text-blue-300' : 'text-neutral-200'}`}>
                    {user.full_name || user.email}
                  </p>
                  {isCurrentUser(user.id) && (
                    <p className="text-xs text-blue-400">You</p>
                  )}
                </div>
              </div>
              <p className="font-semibold text-blue-400">{user.total_points || 0}</p>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-neutral-400 text-sm py-4 text-center">No users yet</p>
      )}

      {userRank && userRank > 10 && currentUser && (
        <div className="mt-4 pt-4 border-t border-neutral-800">
          <div className="flex items-center justify-between p-2 bg-blue-500/10 rounded-lg">
            <div>
              <p className="text-xs text-neutral-400">Your Rank</p>
              <p className="text-sm font-semibold text-blue-300">#${userRank}</p>
            </div>
            <p className="font-semibold text-blue-400">{currentUser.total_points || 0}</p>
          </div>
        </div>
      )}
    </div>
  );
}