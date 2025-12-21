import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SubjectChangeDialog({ open, onOpenChange, currentSubject, onSubjectChange }) {
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list('subject_id'),
  });

  // Group subjects by category
  const subjectsByCategory = subjects.reduce((acc, subject) => {
    if (!acc[subject.category]) acc[subject.category] = [];
    acc[subject.category].push(subject);
    return acc;
  }, {});

  const handleSubjectSelect = (subjectId) => {
    onSubjectChange(subjectId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change Subject</DialogTitle>
          <DialogDescription>
            Select a different subject. This will reset your unit and skill selections.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {Object.entries(subjectsByCategory).map(([category, categorySubjects]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 px-1">
                {category}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {categorySubjects.map((subject) => (
                  <button
                    key={subject.subject_id}
                    onClick={() => handleSubjectSelect(subject.subject_id)}
                    className={cn(
                      "relative flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all duration-150",
                      currentSubject === subject.subject_id
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    {currentSubject === subject.subject_id && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {subject.icon && <span className="text-xl">{subject.icon}</span>}
                    <span className="text-sm font-medium text-slate-900">{subject.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}