import React from 'react';
import { cn } from '@/lib/utils';

export default function StatsCard({ title, value, subtitle, icon: Icon, trend, className }) {
  return (
    <div className={cn(
      "bg-white rounded-xl border border-slate-200 p-5 shadow-sm",
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-xs font-medium",
              trend > 0 ? "text-emerald-600" : trend < 0 ? "text-rose-600" : "text-slate-500"
            )}>
              {trend > 0 ? '↑' : trend < 0 ? '↓' : '–'}
              <span>{Math.abs(trend)}% from last week</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-lg bg-slate-100">
            <Icon className="w-5 h-5 text-slate-600" />
          </div>
        )}
      </div>
    </div>
  );
}