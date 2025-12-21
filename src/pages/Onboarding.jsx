import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import ExamSelector from '@/components/ui/ExamSelector';
import { cn } from '@/lib/utils';

const GRADES = [
  { id: 'freshman', name: 'Freshman', year: '9th Grade' },
  { id: 'sophomore', name: 'Sophomore', year: '10th Grade' },
  { id: 'junior', name: 'Junior', year: '11th Grade' },
  { id: 'senior', name: 'Senior', year: '12th Grade' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  
  const [selectedExams, setSelectedExams] = useState([]);
  const [primaryExam, setPrimaryExam] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');

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

  const handleComplete = async () => {
    setLoading(true);
    try {
      await base44.auth.updateMe({
        selected_exams: selectedExams,
        primary_exam: primaryExam || selectedExams[0],
        grade_level: gradeLevel,
        onboarding_complete: true,
      });
      navigate(createPageUrl('Dashboard'));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const canProceed = () => {
    if (step === 1) return selectedExams.length > 0;
    if (step === 2) return gradeLevel !== '';
    return true;
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                s === step ? "w-8 bg-slate-900" : s < step ? "w-8 bg-slate-400" : "w-8 bg-slate-200"
              )}
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          {/* Step 1: Select Exams */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900">Welcome to Proofly</h1>
                <p className="text-slate-500 mt-2">Which exams are you preparing for?</p>
              </div>
              <ExamSelector
                selected={selectedExams}
                onSelect={setSelectedExams}
                multiple={true}
              />
            </div>
          )}

          {/* Step 2: Grade Level */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900">What grade are you in?</h1>
                <p className="text-slate-500 mt-2">This helps us personalize your experience</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {GRADES.map((grade) => (
                  <button
                    key={grade.id}
                    onClick={() => setGradeLevel(grade.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all duration-150",
                      gradeLevel === grade.id
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <span className="font-semibold text-slate-900">{grade.name}</span>
                    <span className="block text-sm text-slate-500">{grade.year}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Primary Exam */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900">Your main focus?</h1>
                <p className="text-slate-500 mt-2">Which exam is your top priority right now?</p>
              </div>
              <div className="space-y-2">
                {selectedExams.map((examId) => {
                  const examNames = {
                    ap_calculus: 'AP Calculus',
                    sat_math: 'SAT Math',
                    act_math: 'ACT Math',
                    psat_math: 'PSAT Math',
                  };
                  return (
                    <button
                      key={examId}
                      onClick={() => setPrimaryExam(examId)}
                      className={cn(
                        "w-full p-4 rounded-xl border-2 text-left transition-all duration-150",
                        primaryExam === examId
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <span className="font-semibold text-slate-900">{examNames[examId]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className={cn(step === 1 && "invisible")}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={loading || !primaryExam}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : null}
                Get Started
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}