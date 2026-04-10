import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';

export default function ACTFullTest() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8fafc] py-16">
      <div className="max-w-4xl mx-auto px-6">
        <button
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-12"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center">
          <h1 className="text-3xl font-semibold text-gray-900 mb-4">
            Full-Length ACT Test
          </h1>
          <p className="text-gray-500 mb-4">
            Simulated ACT exam coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}