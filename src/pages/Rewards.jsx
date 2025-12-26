import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Trophy, Star, Zap, Gift, CheckCircle, Lock } from 'lucide-react';
import { getUserStats, getAllBadges, getBadgeInfo } from '@/components/gamification/GamificationHelper';
import confetti from 'canvas-confetti';

const REWARDS = [
  { id: 'daily_5', name: '5 Extra Practice Sessions', cost: 100, type: 'daily_practice_count', amount: 5, icon: '📚' },
  { id: 'daily_3', name: '3 Extra Exam Sessions', cost: 150, type: 'daily_exam_count', amount: 3, icon: '⏱️' },
  { id: 'daily_10', name: '10 Extra Practice Sessions', cost: 180, type: 'daily_practice_count', amount: 10, icon: '🎯' },
  { id: 'daily_5_exam', name: '5 Extra Exam Sessions', cost: 250, type: 'daily_exam_count', amount: 5, icon: '🏆' },
];

export default function Rewards() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [redeeming, setRedeeming] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        const userStats = await getUserStats(currentUser.email);
        setStats(userStats);
      } catch (e) {
        console.error('Failed to load data:', e);
      }
    };
    loadData();
  }, []);

  const allBadges = getAllBadges();
  const earnedBadgeIds = stats?.badges_earned || [];

  const handleRedeem = async (reward) => {
    if (!user || !stats) return;
    
    if (stats.total_points < reward.cost) {
      alert(`Not enough points! You need ${reward.cost} points.`);
      return;
    }

    setRedeeming(reward.id);
    
    try {
      // Deduct points
      await base44.entities.UserStats.update(stats.id, {
        total_points: stats.total_points - reward.cost,
      });

      // Add credits to user
      const currentCount = user[reward.type] || 0;
      await base44.auth.updateMe({
        [reward.type]: currentCount + reward.amount,
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8B5CF6', '#6366F1', '#EC4899']
      });

      // Refresh data
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
      const updatedStats = await getUserStats(updatedUser.email);
      setStats(updatedStats);

      alert(`Redeemed! ${reward.name} added to your account.`);
    } catch (e) {
      console.error('Failed to redeem:', e);
      alert('Failed to redeem reward. Please try again.');
    }
    
    setRedeeming(null);
  };

  if (!user || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-slate-700 border-t-violet-500 rounded-full" />
      </div>
    );
  }

  const pointsToNextLevel = ((stats.level) * 100) - stats.total_points;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Rewards & Achievements</h1>
        <p className="page-description">Earn points, unlock badges, and claim rewards</p>
      </div>

      {/* User Level Card */}
      <div className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl border border-violet-500/30 p-8 mb-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-100">Level {stats.level}</h2>
            <p className="text-slate-400 mt-1">{stats.total_points} total points</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-slate-400">
            <span>Progress to Level {stats.level + 1}</span>
            <span>{pointsToNextLevel} points needed</span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-600 to-purple-600 transition-all duration-300"
              style={{ width: `${((stats.total_points % 100) / 100) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-slate-800/60 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-violet-400">{stats.current_streak}</p>
            <p className="text-xs text-slate-400 mt-1">Current Streak</p>
          </div>
          <div className="bg-slate-800/60 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-violet-400">{stats.longest_streak}</p>
            <p className="text-xs text-slate-400 mt-1">Best Streak</p>
          </div>
          <div className="bg-slate-800/60 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-violet-400">{stats.badges_earned.length}</p>
            <p className="text-xs text-slate-400 mt-1">Badges Earned</p>
          </div>
        </div>
      </div>

      {/* Rewards Shop */}
      <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Gift className="w-6 h-6 text-violet-400" />
          <h3 className="text-xl font-bold text-slate-100">Rewards Shop</h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          {REWARDS.map((reward) => {
            const canAfford = stats.total_points >= reward.cost;
            return (
              <div 
                key={reward.id} 
                className={`bg-slate-900/50 rounded-lg border p-5 transition-all ${
                  canAfford 
                    ? 'border-violet-500/30 hover:border-violet-500/50' 
                    : 'border-slate-700/30 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{reward.icon}</span>
                    <div>
                      <h4 className="font-semibold text-slate-100">{reward.name}</h4>
                      <p className="text-sm text-slate-400 mt-1">
                        {reward.amount} extra {reward.type.includes('practice') ? 'practice' : 'exam'} sessions
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <span className="text-lg font-bold text-violet-400">{reward.cost} points</span>
                  <Button
                    onClick={() => handleRedeem(reward)}
                    disabled={!canAfford || redeeming === reward.id}
                    size="sm"
                    className={canAfford ? 'bg-violet-600 hover:bg-violet-700' : ''}
                  >
                    {redeeming === reward.id ? 'Redeeming...' : canAfford ? 'Redeem' : <Lock className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges */}
      <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Star className="w-6 h-6 text-amber-400" />
          <h3 className="text-xl font-bold text-slate-100">Badges</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allBadges.map((badge) => {
            const isEarned = earnedBadgeIds.includes(badge.id);
            return (
              <div 
                key={badge.id}
                className={`relative rounded-lg p-4 text-center transition-all ${
                  isEarned 
                    ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-amber-500/50' 
                    : 'bg-slate-900/50 border border-slate-700/30 opacity-50'
                }`}
              >
                {isEarned && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                )}
                <div className="text-4xl mb-2">{badge.icon}</div>
                <p className="font-semibold text-slate-100 text-sm">{badge.name}</p>
                <p className="text-xs text-slate-400 mt-1">{badge.description}</p>
                {!isEarned && (
                  <p className="text-xs text-violet-400 mt-2 font-semibold">+{badge.points} pts</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}