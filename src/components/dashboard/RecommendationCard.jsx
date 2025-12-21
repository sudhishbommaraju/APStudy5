import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function RecommendationCard({ recommendations, examType }) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-2">Study Recommendations</h3>
        <p className="text-sm text-slate-500">
          Complete more questions to get personalized study recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-600" />
          Focus Areas
        </h3>
      </div>
      <div className="divide-y divide-slate-100">
        {recommendations.slice(0, 3).map((rec, index) => (
          <div key={rec.skill_name} className="px-5 py-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {rec.priority === 'high' && (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span className="font-medium text-slate-900 text-sm">
                    {rec.skill_name}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {rec.accuracy.toFixed(0)}% accuracy · {rec.attempts} attempts
                </p>
              </div>
              <div className={cn(
                "px-2 py-1 rounded text-xs font-medium",
                rec.difficulty === 'easy' && "bg-emerald-100 text-emerald-700",
                rec.difficulty === 'medium' && "bg-amber-100 text-amber-700",
                rec.difficulty === 'hard' && "bg-rose-100 text-rose-700"
              )}>
                Try {rec.difficulty}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
        <Link to={createPageUrl('Practice') + `?exam=${examType}`}>
          <Button variant="outline" className="w-full" size="sm">
            Start Practicing
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}