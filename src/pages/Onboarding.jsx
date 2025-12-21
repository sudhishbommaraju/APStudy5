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

export default function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
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
        grade_level: gradeLevel,
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900">Welcome to Proofly</h1>
              <p className="text-slate-500 mt-2">Let's personalize your learning experience</p>
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

          <div className="flex justify-end mt-8 pt-6 border-t border-slate-100">
            <Button
              onClick={handleComplete}
              disabled={loading || !gradeLevel}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : null}
              Get Started
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}