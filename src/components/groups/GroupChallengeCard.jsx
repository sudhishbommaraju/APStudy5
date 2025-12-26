import React from 'react';
import { Trophy, Target, Clock, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { format, differenceInDays } from 'date-fns';

export default function GroupChallengeCard({ challenge }) {
  const daysLeft = differenceInDays(new Date(challenge.end_date), new Date());
  const progressPercent = (challenge.current_progress / challenge.target_value) * 100;

  const challengeIcons = {
    questions_goal: Target,
    study_hours: Clock,
    accuracy_race: Trophy,
    module_completion: Users,
  };

  const Icon = challengeIcons[challenge.challenge_type] || Trophy;

  return (
    <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl border border-violet-500/30 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-violet-500/20 rounded-lg">
            <Icon className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-100">{challenge.title}</h4>
            <p className="text-xs text-slate-400">{challenge.description}</p>
          </div>
        </div>
        <span className="px-2 py-1 bg-violet-500/20 rounded text-xs text-violet-300">
          {daysLeft}d left
        </span>
      </div>
      <Progress value={progressPercent} className="mb-2" />
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{challenge.current_progress} / {challenge.target_value}</span>
        <span className="text-amber-400">🏆 +{challenge.reward_points} pts</span>
      </div>
    </div>
  );
}