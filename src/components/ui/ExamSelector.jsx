import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const EXAMS = [
  // AP Mathematics
  { 
    id: 'ap_calculus_ab', 
    name: 'AP Calculus AB', 
    description: 'Calculus AB exam prep',
    icon: '∫'
  },
  { 
    id: 'ap_calculus_bc', 
    name: 'AP Calculus BC', 
    description: 'Calculus BC exam prep',
    icon: '∂'
  },
  { 
    id: 'ap_statistics', 
    name: 'AP Statistics', 
    description: 'Statistics & probability',
    icon: 'σ'
  },
  
  // AP Sciences
  { 
    id: 'ap_physics_1', 
    name: 'AP Physics 1', 
    description: 'Algebra-based physics',
    icon: 'F'
  },
  { 
    id: 'ap_physics_2', 
    name: 'AP Physics 2', 
    description: 'Algebra-based physics',
    icon: 'E'
  },
  { 
    id: 'ap_physics_c_mech', 
    name: 'AP Physics C: Mechanics', 
    description: 'Calculus-based mechanics',
    icon: 'v'
  },
  { 
    id: 'ap_physics_c_em', 
    name: 'AP Physics C: E&M', 
    description: 'Electricity & magnetism',
    icon: 'B'
  },
  { 
    id: 'ap_biology', 
    name: 'AP Biology', 
    description: 'Life sciences & ecology',
    icon: '🧬'
  },
  { 
    id: 'ap_chemistry', 
    name: 'AP Chemistry', 
    description: 'Chemical reactions & bonding',
    icon: '⚗️'
  },
  { 
    id: 'ap_environmental_science', 
    name: 'AP Environmental Science', 
    description: 'Ecosystems & sustainability',
    icon: '🌍'
  },
  
  // AP History
  { 
    id: 'ap_us_history', 
    name: 'AP US History', 
    description: 'American history & politics',
    icon: '🗽'
  },
  { 
    id: 'ap_world_history', 
    name: 'AP World History', 
    description: 'Global historical patterns',
    icon: '🌐'
  },
  { 
    id: 'ap_european_history', 
    name: 'AP European History', 
    description: 'European civilization',
    icon: '🏛️'
  },
  
  // Standardized Tests
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