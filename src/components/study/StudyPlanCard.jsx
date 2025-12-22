import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Target, ArrowRight } from 'lucide-react';
import MasteryBadge from './MasteryBadge';

export default function StudyPlanCard({ plan, onStart }) {
  return (
    <div className="bg-white rounded-xl border-2 border-slate-900 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Today's Study Plan</h3>
          <p className="text-sm text-slate-600">{plan.generated_reason}</p>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">{plan.estimated_minutes} min</span>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Focus Skills
          </p>
          <div className="space-y-2">
            {plan.focus_skills.map((skill, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-slate-900 text-sm">{skill.skill_name}</p>
                    <MasteryBadge level={skill.mastery_level} size="sm" showIcon={false} />
                  </div>
                  <p className="text-xs text-slate-600">{skill.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Button onClick={onStart} className="w-full h-12" size="lg">
        Start Practice
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}