import React from 'react';
import { Button } from '@/components/ui/button';
import { Brain, Calculator, Eye, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const ERROR_TYPES = [
  { id: 'conceptual', label: 'Conceptual', icon: Brain, description: 'Misunderstood the concept' },
  { id: 'computation', label: 'Computation', icon: Calculator, description: 'Calculation error' },
  { id: 'misread', label: 'Misread', icon: Eye, description: 'Misread the question' },
  { id: 'time_pressure', label: 'Time Pressure', icon: Clock, description: 'Ran out of time' },
];

export default function ErrorTypeSelector({ onSelect }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-700">What went wrong?</p>
      <div className="grid grid-cols-2 gap-2">
        {ERROR_TYPES.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => onSelect(type.id)}
              className="flex items-start gap-2 p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
            >
              <Icon className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-900">{type.label}</p>
                <p className="text-xs text-slate-500">{type.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}