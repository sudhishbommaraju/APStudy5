import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SubjectUnitSelector({ 
  selectedSubject, 
  selectedUnit,
  selectedSkill,
  onSubjectChange, 
  onUnitChange,
  onSkillChange,
  className 
}) {
  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list('subject_id'),
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units', selectedSubject],
    queryFn: () => base44.entities.Unit.filter({ subject_id: selectedSubject }),
    enabled: !!selectedSubject,
  });

  const { data: skills = [] } = useQuery({
    queryKey: ['skills', selectedUnit],
    queryFn: () => base44.entities.Skill.filter({ unit_id: selectedUnit }),
    enabled: !!selectedUnit,
  });

  // Debug: Log subjects
  console.log('Subjects loaded:', subjects.length, subjects);

  // Group subjects by category
  const subjectsByCategory = subjects.reduce((acc, subject) => {
    if (!acc[subject.category]) acc[subject.category] = [];
    acc[subject.category].push(subject);
    return acc;
  }, {});

  console.log('Subjects by category:', subjectsByCategory);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Subject Selector */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Select Subject
        </label>
        <Select value={selectedSubject} onValueChange={onSubjectChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a subject" />
          </SelectTrigger>
          <SelectContent className="max-h-96">
            {subjectsLoading ? (
              <div className="px-2 py-4 text-sm text-slate-500 text-center">
                Loading subjects...
              </div>
            ) : subjects.length === 0 ? (
              <div className="px-2 py-4 text-sm text-slate-500 text-center">
                No subjects available. Please seed data first.
              </div>
            ) : (
              Object.keys(subjectsByCategory).sort().map((category) => {
                const categorySubjects = subjectsByCategory[category];
                return (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {category}
                    </div>
                    {categorySubjects.map((subject) => (
                      <SelectItem key={subject.subject_id} value={subject.subject_id}>
                        <div className="flex items-center gap-2">
                          {subject.icon && <span>{subject.icon}</span>}
                          <span>{subject.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                );
              })
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Unit Selector */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Select Unit
        </label>
        <Select 
          value={selectedUnit} 
          onValueChange={onUnitChange}
          disabled={!selectedSubject || units.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={selectedSubject ? "Choose a unit" : "Select subject first"} />
          </SelectTrigger>
          <SelectContent className="max-h-96">
            {units.sort((a, b) => a.unit_number - b.unit_number).map((unit) => (
              <SelectItem key={unit.id} value={unit.id}>
                Unit {unit.unit_number}: {unit.unit_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Skill Selector */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Select Skill
        </label>
        <Select 
          value={selectedSkill} 
          onValueChange={onSkillChange}
          disabled={!selectedUnit || skills.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={
              !selectedUnit ? "Select unit first" : 
              skills.length === 0 ? "Skills coming soon" : 
              "Choose a skill"
            } />
          </SelectTrigger>
          <SelectContent className="max-h-96">
            {skills.map((skill) => (
              <SelectItem key={skill.id} value={skill.id}>
                {skill.skill_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}