import React from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowRight, Target, Brain, TrendingUp, CheckCircle2 } from 'lucide-react';
import ReviewCard from '@/components/reviews/ReviewCard';

export default function Home() {
  const handleGetStarted = () => {
    base44.auth.redirectToLogin(createPageUrl('Dashboard'));
  };

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => base44.entities.Review.filter({ is_public: true }),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

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
    <div className="min-h-screen bg-[#0C0C0C]">
      <div className="relative">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Side - Content */}
            <div className="space-y-8">
              <div>
                <h1 className="text-5xl lg:text-6xl font-semibold mb-6 leading-tight text-[#F5F5F5]">
                  Your AI study partner for exam success
                </h1>
                <p className="text-xl text-[#B5B5B5] leading-relaxed">
                  Ace your exams with personalized practice, adaptive learning, and instant feedback.
                </p>
              </div>

              <div className="flex gap-4">
                <Button 
                  size="lg" 
                  onClick={() => window.location.href = createPageUrl('Demo')} 
                  variant="outline"
                  className="h-12 px-8 text-base border-[#2A2A2A] text-[#F5F5F5] hover:bg-[#171717]"
                >
                  Try Demo (No Login)
                </Button>
                <Button 
                  size="lg" 
                  onClick={handleGetStarted} 
                  className="h-12 px-8 text-base bg-[#D6B98C] hover:bg-[#C9A96A] text-[#0C0C0C] font-medium"
                >
                  Start studying free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              {/* Steps */}
              <div className="space-y-4 pt-4">
                {steps.map((step, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#1E1E1E] flex items-center justify-center text-[#D6B98C] font-semibold border border-[#2A2A2A]">
                      {step.number}
                    </div>
                    <div>
                      <h3 className="text-[#F5F5F5] font-medium mb-1">{step.title}</h3>
                      <p className="text-[#8A8A8A] text-sm">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Actual Question Preview */}
            <div className="relative">
              <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-6 shadow-lg">
                {/* Question Header */}
                <div className="border-b border-[#2A2A2A] pb-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-[#171717] rounded-full text-xs font-medium text-[#B5B5B5]">
                      SAT Math
                    </span>
                    <span className="px-2 py-1 bg-[#D6B98C]/10 rounded-full text-xs font-medium text-[#D6B98C]">
                      medium
                    </span>
                  </div>
                </div>

                {/* Question Text */}
                <div className="mb-6">
                  <p className="text-base text-[#F5F5F5] leading-relaxed mb-1">
                    If <u className="decoration-2 decoration-[#D6B98C] underline-offset-2">the function f(x) = 2x + 3</u>, what is f(5)?
                  </p>
                  <p className="text-sm text-[#F5F5F5] font-medium mt-4">
                    Which choice best represents the value?
                  </p>
                </div>

                {/* Answer Choices */}
                <div className="space-y-2">
                  {['A. 8', 'B. 10', 'C. 13', 'D. 15'].map((choice, i) => (
                    <button
                      key={i}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-[#2A2A2A] hover:border-[#D6B98C] bg-[#171717] text-left transition-all"
                    >
                      <span className="w-7 h-7 rounded-full bg-[#1E1E1E] flex items-center justify-center text-sm font-medium text-[#B5B5B5]">
                        {choice[0]}
                      </span>
                      <span className="text-sm text-[#F5F5F5]">{choice.slice(3)}</span>
                    </button>
                  ))}
                </div>

                {/* Bottom note */}
                <div className="mt-6 pt-4 border-t border-[#2A2A2A]">
                  <p className="text-xs text-[#8A8A8A] text-center">
                    Instant feedback • Step-by-step explanations • Track your progress
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold text-[#F5F5F5] mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-xl text-[#B5B5B5] max-w-2xl mx-auto">
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
                className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6 hover:border-[#D6B98C]/30 transition-all card-smooth"
              >
                <feature.icon className="w-8 h-8 text-[#D6B98C] mb-4" />
                <h3 className="text-[#F5F5F5] font-medium mb-2">{feature.title}</h3>
                <p className="text-[#8A8A8A] text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Proofly Was Built */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#000000] mb-4">
              Why Proofly Was Built
            </h2>
          </div>
          <div className="bg-white border border-[#CBD5E1] rounded-2xl p-8 lg:p-12 shadow-lg">
            <div className="prose prose-lg max-w-none">
              <p className="text-[#334155] text-lg leading-relaxed mb-6">
                As a high school student preparing for AP exams, I struggled to find effective study tools that adapted to my learning pace. Generic practice materials didn't target my weak areas, and I spent hours reviewing concepts I already understood.
              </p>
              <p className="text-[#B5B5B5] text-lg leading-relaxed mb-6">
                I realized that with AI, we could create a smarter study platform—one that learns from each answer, identifies knowledge gaps, and generates personalized practice exactly where students need it most.
              </p>
              <p className="text-[#B5B5B5] text-lg leading-relaxed">
                Proofly was built to give every student the adaptive, intelligent study partner they deserve. Whether you're aiming for a 5 on AP Calculus or mastering SAT Math, Proofly meets you where you are and helps you get where you want to be.
              </p>
              <div className="mt-8 pt-6 border-t border-[#2A2A2A]">
                <p className="text-[#8A8A8A] text-sm">— Proofly Team</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Student Reviews Section */}
      {reviews.length > 0 && (
        <section className="py-20 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-[#000000] mb-4">
                What Students Say
              </h2>
              <p className="text-xl text-[#334155]">
                Real feedback from students using Proofly
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.slice(0, 6).map((review) => {
                const reviewUser = allUsers.find(u => u.email === review.user_id);
                return (
                  <ReviewCard key={review.id} review={review} user={reviewUser} />
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-semibold text-[#F5F5F5] mb-4">
            Ready to ace your exams?
          </h2>
          <p className="text-xl text-[#B5B5B5] mb-8">
            Join students who are studying smarter with Proofly
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => window.location.href = createPageUrl('Demo')} 
              variant="outline"
              className="h-14 px-10 text-lg border-[#2A2A2A] text-[#F5F5F5] hover:bg-[#171717]"
            >
              Try Demo
            </Button>
            <Button 
              size="lg" 
              onClick={handleGetStarted} 
              className="h-14 px-10 text-lg bg-[#D6B98C] hover:bg-[#C9A96A] text-[#0C0C0C] font-medium"
            >
              Get started free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* About the Creator */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-2xl p-8 lg:p-12 shadow-lg">
            <h2 className="text-3xl font-semibold text-[#F5F5F5] mb-6 text-center">About the Creator</h2>
            <div className="space-y-6">
              <p className="text-[#B5B5B5] text-lg leading-relaxed text-center">
                Hi, I'm <span className="text-[#D6B98C] font-medium">Sudhish Bommaraju</span>, a football player with aspirations to become a tech entrepreneur. 
                I built Proofly to combine my passion for technology with my commitment to helping students succeed academically. 
                This platform reflects my belief that with the right tools, anyone can achieve their academic goals while pursuing their dreams.
              </p>
              <div className="flex items-center justify-center pt-4 border-t border-[#2A2A2A]">
                <a 
                  href="mailto:theproofly.com@gmail.com" 
                  className="flex items-center gap-2 text-[#B5B5B5] hover:text-[#D6B98C] transition-colors"
                >
                  <span className="text-xl">✉️</span>
                  <span className="text-sm">theproofly.com@gmail.com</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2A2A2A] py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between text-[#8A8A8A] text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded flex items-center justify-center bg-[#D6B98C]">
                <span className="text-[#0C0C0C] font-bold text-xs">P</span>
              </div>
              <span>Proofly © 2026</span>
            </div>
            <a href="mailto:theproofly.com@gmail.com" className="hover:text-[#D6B98C] transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
      
      </div>
    </div>
  );
}