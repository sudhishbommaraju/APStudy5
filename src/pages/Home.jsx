import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Target, TrendingUp, BookOpen, Loader2 } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const user = await base44.auth.me();
          if (user.onboarding_complete) {
            navigate(createPageUrl('Dashboard'));
          } else {
            navigate(createPageUrl('Onboarding'));
          }
        }
      } catch (e) {
        // Not authenticated, show landing
      }
      setCheckingAuth(false);
    };
    checkAuth();
  }, [navigate]);

  const handleGetStarted = () => {
    base44.auth.redirectToLogin(createPageUrl('Onboarding'));
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50/50 to-transparent" />
        
        <div className="relative max-w-5xl mx-auto px-6 pt-12 pb-20">
          {/* Nav */}
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="font-bold text-xl text-slate-900">PrepPath</span>
            </div>
            <Button variant="ghost" onClick={handleGetStarted}>
              Sign In
            </Button>
          </nav>

          {/* Hero Content */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-6">
              <Target className="w-4 h-4" />
              AI-powered test preparation
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-6">
              Master AP & SAT Math with
              <span className="text-blue-600"> intelligent practice</span>
            </h1>
            
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Turn your notes into exam-style questions. Track your weaknesses. 
              Get personalized recommendations. Study smarter, not harder.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="h-12 px-6 text-base" onClick={handleGetStarted}>
                Start Practicing Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-6 text-base">
                See How It Works
              </Button>
            </div>

            <div className="flex items-center gap-6 mt-8 text-sm text-slate-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Free to start
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                No credit card
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Practice in 60 seconds
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="border-t border-slate-100 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Everything you need to score higher
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              Built for serious students preparing for AP Calculus, SAT, ACT, and PSAT.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-slate-200 bg-white">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">AI Question Generator</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Generate exam-style questions from your notes or by topic. 
                Questions match official College Board and ACT phrasing.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-4">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Smart Practice</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Immediate feedback with detailed explanations. 
                Understand why you got it wrong, not just what's right.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Progress Tracking</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Track accuracy by skill over time. Get adaptive recommendations 
                for what to study next.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Exams Supported */}
      <div className="border-t border-slate-100 py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-sm font-medium text-slate-500 mb-6">SUPPORTED EXAMS</p>
          <div className="flex flex-wrap justify-center gap-6">
            {['AP Calculus AB/BC', 'SAT Math', 'ACT Math', 'PSAT/NMSQT'].map((exam) => (
              <div key={exam} className="px-5 py-3 bg-white rounded-lg border border-slate-200 text-slate-700 font-medium">
                {exam}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Ready to improve your score?
          </h2>
          <p className="text-slate-500 mb-8">
            Join students who are studying smarter with AI-powered practice.
          </p>
          <Button size="lg" className="h-12 px-8 text-base" onClick={handleGetStarted}>
            Get Started Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center">
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <span>PrepPath © 2024</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Terms</span>
            <span>Privacy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}