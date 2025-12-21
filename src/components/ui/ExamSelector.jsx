import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const EXAMS = [
  // AP Mathematics
  { id: 'ap_calculus_ab', name: 'AP Calculus AB', icon: '∫', category: 'Math' },
  { id: 'ap_calculus_bc', name: 'AP Calculus BC', icon: '∂', category: 'Math' },
  { id: 'ap_statistics', name: 'AP Statistics', icon: 'σ', category: 'Math' },
  { id: 'ap_precalculus', name: 'AP Precalculus', icon: 'θ', category: 'Math' },
  
  // AP Sciences
  { id: 'ap_biology', name: 'AP Biology', icon: '🧬', category: 'Science' },
  { id: 'ap_chemistry', name: 'AP Chemistry', icon: '⚗️', category: 'Science' },
  { id: 'ap_physics_1', name: 'AP Physics 1: Algebra-Based', icon: 'F', category: 'Science' },
  { id: 'ap_physics_2', name: 'AP Physics 2: Algebra-Based', icon: 'E', category: 'Science' },
  { id: 'ap_physics_c_mech', name: 'AP Physics C: Mechanics', icon: 'v', category: 'Science' },
  { id: 'ap_physics_c_em', name: 'AP Physics C: E&M', icon: 'B', category: 'Science' },
  { id: 'ap_environmental_science', name: 'AP Environmental Science', icon: '🌍', category: 'Science' },
  
  // AP English
  { id: 'ap_english_language', name: 'AP English Language', icon: '📝', category: 'English' },
  { id: 'ap_english_literature', name: 'AP English Literature', icon: '📚', category: 'English' },
  
  // AP History & Social Sciences
  { id: 'ap_us_history', name: 'AP US History', icon: '🗽', category: 'History' },
  { id: 'ap_world_history', name: 'AP World History: Modern', icon: '🌐', category: 'History' },
  { id: 'ap_european_history', name: 'AP European History', icon: '🏛️', category: 'History' },
  { id: 'ap_us_government', name: 'AP US Government', icon: '⚖️', category: 'History' },
  { id: 'ap_comparative_government', name: 'AP Comparative Government', icon: '🏛️', category: 'History' },
  { id: 'ap_human_geography', name: 'AP Human Geography', icon: '🗺️', category: 'Social Science' },
  { id: 'ap_psychology', name: 'AP Psychology', icon: '🧠', category: 'Social Science' },
  { id: 'ap_macroeconomics', name: 'AP Macroeconomics', icon: '💰', category: 'Social Science' },
  { id: 'ap_microeconomics', name: 'AP Microeconomics', icon: '📊', category: 'Social Science' },
  
  // AP World Languages
  { id: 'ap_spanish_language', name: 'AP Spanish Language', icon: '🇪🇸', category: 'Language' },
  { id: 'ap_spanish_literature', name: 'AP Spanish Literature', icon: '📖', category: 'Language' },
  { id: 'ap_french_language', name: 'AP French Language', icon: '🇫🇷', category: 'Language' },
  { id: 'ap_german_language', name: 'AP German Language', icon: '🇩🇪', category: 'Language' },
  { id: 'ap_italian_language', name: 'AP Italian Language', icon: '🇮🇹', category: 'Language' },
  { id: 'ap_latin', name: 'AP Latin', icon: '🏛️', category: 'Language' },
  { id: 'ap_chinese_language', name: 'AP Chinese Language', icon: '🇨🇳', category: 'Language' },
  { id: 'ap_japanese_language', name: 'AP Japanese Language', icon: '🇯🇵', category: 'Language' },
  
  // AP Computer Science
  { id: 'ap_computer_science_a', name: 'AP Computer Science A', icon: '💻', category: 'Computer Science' },
  { id: 'ap_computer_science_principles', name: 'AP CS Principles', icon: '🖥️', category: 'Computer Science' },
  
  // AP Arts
  { id: 'ap_art_2d', name: 'AP Art: 2-D Design', icon: '🎨', category: 'Arts' },
  { id: 'ap_art_3d', name: 'AP Art: 3-D Design', icon: '🗿', category: 'Arts' },
  { id: 'ap_art_drawing', name: 'AP Art: Drawing', icon: '✏️', category: 'Arts' },
  { id: 'ap_music_theory', name: 'AP Music Theory', icon: '🎵', category: 'Arts' },
  { id: 'ap_art_history', name: 'AP Art History', icon: '🖼️', category: 'Arts' },
  
  // AP Capstone
  { id: 'ap_seminar', name: 'AP Seminar', icon: '💡', category: 'Capstone' },
  { id: 'ap_research', name: 'AP Research', icon: '🔬', category: 'Capstone' },
  { id: 'ap_african_american_studies', name: 'AP African American Studies', icon: '✊', category: 'Social Science' },
  
  // Standardized Tests
  { id: 'sat_math', name: 'SAT Math', icon: 'Σ', category: 'Standardized' },
  { id: 'act_math', name: 'ACT Math', icon: 'π', category: 'Standardized' },
  { id: 'psat_math', name: 'PSAT Math', icon: '√', category: 'Standardized' },
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

  // Group by category
  const categories = {};
  EXAMS.forEach(exam => {
    if (!categories[exam.category]) categories[exam.category] = [];
    categories[exam.category].push(exam);
  });

  return (
    <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
      {Object.entries(categories).map(([category, exams]) => (
        <div key={category}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 px-1">
            {category}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {exams.map(exam => (
              <button
                key={exam.id}
                onClick={() => handleClick(exam.id)}
                className={cn(
                  "relative flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-150",
                  isSelected(exam.id)
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                {isSelected(exam.id) && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-slate-900 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                <span className="text-xl mb-1">{exam.icon}</span>
                <span className="text-xs font-medium text-slate-900 text-center line-clamp-2">{exam.name}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}