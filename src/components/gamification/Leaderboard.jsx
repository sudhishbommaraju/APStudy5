import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Leaderboard({ timeRange = 'all' }) {
  const [user, setUser] = useState(null);

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

  const { data: allStats = [] } = useQuery({
    queryKey: ['allUserStats'],
    queryFn: () => base44.entities.UserStats.list('-total_points'),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  // Get top 10
  const topStats = allStats.slice(0, 10);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return null;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'from-amber-500/20 to-yellow-500/20 border-amber-500/50';
    if (rank === 2) return 'from-slate-400/20 to-slate-500/20 border-slate-400/50';
    if (rank === 3) return 'from-amber-600/20 to-orange-600/20 border-amber-600/50';
    return 'from-slate-800/40 to-slate-900/40 border-slate-700/30';
  };

  return (
    <div className="space-y-3">
      {topStats.map((stat, index) => {
        const rank = index + 1;
        const userInfo = allUsers.find(u => u.email === stat.created_by);
        const isCurrentUser = user?.email === stat.created_by;

        return (
          <div
            key={stat.id}
            className={cn(
              "relative rounded-xl p-4 border transition-all",
              "bg-gradient-to-r",
              getRankColor(rank),
              isCurrentUser && "ring-2 ring-violet-500"
            )}
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 min-w-[60px]">
                <span className="text-2xl font-bold text-slate-100">#{rank}</span>
                {getRankIcon(rank)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-100 truncate">
                  {userInfo?.full_name || 'Anonymous User'}
                  {isCurrentUser && <span className="ml-2 text-xs text-violet-400">(You)</span>}
                </p>
                <p className="text-sm text-slate-400">Level {stat.level}</p>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-violet-400">{stat.total_points}</p>
                <p className="text-xs text-slate-400">points</p>
              </div>
            </div>

            {stat.current_streak > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-700/30 flex items-center gap-2 text-xs text-slate-400">
                <span className="text-orange-400">🔥</span>
                {stat.current_streak} streak
              </div>
            )}
          </div>
        );
      })}

      {topStats.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No rankings yet. Start practicing to climb the leaderboard!</p>
        </div>
      )}
    </div>
  );
}