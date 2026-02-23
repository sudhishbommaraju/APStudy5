import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Upload, Youtube, FileText, Target, Timer, BarChart } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('SAT');

  const satCards = [
    {
      title: 'SAT Practice',
      description: 'Adaptive SAT question drills by section.',
      route: 'SATPractice'
    },
    {
      title: 'Full-Length SAT Test',
      description: 'Simulated SAT exam under timed conditions.',
      route: 'SATFullTest'
    }
  ];

  const actCards = [
    {
      title: 'ACT Practice',
      description: 'Adaptive ACT question drills by section.',
      route: 'ACTPractice'
    },
    {
      title: 'Full-Length ACT Test',
      description: 'Simulated ACT exam under timed conditions.',
      route: 'ACTFullTest'
    }
  ];

  const apCards = [
    {
      icon: Upload,
      title: 'Upload Notes',
      description: 'Upload PDFs to generate structured notes.',
      route: 'APUpload'
    },
    {
      icon: Youtube,
      title: 'Paste YouTube URL',
      description: 'Convert lecture videos into structured study notes.',
      route: 'APYoutube'
    },
    {
      icon: FileText,
      title: 'Create Custom Notes',
      description: 'Start structured notes from scratch.',
      route: 'APCreate'
    },
    {
      icon: Target,
      title: 'AP Practice',
      description: 'Topic-based AP question drills.',
      route: 'APPractice'
    },
    {
      icon: Timer,
      title: 'Full-Length Practice Test',
      description: 'Simulated AP exam experience.',
      route: 'APFullTest'
    },
    {
      icon: BarChart,
      title: 'Progress Tracking',
      description: 'Track skill mastery and score projection.',
      route: 'APProgress'
    }
  ];

  return (
    <div className="min-h-screen bg-black py-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Exam Tab Navigation */}
        <div className="flex justify-center mb-16">
          <div className="bg-neutral-900 border border-neutral-800 rounded-full p-1 inline-flex">
            {['SAT', 'ACT', 'AP'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-full transition-all ${
                  activeTab === tab
                    ? 'bg-white text-black'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'SAT' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {satCards.map((card, index) => (
              <div
                key={index}
                onClick={() => navigate(createPageUrl(card.route))}
                className="bg-neutral-900 border border-neutral-800 hover:border-neutral-600 rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:scale-[1.02]"
              >
                <h3 className="text-xl font-medium text-white mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'ACT' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {actCards.map((card, index) => (
              <div
                key={index}
                onClick={() => navigate(createPageUrl(card.route))}
                className="bg-neutral-900 border border-neutral-800 hover:border-neutral-600 rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:scale-[1.02]"
              >
                <h3 className="text-xl font-medium text-white mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'AP' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {apCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={index}
                  onClick={() => navigate(createPageUrl(card.route))}
                  className="bg-neutral-900 border border-neutral-800 hover:border-neutral-600 rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                >
                  <Icon className="w-8 h-8 mb-6 text-neutral-300" />
                  <h3 className="text-xl font-medium text-white mb-2">
                    {card.title}
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}