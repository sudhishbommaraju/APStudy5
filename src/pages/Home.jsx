import React from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, Target, Brain, TrendingUp, CheckCircle2 } from 'lucide-react';
import GalaxyBackground from '@/components/effects/GalaxyBackground';
import CursorGlow from '@/components/effects/CursorGlow';

export default function Home() {
  const handleGetStarted = () => {
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
    <div className="galaxy-page">
      <GalaxyBackground />
      <CursorGlow />
      <div className="galaxy-content">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Side - Content */}
            <div className="space-y-8">
              <div>
                <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight bg-gradient-to-br from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  Your AI study partner for exam success
                </h1>
                <p className="text-xl text-slate-300 leading-relaxed">
                  Ace your exams with personalized practice, adaptive learning, and instant feedback.
                </p>
              </div>

              <Button 
                size="lg" 
                onClick={handleGetStarted} 
                className="h-12 px-8 text-base bg-violet-600 hover:bg-violet-700 text-white rounded-lg shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 transition-all"
              >
                Start studying free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              {/* Steps */}
              <div className="space-y-4 pt-4">
                {steps.map((step, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-violet-500/20 group-hover:bg-violet-500/30 flex items-center justify-center text-violet-400 font-semibold transition-colors border border-violet-500/30">
                      {step.number}
                    </div>
                    <div>
                      <h3 className="text-slate-100 font-semibold mb-1">{step.title}</h3>
                      <p className="text-slate-400 text-sm">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Visual */}
            <div className="relative">
              <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
                <div className="space-y-4">
                  {/* Mock dashboard preview */}
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex items-center gap-3 mb-4">
                      <Target className="w-5 h-5 text-violet-400" />
                      <span className="text-slate-100 font-semibold">Your Progress</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">AP Calculus AB</span>
                        <span className="text-emerald-400 font-semibold">87%</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full" style={{ width: '87%' }} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex items-center gap-3 mb-4">
                      <Brain className="w-5 h-5 text-indigo-400" />
                      <span className="text-slate-100 font-semibold">Today's Practice</span>
                    </div>
                    <div className="space-y-2 text-sm text-slate-300">
                      <div className="flex items-center justify-between">
                        <span>Questions completed</span>
                        <span className="text-slate-100 font-semibold">24/30</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Accuracy</span>
                        <span className="text-emerald-400 font-semibold">92%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-slate-100 font-semibold">Skills Mastered</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-violet-500/20 text-violet-300 text-xs rounded-full border border-violet-500/30">Derivatives</span>
                      <span className="px-3 py-1 bg-violet-500/20 text-violet-300 text-xs rounded-full border border-violet-500/30">Limits</span>
                      <span className="px-3 py-1 bg-violet-500/20 text-violet-300 text-xs rounded-full border border-violet-500/30">Integration</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative glow effect */}
              <div className="absolute -top-4 -right-4 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl -z-10" />
              <div className="absolute -bottom-8 -left-8 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
            </div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-100 mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
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
                className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-violet-500/50 hover:bg-slate-800/60 transition-all"
              >
                <feature.icon className="w-8 h-8 text-violet-400 mb-4" />
                <h3 className="text-slate-100 font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Proofly Was Built */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-100 mb-4">
              Why Proofly Was Built
            </h2>
          </div>
          <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 lg:p-12 shadow-2xl">
            <div className="prose prose-lg max-w-none">
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                As a high school student preparing for AP exams, I struggled to find effective study tools that adapted to my learning pace. Generic practice materials didn't target my weak areas, and I spent hours reviewing concepts I already understood.
              </p>
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                I realized that with AI, we could create a smarter study platform—one that learns from each answer, identifies knowledge gaps, and generates personalized practice exactly where students need it most.
              </p>
              <p className="text-slate-300 text-lg leading-relaxed">
                Proofly was built to give every student the adaptive, intelligent study partner they deserve. Whether you're aiming for a 5 on AP Calculus or mastering SAT Math, Proofly meets you where you are and helps you get where you want to be.
              </p>
              <div className="mt-8 pt-6 border-t border-slate-700/50">
                <p className="text-slate-400 text-sm">— Proofly Team</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-slate-100 mb-4">
            Ready to ace your exams?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Join students who are studying smarter with Proofly
          </p>
          <Button 
            size="lg" 
            onClick={handleGetStarted} 
            className="h-14 px-10 text-lg bg-violet-600 hover:bg-violet-700 text-white rounded-lg shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 transition-all"
          >
            Get started free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between text-slate-400 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded flex items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-600">
                <span className="text-white font-bold text-xs">P</span>
              </div>
              <span>Proofly © 2024</span>
            </div>
            <a href="mailto:partnerships@proofly.com" className="hover:text-slate-100 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
      
      </div>
    </div>
  );
}