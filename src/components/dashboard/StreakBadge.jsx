import React from 'react';
import { Flame } from 'lucide-react';

export default function StreakBadge({ streak = 0 }) {
  if (streak === 0) return null;

  const isHotStreak = streak >= 7;
  const isBuildingStreak = streak >= 3;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm ${
      isHotStreak
        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
        : isBuildingStreak
        ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800'
        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
    }`}>
      <Flame className={`w-4 h-4 ${isHotStreak ? 'animate-bounce' : ''}`} />
      <span>{streak} day{streak !== 1 ? 's' : ''}</span>
    </div>
  );
}