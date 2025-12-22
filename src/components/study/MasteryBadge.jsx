import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, TrendingUp, Target, Circle } from 'lucide-react';

const MASTERY_CONFIG = {
  not_started: {
    label: 'Not Started',
    color: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: Circle,
  },
  developing: {
    label: 'Developing',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: TrendingUp,
  },
  proficient: {
    label: 'Proficient',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Target,
  },
  mastered: {
    label: 'Mastered',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
};

export default function MasteryBadge({ level, size = 'default', showIcon = true }) {
  const config = MASTERY_CONFIG[level] || MASTERY_CONFIG.not_started;
  const Icon = config.icon;
  
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.color,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />}
      {config.label}
    </div>
  );
}