import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, Target, Brain, TrendingUp, CheckCircle2, Users } from 'lucide-react';

export default function About() {
  const sectionsRef = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: Target,
      title: 'Personalized Study Plans',
      description: 'The app guides you toward the skills and units that need the most attention, based on your performance.',
    },
    {
      icon: Brain,
      title: 'Adaptive Practice',
      description: 'Questions adjust based on your strengths and weaknesses, so time is spent where it matters most.',
    },
    {
      icon: TrendingUp,
      title: 'Practice and Exam Modes',
      description: 'Switch between learning mode and timed exam mode to prepare effectively.',
    },
    {
      icon: CheckCircle2,
      title: 'Clear Progress Tracking',
      description: 'See which skills you have mastered and which ones need more work.',
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #1e3a5f 0%, #2d5a7b 100%)', fontFamily: 'Georgia, serif' }}>
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(99,102,241,0.1),transparent_50%)]" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center relative">
          <div 
            ref={(el) => (sectionsRef.current[0] = el)}
            className="opacity-0 transition-all duration-1000 translate-y-8"
            style={{ transitionDelay: '100ms' }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6" style={{ fontFamily: 'Georgia, serif' }}>
              Built to Make Studying Work.
            </h1>
            <p className="text-2xl text-slate-200 mb-4 font-light">
              A smarter way to study for AP, SAT, ACT, and beyond.
            </p>
            <p className="text-lg text-slate-300 leading-relaxed max-w-3xl mx-auto mb-8">
              This app was built to solve a real problem: studying hard without seeing results. Instead of guessing what to study next, the app guides students with structure, feedback, and personalized practice.
            </p>
            <Link to={createPageUrl('Dashboard')}>
              <Button size="lg" className="h-14 px-8 text-lg bg-white text-slate-900 hover:bg-slate-100">
                Start Studying
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why This App Was Built */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div 
            ref={(el) => (sectionsRef.current[1] = el)}
            className="opacity-0 transition-all duration-1000 translate-y-8"
            style={{ transitionDelay: '200ms' }}
          >
            <h2 className="text-4xl font-bold text-slate-900 mb-8 text-center" style={{ fontFamily: 'Georgia, serif' }}>
              Why This App Exists
            </h2>
            <div className="space-y-6 text-slate-700 leading-relaxed text-lg">
              <p>
                In middle school, academics came easily to me. I didn't need much structure and still earned strong grades. High school changed that quickly. The expectations were higher, the material was more demanding, and studying without a clear system stopped working.
              </p>
              <p>
                I finished my freshman year with a 3.6 GPA, and during the first semester of my sophomore year, my grades slipped further to a 3.33. That was a wake-up call. I was putting in the hours, but I wasn't studying efficiently or intentionally. I didn't need to work harder. I needed to work smarter.
              </p>
              <p>
                That realization is what led me to start building this app. I wanted a system that could tell me what to focus on, adapt as I improved, and make progress measurable instead of guesswork. This app is the result of that process, built to help students avoid the same trial-and-error approach I went through.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div 
            ref={(el) => (sectionsRef.current[2] = el)}
            className="opacity-0 transition-all duration-1000 translate-y-8"
            style={{ transitionDelay: '300ms' }}
          >
            <h2 className="text-4xl font-bold text-slate-900 mb-8 text-center" style={{ fontFamily: 'Georgia, serif' }}>
              Studying Is Harder Than It Should Be
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                'Students do not know what to study next',
                'Practice is often random or repetitive',
                'Progress is hard to measure',
                'Time is wasted on already-mastered material',
              ].map((problem, i) => (
                <div 
                  key={i}
                  className="bg-white rounded-lg p-6 border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-md"
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <p className="text-slate-700 leading-relaxed">{problem}</p>
                </div>
              ))}
            </div>
            <p className="text-xl text-slate-800 text-center font-medium">
              This app was built to replace guesswork with clarity.
            </p>
          </div>
        </div>
      </section>

      {/* How the App Helps */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div 
            ref={(el) => (sectionsRef.current[3] = el)}
            className="opacity-0 transition-all duration-1000 translate-y-8"
            style={{ transitionDelay: '400ms' }}
          >
            <h2 className="text-4xl font-bold text-slate-900 mb-12 text-center" style={{ fontFamily: 'Georgia, serif' }}>
              How the App Helps You Study Smarter
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, i) => (
                <div 
                  key={i}
                  className="bg-slate-50 rounded-xl p-8 border border-slate-200 hover:border-indigo-300 transition-all duration-300 hover:shadow-lg group"
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <feature.icon className="w-10 h-10 text-indigo-600 mb-4 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-slate-50 rounded-xl p-8 border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-3">Clean, Distraction-Free Design</h3>
              <p className="text-slate-600 leading-relaxed">
                The interface is built for focus, not clutter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="py-20" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div 
            ref={(el) => (sectionsRef.current[4] = el)}
            className="opacity-0 transition-all duration-1000 translate-y-8"
            style={{ transitionDelay: '500ms' }}
          >
            <h2 className="text-4xl font-bold text-slate-900 mb-8 text-center" style={{ fontFamily: 'Georgia, serif' }}>
              Who This Is For
            </h2>
            <div className="bg-white rounded-xl p-8 border border-slate-200">
              <ul className="space-y-4 text-slate-700 text-lg">
                {[
                  'High school students taking AP classes',
                  'Students preparing for SAT or ACT',
                  'Students who want structure, not shortcuts',
                  'Anyone who wants to study efficiently',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <Users className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Closing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div 
            ref={(el) => (sectionsRef.current[5] = el)}
            className="opacity-0 transition-all duration-1000 translate-y-8"
            style={{ transitionDelay: '600ms' }}
          >
            <h2 className="text-4xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Georgia, serif' }}>
              Built With Students in Mind
            </h2>
            <p className="text-lg text-slate-700 leading-relaxed max-w-3xl mx-auto mb-8">
              This app was built by a student, refined through real use, and designed to support long-term learning. The goal is not shortcuts or inflated scores, but better habits, clearer focus, and real understanding.
            </p>
            <Link to={createPageUrl('Dashboard')}>
              <Button size="lg" className="h-14 px-8 text-lg bg-indigo-600 hover:bg-indigo-700">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-12 border-t border-slate-200 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-slate-600 mb-2">
            Questions or partnership inquiries?
          </p>
          <a 
            href="mailto:partnerships@proofly.com" 
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            partnerships@proofly.com
          </a>
        </div>
      </section>

      <style jsx>{`
        .animate-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}</style>
    </div>
  );
}