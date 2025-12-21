import React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const EXAM_NAMES = {
  ap_calculus_ab: 'AP Calculus AB',
  ap_calculus_bc: 'AP Calculus BC',
  ap_statistics: 'AP Statistics',
  ap_precalculus: 'AP Precalculus',
  ap_biology: 'AP Biology',
  ap_chemistry: 'AP Chemistry',
  ap_physics_1: 'AP Physics 1',
  ap_physics_2: 'AP Physics 2',
  ap_physics_c_mech: 'AP Physics C: Mech',
  ap_physics_c_em: 'AP Physics C: E&M',
  ap_environmental_science: 'AP Environmental Sci',
  ap_english_language: 'AP English Lang',
  ap_english_literature: 'AP English Lit',
  ap_us_history: 'AP US History',
  ap_world_history: 'AP World History',
  ap_european_history: 'AP European History',
  ap_us_government: 'AP US Government',
  ap_comparative_government: 'AP Comparative Gov',
  ap_human_geography: 'AP Human Geography',
  ap_psychology: 'AP Psychology',
  ap_macroeconomics: 'AP Macroeconomics',
  ap_microeconomics: 'AP Microeconomics',
  ap_spanish_language: 'AP Spanish Lang',
  ap_spanish_literature: 'AP Spanish Lit',
  ap_french_language: 'AP French',
  ap_german_language: 'AP German',
  ap_italian_language: 'AP Italian',
  ap_latin: 'AP Latin',
  ap_chinese_language: 'AP Chinese',
  ap_japanese_language: 'AP Japanese',
  ap_computer_science_a: 'AP CS A',
  ap_computer_science_principles: 'AP CS Principles',
  ap_art_2d: 'AP Art 2-D',
  ap_art_3d: 'AP Art 3-D',
  ap_art_drawing: 'AP Art Drawing',
  ap_music_theory: 'AP Music Theory',
  ap_art_history: 'AP Art History',
  ap_seminar: 'AP Seminar',
  ap_research: 'AP Research',
  ap_african_american_studies: 'AP African American Studies',
  sat_math: 'SAT Math',
  act_math: 'ACT Math',
  psat_math: 'PSAT Math',
};

export default function SubjectSwitcher({ selectedSubjects, currentSubject, onSwitch }) {
  if (!selectedSubjects || selectedSubjects.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <span className="text-sm font-medium text-slate-900">
            {EXAM_NAMES[currentSubject] || 'Select Subject'}
          </span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Your Subjects
          </p>
        </div>
        <DropdownMenuSeparator />
        {selectedSubjects.map((examId) => (
          <DropdownMenuItem
            key={examId}
            onClick={() => onSwitch(examId)}
            className={cn(
              "cursor-pointer",
              currentSubject === examId && "bg-slate-100"
            )}
          >
            <span className="flex-1">{EXAM_NAMES[examId]}</span>
            {currentSubject === examId && (
              <Check className="w-4 h-4 text-slate-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}