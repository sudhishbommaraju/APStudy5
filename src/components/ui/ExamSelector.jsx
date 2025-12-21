import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const EXAMS = [
  { 
    id: 'ap_calculus', 
    name: 'AP Calculus', 
    description: 'AB/BC exam preparation',
    icon: '∫'
  },
  { 
    id: 'sat_math', 
    name: 'SAT Math', 
    description: 'Digital SAT mathematics',
    icon: 'Σ'
  },
  { 
    id: 'act_math', 
    name: 'ACT Math', 
    description: 'ACT mathematics section',
    icon: 'π'
  },
  { 
    id: 'psat_math', 
    name: 'PSAT Math', 
    description: 'PSAT/NMSQT prep',
    icon: '√'
  },
];

export default function ExamSelector({ selected, onSelect, multiple = false }) {
  const handleClick = (examId) => {
    if (multiple) {
      if (selected.includes(examId)) {
        onSelect(selected.filter(e => e !== examId));
      } else {
        onSelect([...selected, examId]);
      }
    } else {
      onSelect(examId);
    }
  };

  const isSelected = (examId) => {
    return multiple ? selected.includes(examId) : selected === examId;
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {EXAMS.map(exam => (
        <button
          key={exam.id}
          onClick={() => handleClick(exam.id)}
          className={cn(
            "relative flex flex-col items-center p-5 rounded-xl border-2 transition-all duration-150",
            isSelected(exam.id)
              ? "border-slate-900 bg-slate-50 shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300"
          )}
        >
          {isSelected(exam.id) && (
            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
          <span className="text-2xl mb-2 font-mono text-slate-600">{exam.icon}</span>
          <span className="font-semibold text-slate-900">{exam.name}</span>
          <span className="text-xs text-slate-500 mt-0.5">{exam.description}</span>
        </button>
      ))}
    </div>
  );
}