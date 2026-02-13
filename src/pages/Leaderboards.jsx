import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Medal, Crown, TrendingUp, Target, Zap, Award, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import Leaderboard from '@/components/gamification/Leaderboard';
import WeeklyChallenges from '@/components/gamification/WeeklyChallenges';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LeaderboardsPage() {
  const [user, setUser] = useState(null);
  const [sortBy, setSortBy] = useState('points'); // points, accuracy, streaks, sessions

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
    queryFn: () => base44.entities.UserStats.list(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: attempts = [] } = useQuery({
    queryKey: ['allAttempts'],
    queryFn: () => base44.entities.Attempt.list(),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['allSessions'],
    queryFn: () => base44.entities.Session.list(),
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#2A2A2A] border-t-[#D6B98C] rounded-full" />
      </div>
    );
  }

  // Calculate accuracy leaderboard
  const accuracyLeaderboard = allStats
    .map(stat => {
      const userAttempts = attempts.filter(a => a.created_by === stat.created_by);
      const accuracy = userAttempts.length > 0
        ? (userAttempts.filter(a => a.is_correct).length / userAttempts.length) * 100
        : 0;
      return {
        ...stat,
        accuracy: accuracy.toFixed(1),
        totalQuestions: userAttempts.length,
      };
    })
    .filter(s => s.totalQuestions >= 10) // Min 10 questions
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 10);

  // Streak leaderboard
  const streakLeaderboard = [...allStats]
    .sort((a, b) => b.current_streak - a.current_streak)
    .slice(0, 10);

  // Session completion leaderboard
  const sessionLeaderboard = allStats
    .map(stat => {
      const userSessions = sessions.filter(s => s.created_by === stat.created_by && s.status === 'completed');
      return {
        ...stat,
        sessionCount: userSessions.length,
      };
    })
    .filter(s => s.sessionCount > 0)
    .sort((a, b) => b.sessionCount - a.sessionCount)
    .slice(0, 10);

  const renderLeaderboardItem = (stat, index, type) => {
    const rank = index + 1;
    const userInfo = allUsers.find(u => u.email === stat.created_by);
    const isCurrentUser = user?.email === stat.created_by;

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
      return 'from-[#1E1E1E] to-[#171717] border-[#2A2A2A]';
    };

    let metric, metricLabel;
    if (type === 'accuracy') {
      metric = `${stat.accuracy}%`;
      metricLabel = `${stat.totalQuestions} questions`;
    } else if (type === 'streak') {
      metric = stat.current_streak;
      metricLabel = 'current streak';
    } else if (type === 'sessions') {
      metric = stat.sessionCount;
      metricLabel = 'sessions';
    } else {
      metric = stat.total_points;
      metricLabel = 'points';
    }

    return (
      <div
        key={stat.id}
        className={cn(
          "relative rounded-xl p-4 border transition-all bg-gradient-to-r",
          getRankColor(rank),
          isCurrentUser && "ring-2 ring-[#D6B98C]"
        )}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 min-w-[60px]">
            <span className="text-2xl font-bold text-[#F5F5F5]">#{rank}</span>
            {getRankIcon(rank)}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#F5F5F5] truncate">
              {userInfo?.full_name || 'Anonymous User'}
              {isCurrentUser && <span className="ml-2 text-xs text-[#D6B98C]">(You)</span>}
            </p>
            <p className="text-sm text-[#8A8A8A]">Level {stat.level}</p>
          </div>

          <div className="text-right">
            <p className="text-lg font-bold text-[#D6B98C]">{metric}</p>
            <p className="text-xs text-[#8A8A8A]">{metricLabel}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Leaderboards & Challenges</h1>
        <p className="page-description">Compete with others and complete weekly challenges</p>
      </div>

      <Tabs defaultValue="overall" className="space-y-6">
        <TabsList className="bg-[#1E1E1E] border border-[#2A2A2A]">
          <TabsTrigger value="overall">
            <Trophy className="w-4 h-4 mr-2" />
            Overall Points
          </TabsTrigger>
          <TabsTrigger value="accuracy">
            <Target className="w-4 h-4 mr-2" />
            Accuracy
          </TabsTrigger>
          <TabsTrigger value="streaks">
            <Zap className="w-4 h-4 mr-2" />
            Streaks
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <Award className="w-4 h-4 mr-2" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="challenges">
            <TrendingUp className="w-4 h-4 mr-2" />
            Challenges
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overall" className="space-y-4">
          <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-6">
            <h2 className="text-xl font-bold text-[#F5F5F5] mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#D6B98C]" />
              Top Players by Points
            </h2>
            <Leaderboard />
          </div>
        </TabsContent>

        <TabsContent value="accuracy" className="space-y-4">
          <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-6">
            <h2 className="text-xl font-bold text-[#F5F5F5] mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#D6B98C]" />
              Top Players by Accuracy
            </h2>
            <p className="text-sm text-[#8A8A8A] mb-4">Minimum 10 questions answered</p>
            <div className="space-y-3">
              {accuracyLeaderboard.map((stat, index) => 
                renderLeaderboardItem(stat, index, 'accuracy')
              )}
              {accuracyLeaderboard.length === 0 && (
                <p className="text-center text-[#8A8A8A] py-8">No data yet</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="streaks" className="space-y-4">
          <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-6">
            <h2 className="text-xl font-bold text-[#F5F5F5] mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-400" />
              Longest Current Streaks
            </h2>
            <div className="space-y-3">
              {streakLeaderboard.map((stat, index) => 
                renderLeaderboardItem(stat, index, 'streak')
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-6">
            <h2 className="text-xl font-bold text-[#F5F5F5] mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#D6B98C]" />
              Most Practice Sessions
            </h2>
            <div className="space-y-3">
              {sessionLeaderboard.map((stat, index) => 
                renderLeaderboardItem(stat, index, 'sessions')
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-6">
            <h2 className="text-xl font-bold text-[#F5F5F5] mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#D6B98C]" />
              Weekly Challenges
            </h2>
            <p className="text-sm text-[#8A8A8A] mb-6">
              Complete challenges to earn bonus points and climb the leaderboard!
            </p>
            <WeeklyChallenges userEmail={user?.email} />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}