import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Mail } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 50%, #DDD6FE 100%)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" size="icon" className="hover:bg-white/50">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>About Proofly</h1>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-200/50 shadow-xl p-10 space-y-10" style={{ fontFamily: 'Georgia, serif' }}>
          {/* Mission Statement */}
          <div className="text-center">
            <p className="text-xl text-slate-700 leading-relaxed font-medium">
              Proofly is an adaptive study platform designed to help students prepare for AP and standardized exams more efficiently by focusing on what matters most.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-purple-200" />

          {/* Why It Was Built */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Georgia, serif' }}>Why It Was Built</h2>
            <div className="space-y-5 text-slate-700 leading-relaxed text-lg">
              <p>
                In middle school, academics came easily to me. I didn't need much structure and still earned strong grades. High school changed that quickly. The expectations were higher, the material was more demanding, and studying without a clear system stopped working.
              </p>
              <p>
                I finished my freshman year with a 3.6 GPA, and during the first semester of my sophomore year, my grades slipped further to a 3.33. That was a wake-up call. I was putting in the hours, but I wasn't studying efficiently or intentionally. I didn't need to work harder. I needed to work smarter.
              </p>
              <p>
                That realization is what led me to start building this app. I wanted a system that could tell me what to focus on, adapt as I improved, and make progress measurable instead of guesswork. Proofly is the product of that ongoing process, built to help students avoid the same trial-and-error approach I went through.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-purple-200" />

          {/* Values */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Georgia, serif' }}>Our Values</h2>
            <ul className="space-y-3 text-slate-700 text-lg">
              <li className="flex items-start gap-3">
                <span className="text-purple-500 mt-1 text-xl">•</span>
                <span>Learning-first design</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-500 mt-1 text-xl">•</span>
                <span>No ads</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-500 mt-1 text-xl">•</span>
                <span>No selling student data</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-500 mt-1 text-xl">•</span>
                <span>Built with academic integrity in mind</span>
              </li>
            </ul>
          </div>

          {/* Divider */}
          <div className="border-t border-purple-200" />

          {/* Partnerships */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Georgia, serif' }}>Partnerships</h2>
            <p className="text-slate-700 leading-relaxed mb-4 text-lg">
              Proofly is open to partnerships with tutors, schools, and educational organizations.
            </p>
            <a 
              href="mailto:partnerships@proofly.com" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>partnerships@proofly.com</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}