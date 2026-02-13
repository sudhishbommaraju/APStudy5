import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trophy, Target, Zap, Clock, Award, Star, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

const CHALLENGE_ICONS = {
  accuracy_goal: Target,
  questions_count: Zap,
  streak_goal: Star,
  subject_mastery: Award,
  time_challenge: Clock,
  perfect_session: Trophy,
};

const CHALLENGE_COLORS = {
  accuracy_goal: 'from-blue-500/20 to-indigo-500/20 border-blue-500/40',
  questions_count: 'from-amber-500/20 to-orange-500/20 border-amber-500/40',
  streak_goal: 'from-purple-500/20 to-pink-500/20 border-purple-500/40',
  subject_mastery: 'from-emerald-500/20 to-green-500/20 border-emerald-500/40',
  time_challenge: 'from-cyan-500/20 to-teal-500/20 border-cyan-500/40',
  perfect_session: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/40',
};

export default function WeeklyChallenges({ userEmail }) {
  const queryClient = useQueryClient();
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

  const { data: challenges = [] } = useQuery({
    queryKey: ['weeklyChallenges'],
    queryFn: async () => {
      const all = await base44.entities.WeeklyChallenge.filter({ is_active: true });
      const now = new Date();
      return all.filter(c => 
        isWithinInterval(now, { 
          start: parseISO(c.week_start_date), 
          end: parseISO(c.week_end_date) 
        })
      );
    },
  });

  const { data: userStats } = useQuery({
    queryKey: ['userStats', userEmail],
    queryFn: async () => {
      const stats = await base44.entities.UserStats.filter({ created_by: userEmail });
      return stats[0];
    },
    enabled: !!userEmail,
  });

  const completeMutation = useMutation({
    mutationFn: async ({ challengeId, progress }) => {
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) return;

      const participants = challenge.participants || [];
      const userParticipant = participants.find(p => p.email === userEmail);

      if (userParticipant && userParticipant.completed) {
        return; // Already completed
      }

      const updatedParticipants = participants.filter(p => p.email !== userEmail);
      updatedParticipants.push({
        email: userEmail,
        progress,
        completed: true,
        points_earned: challenge.bonus_points,
        completed_at: new Date().toISOString(),
      });

      await base44.entities.WeeklyChallenge.update(challengeId, {
        participants: updatedParticipants,
      });

      // Award bonus points to user
      if (userStats) {
        await base44.entities.UserStats.update(userStats.id, {
          total_points: userStats.total_points + challenge.bonus_points,
        });
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF6347'],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklyChallenges'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
    },
  });

  const getChallengeProgress = (challenge) => {
    if (!userStats) return 0;

    const participant = (challenge.participants || []).find(p => p.email === userEmail);
    if (participant) return participant.progress;

    switch (challenge.challenge_type) {
      case 'accuracy_goal':
        const accuracy = userStats.total_questions_answered > 0 
          ? (userStats.total_correct / userStats.total_questions_answered) * 100 
          : 0;
        return Math.round(accuracy);
      case 'questions_count':
        return userStats.total_questions_answered || 0;
      case 'streak_goal':
        return userStats.current_streak || 0;
      default:
        return 0;
    }
  };

  const isCompleted = (challenge) => {
    const participant = (challenge.participants || []).find(p => p.email === userEmail);
    return participant?.completed || false;
  };

  const checkAndComplete = async (challenge) => {
    const progress = getChallengeProgress(challenge);
    if (progress >= challenge.target_value && !isCompleted(challenge)) {
      await completeMutation.mutateAsync({ challengeId: challenge.id, progress });
    }
  };

  useEffect(() => {
    if (challenges.length > 0 && userStats) {
      challenges.forEach(checkAndComplete);
    }
  }, [challenges, userStats]);

  if (challenges.length === 0) {
    return (
      <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-6 text-center">
        <Trophy className="w-12 h-12 mx-auto mb-3 text-[#8A8A8A]" />
        <p className="text-[#B5B5B5]">No active challenges this week. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {challenges.map((challenge) => {
        const Icon = CHALLENGE_ICONS[challenge.challenge_type] || Trophy;
        const progress = getChallengeProgress(challenge);
        const completed = isCompleted(challenge);
        const progressPercent = Math.min((progress / challenge.target_value) * 100, 100);

        return (
          <div
            key={challenge.id}
            className={cn(
              "rounded-xl border p-6 transition-all bg-gradient-to-r",
              CHALLENGE_COLORS[challenge.challenge_type],
              completed && "opacity-75"
            )}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-[#171717] rounded-lg">
                <Icon className="w-6 h-6 text-[#D6B98C]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-[#F5F5F5]">{challenge.title}</h3>
                  {completed && (
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full">
                      ✓ Completed
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#B5B5B5] mb-2">{challenge.description}</p>
                <div className="flex items-center gap-4 text-xs text-[#8A8A8A]">
                  <span>🏆 {challenge.bonus_points} points</span>
                  <span>📅 Ends {format(parseISO(challenge.week_end_date), 'MMM d')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#B5B5B5]">Progress</span>
                <span className="font-semibold text-[#F5F5F5]">
                  {progress} / {challenge.target_value}
                </span>
              </div>
              <div className="h-2 bg-[#171717] rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    completed ? "bg-emerald-500" : "bg-[#D6B98C]"
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}