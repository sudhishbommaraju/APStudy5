import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [examGoal, setExamGoal] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [targetScore, setTargetScore] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [studyFrequency, setStudyFrequency] = useState('');

  const apSubjects = [
    'AP Biology', 'AP Chemistry', 'AP Physics', 'AP Calculus AB', 'AP Calculus BC',
    'AP Statistics', 'AP Computer Science A', 'AP US History', 'AP World History',
    'AP Psychology', 'AP English Language', 'AP English Literature'
  ];

  const handleSubjectToggle = (subject) => {
    setSelectedSubjects(prev =>
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  const handleNext = async () => {
    if (step === 1 && !examGoal) {
      toast.error('Please select an exam');
      return;
    }
    if (step === 2 && examGoal === 'AP' && selectedSubjects.length === 0) {
      toast.error('Please select at least one subject');
      return;
    }
    if (step === 3 && !targetScore) {
      toast.error('Please enter your target score');
      return;
    }
    if (step === 4 && !gradeLevel) {
      toast.error('Please select your grade level');
      return;
    }
    if (step === 5 && !studyFrequency) {
      toast.error('Please select your study frequency');
      return;
    }

    if (step < 5) {
      setStep(step + 1);
    } else {
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      await base44.auth.updateMe({
        exam_goal: examGoal,
        selected_subjects: selectedSubjects.join(','),
        target_score: targetScore,
        grade_level: gradeLevel,
        study_frequency: studyFrequency,
        onboarding_complete: true
      });

      toast.success('Onboarding complete!');
      navigate(createPageUrl('Dashboard'));
    } catch (error) {
      toast.error('Failed to complete onboarding');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requireOnboarding={true}>
      <div className="min-h-screen bg-black py-16">
        <div className="max-w-2xl mx-auto px-6">
          {/* Progress */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              {[1, 2, 3, 4, 5].map(num => (
                <div
                  key={num}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    num <= step
                      ? 'bg-white text-black'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {num < step ? <CheckCircle2 className="w-6 h-6" /> : num}
                </div>
              ))}
            </div>
            <div className="w-full bg-neutral-800 rounded-full h-1">
              <div
                className="bg-white h-1 rounded-full transition-all"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Step 1: Exam Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-light text-white mb-2">Which exam are you preparing for?</h1>
                <p className="text-neutral-400">We'll tailor your experience accordingly.</p>
              </div>

              <div className="space-y-3">
                {['SAT', 'ACT', 'AP'].map(exam => (
                  <button
                    key={exam}
                    onClick={() => setExamGoal(exam)}
                    className={`w-full p-6 rounded-lg border-2 transition-all text-left ${
                      examGoal === exam
                        ? 'border-white bg-white/10'
                        : 'border-neutral-700 hover:border-neutral-600'
                    }`}
                  >
                    <div className="text-xl font-semibold text-white">{exam}</div>
                    <div className="text-sm text-neutral-400 mt-1">
                      {exam === 'SAT' && 'Evidence-based reading & math focused'}
                      {exam === 'ACT' && 'Comprehensive with science section'}
                      {exam === 'AP' && 'College-level subject mastery'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: AP Subjects */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-light text-white mb-2">
                  {examGoal === 'AP' ? 'Which AP subjects are you taking?' : 'Continue'}
                </h1>
                <p className="text-neutral-400">
                  {examGoal === 'AP'
                    ? 'Select all that apply'
                    : 'Skipping subject selection'}
                </p>
              </div>

              {examGoal === 'AP' && (
                <div className="grid grid-cols-2 gap-3">
                  {apSubjects.map(subject => (
                    <button
                      key={subject}
                      onClick={() => handleSubjectToggle(subject)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedSubjects.includes(subject)
                          ? 'border-white bg-white/10'
                          : 'border-neutral-700 hover:border-neutral-600'
                      }`}
                    >
                      <div className="text-white font-medium text-sm">{subject}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Target Score */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-light text-white mb-2">What's your target score?</h1>
                <p className="text-neutral-400">This helps us personalize your study plan.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Target {examGoal} Score
                </label>
                <Input
                  placeholder={
                    examGoal === 'SAT'
                      ? 'e.g., 1500'
                      : examGoal === 'ACT'
                      ? 'e.g., 35'
                      : 'e.g., 4'
                  }
                  value={targetScore}
                  onChange={e => setTargetScore(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
            </div>
          )}

          {/* Step 4: Grade Level */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-light text-white mb-2">What's your current grade level?</h1>
                <p className="text-neutral-400">This helps us recommend study pacing.</p>
              </div>

              <div>
                <Select value={gradeLevel} onValueChange={setGradeLevel}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder="Select grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9">9th Grade</SelectItem>
                    <SelectItem value="10">10th Grade</SelectItem>
                    <SelectItem value="11">11th Grade</SelectItem>
                    <SelectItem value="12">12th Grade</SelectItem>
                    <SelectItem value="college">College</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 5: Study Frequency */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-light text-white mb-2">How often can you study?</h1>
                <p className="text-neutral-400">This helps us create a realistic study schedule.</p>
              </div>

              <div className="space-y-3">
                {[
                  { value: '1-2', label: '1-2 hours per week' },
                  { value: '3-5', label: '3-5 hours per week' },
                  { value: '5-10', label: '5-10 hours per week' },
                  { value: '10+', label: '10+ hours per week' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setStudyFrequency(option.value)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      studyFrequency === option.value
                        ? 'border-white bg-white/10'
                        : 'border-neutral-700 hover:border-neutral-600'
                    }`}
                  >
                    <div className="text-white font-medium">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-12 gap-4">
            <Button
              onClick={() => setStep(step > 1 ? step - 1 : 1)}
              variant="outline"
              disabled={step === 1}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={loading}
              className="flex-1 bg-white text-black hover:bg-neutral-100"
            >
              {step === 5 ? (
                <>
                  Complete <ArrowRight className="ml-2 w-4 h-4" />
                </>
              ) : (
                <>
                  Next <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}