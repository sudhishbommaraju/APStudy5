import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Mail } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">About Proofly</h1>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-8">
          {/* Mission Statement */}
          <div>
            <p className="text-lg text-slate-700 leading-relaxed">
              Proofly is an adaptive study platform designed to help students prepare for AP and standardized exams more efficiently by focusing on what matters most.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200" />

          {/* Why It Was Built */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Why It Was Built</h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
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
          <div className="border-t border-slate-200" />

          {/* Values */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Our Values</h2>
            <ul className="space-y-2 text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-slate-400 mt-1">•</span>
                <span>Learning-first design</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 mt-1">•</span>
                <span>No ads</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 mt-1">•</span>
                <span>No selling student data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 mt-1">•</span>
                <span>Built with academic integrity in mind</span>
              </li>
            </ul>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200" />

          {/* Partnerships */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Partnerships</h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Proofly is open to partnerships with tutors, schools, and educational organizations.
            </p>
            <a 
              href="mailto:partnerships@proofly.com" 
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span className="text-sm">partnerships@proofly.com</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}