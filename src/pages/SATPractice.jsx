import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';

export default function SATPractice() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black py-16">
      <div className="max-w-4xl mx-auto px-6">
        <button
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-12"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="text-center">
          <h1 className="text-4xl font-light tracking-tight text-white mb-4">
            SAT Practice
          </h1>
          <p className="text-lg text-neutral-400 mb-12">
            Adaptive SAT drills coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}