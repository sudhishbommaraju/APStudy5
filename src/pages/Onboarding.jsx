import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const GRADES = [
  { id: 'freshman', name: 'Freshman', year: '9th Grade' },
  { id: 'sophomore', name: 'Sophomore', year: '10th Grade' },
  { id: 'junior', name: 'Junior', year: '11th Grade' },
  { id: 'senior', name: 'Senior', year: '12th Grade' },
];

const IMPROVEMENT_GOALS = [
  { id: 'ap_scores', label: 'Better AP Scores', icon: '📚' },
  { id: 'sat_scores', label: 'Higher SAT Scores', icon: '🎯' },
  { id: 'act_scores', label: 'Higher ACT Scores', icon: '📝' },
  { id: 'college_prep', label: 'College Preparation', icon: '🎓' },
  { id: 'understanding', label: 'Better Understanding', icon: '💡' },
  { id: 'grades', label: 'Better Grades', icon: '⭐' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [gradeLevel, setGradeLevel] = useState('');
  const [improvementGoals, setImprovementGoals] = useState([]);

  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          base44.auth.redirectToLogin(createPageUrl('Onboarding'));
          return;
        }
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.onboarding_complete) {
          navigate(createPageUrl('Dashboard'));
        }
      } catch (e) {
        base44.auth.redirectToLogin(createPageUrl('Onboarding'));
      }
      setCheckingAuth(false);
    };
    loadUser();
  }, [navigate]);

  const toggleGoal = (goalId) => {
    setImprovementGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    );
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await base44.auth.updateMe({
        grade_level: gradeLevel,
        improvement_goals: improvementGoals,
        onboarding_complete: true,
      });
      navigate(createPageUrl('Dashboard'));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-8">
          {/* Step 1: Grade Level */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white">Welcome to Proofly</h1>
                <p className="text-neutral-400 mt-2">What grade are you in?</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {GRADES.map((grade) => (
                  <button
                    key={grade.id}
                    onClick={() => setGradeLevel(grade.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all duration-150",
                      gradeLevel === grade.id
                        ? "border-white bg-neutral-800"
                        : "border-neutral-700 hover:border-neutral-600"
                    )}
                  >
                    <span className="font-semibold text-white">{grade.name}</span>
                    <span className="block text-sm text-neutral-400">{grade.year}</span>
                  </button>
                ))}
              </div>

              <div className="flex justify-end mt-8 pt-6 border-t border-neutral-800">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!gradeLevel}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Improvement Goals */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">What are your goals?</h2>
                <p className="text-neutral-400 mt-2">Select all that apply</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {IMPROVEMENT_GOALS.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all duration-150",
                      improvementGoals.includes(goal.id)
                        ? "border-white bg-neutral-800"
                        : "border-neutral-700 hover:border-neutral-600"
                    )}
                  >
                    <span className="text-2xl mb-2 block">{goal.icon}</span>
                    <span className="font-medium text-white text-sm">{goal.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex justify-between mt-8 pt-6 border-t border-neutral-800">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={loading || improvementGoals.length === 0}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : null}
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}