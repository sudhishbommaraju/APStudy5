import React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SkillSelector({ skills, selectedSkill, onSelect, examType }) {
  // Group skills by subject
  const groupedSkills = skills
    .filter(s => s.exam_type === examType)
    .reduce((acc, skill) => {
      if (!acc[skill.subject]) {
        acc[skill.subject] = [];
      }
      acc[skill.subject].push(skill);
      return acc;
    }, {});

  return (
    <div className="space-y-4">
      {Object.entries(groupedSkills).map(([subject, subjectSkills]) => (
        <div key={subject} className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-1">
            {subject}
          </h4>
          <div className="space-y-1">
            {subjectSkills.sort((a, b) => a.order - b.order).map(skill => (
              <button
                key={skill.id}
                onClick={() => onSelect(skill)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all duration-150",
                  selectedSkill?.id === skill.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
                )}
              >
                <span className="text-sm font-medium">{skill.skill_name}</span>
                {selectedSkill?.id === skill.id ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}