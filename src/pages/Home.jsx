import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, Target, Brain, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      setIsAuthenticated(isAuth);
    };
    checkAuth();
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      window.location.href = createPageUrl('Dashboard');
    } else {
      base44.auth.redirectToLogin(createPageUrl('Dashboard'));
    }
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl('Dashboard'));
  };

  const steps = [
    {
      number: '1',
      title: 'Choose Your Subject',
      description: 'Select from AP Calculus, SAT, ACT, and more',
    },
    {
      number: '2',
      title: 'Practice Smart',
      description: 'Get personalized questions based on your performance',
    },
    {
      number: '3',
      title: 'Track Progress',
      description: 'See your mastery improve over time',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      
      {/* Navigation Bar */}
      <nav className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366F1, #A78BFA)' }}>
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="font-bold text-xl text-white" style={{ fontFamily: 'Georgia, serif' }}>Proofly</span>
            </div>
            
            {/* Right side buttons */}
            <div className="flex items-center gap-3">
              <Button onClick={handleLogin} variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800">
                Login
              </Button>
              <Button onClick={handleGetStarted} className="bg-slate-100 hover:bg-white text-slate-900 rounded-lg">
                Get started
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Hero Section - Split Layout */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Side - Content */}
            <div className="space-y-8">
              <div>
                <h1 className="text-5xl lg:text-6xl font-bold text-white mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                  <span className="text-indigo-400">Proofly</span>, your AI study partner
                </h1>
                <p className="text-xl text-slate-400 leading-relaxed">
                  Ace your exams with personalized practice and adaptive learning
                </p>
              </div>

              <Button 
                size="lg" 
                onClick={handleGetStarted} 
                className="h-12 px-8 text-base bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
              >
                Start studying
              </Button>

              {/* Steps */}
              <div className="space-y-4 pt-4">
                {steps.map((step, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center text-slate-400 font-semibold transition-colors">
                      {step.number}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">{step.title}</h3>
                      <p className="text-slate-400 text-sm">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Visual/Mockup */}
            <div className="relative lg:ml-8">
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-8 backdrop-blur-sm shadow-2xl">
                <div className="space-y-4">
                  {/* Mock dashboard preview */}
                  <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                      <Target className="w-5 h-5 text-indigo-400" />
                      <span className="text-white font-semibold">Your Progress</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">AP Calculus AB</span>
                        <span className="text-emerald-400 font-semibold">87%</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full" style={{ width: '87%' }} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                      <Brain className="w-5 h-5 text-purple-400" />
                      <span className="text-white font-semibold">Today's Practice</span>
                    </div>
                    <div className="space-y-2 text-sm text-slate-400">
                      <div className="flex items-center justify-between">
                        <span>Questions completed</span>
                        <span className="text-white font-semibold">24/30</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Accuracy</span>
                        <span className="text-emerald-400 font-semibold">92%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-white font-semibold">Skills Mastered</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-full">Derivatives</span>
                      <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-full">Limits</span>
                      <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-full">Integration</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative glow effect */}
              <div className="absolute -top-4 -right-4 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl -z-10" />
              <div className="absolute -bottom-8 -left-8 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl -z-10" />
            </div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              Everything you need to succeed
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Built for students who want to study smarter, not harder
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Target, title: 'Personalized Practice', desc: 'AI-powered questions tailored to your skill level and learning gaps' },
              { icon: Brain, title: 'AP-Style Exams', desc: 'Full-length practice exams with real-time scoring and feedback' },
              { icon: TrendingUp, title: 'Skill Mastery Tracking', desc: 'Visual progress reports showing exactly where you stand' },
              { icon: CheckCircle2, title: 'AI-Generated Notes', desc: 'Comprehensive study materials created for every topic' },
              { icon: Target, title: 'Flashcards', desc: 'Spaced repetition system for memorization and retention' },
              { icon: Brain, title: 'AI Tutor Mode', desc: '24/7 personal tutor to answer questions and explain concepts' },
            ].map((feature, i) => (
              <div 
                key={i}
                className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all hover:bg-slate-900"
              >
                <feature.icon className="w-8 h-8 text-indigo-400 mb-4" />
                <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Proofly Was Built */}
      <section className="py-20 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              Why Proofly Was Built
            </h2>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 lg:p-12">
            <div className="prose prose-lg prose-invert max-w-none">
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                As a high school student preparing for AP exams, I struggled to find effective study tools that adapted to my learning pace. Generic practice materials didn't target my weak areas, and I spent hours reviewing concepts I already understood.
              </p>
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                I realized that with AI, we could create a smarter study platform—one that learns from each answer, identifies knowledge gaps, and generates personalized practice exactly where students need it most.
              </p>
              <p className="text-slate-300 text-lg leading-relaxed">
                Proofly was built to give every student the adaptive, intelligent study partner they deserve. Whether you're aiming for a 5 on AP Calculus or mastering SAT Math, Proofly meets you where you are and helps you get where you want to be.
              </p>
              <div className="mt-8 pt-6 border-t border-slate-700">
                <p className="text-slate-400 text-sm">— Proofly Team</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Ready to ace your exams?
          </h2>
          <p className="text-xl text-slate-400 mb-8">
            Join students who are studying smarter with Proofly
          </p>
          <Button 
            size="lg" 
            onClick={handleGetStarted} 
            className="h-14 px-10 text-lg bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
          >
            Get started for free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between text-slate-500 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366F1, #A78BFA)' }}>
                <span className="text-white font-bold text-xs">P</span>
              </div>
              <span>Proofly © 2024</span>
            </div>
            <a href="mailto:partnerships@proofly.com" className="hover:text-slate-400 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}