import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Upload, Youtube, FileText, Target, Timer, BarChart, TrendingUp, Flame, BookOpen, Play, AlertCircle, LineChart } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('SAT');

  // Mock data
  const stats = {
    scoreEstimate: 1320,
    accuracy: 67,
    streak: 5
  };

  const scoreData = [
    { week: 1, score: 1180 },
    { week: 2, score: 1220 },
    { week: 3, score: 1260 },
    { week: 4, score: 1300 },
    { week: 5, score: 1320 }
  ];

  const satCoreTools = [
    {
      title: 'SAT Practice',
      description: 'Adaptive question drills by section.',
      route: 'SATPractice',
      icon: BookOpen
    },
    {
      title: 'Full-Length SAT Test',
      description: 'Simulated exam under timed conditions.',
      route: 'SATFullTest',
      icon: Timer
    },
    {
      title: 'Section Drill',
      description: 'Focus on Math or Reading & Writing.',
      route: 'SATPractice',
      icon: Target
    },
    {
      title: 'Mistake Review',
      description: 'Review incorrect answers and patterns.',
      route: 'SATPractice',
      icon: AlertCircle
    },
    {
      title: 'Timed Mini Test',
      description: 'Short 20-minute practice sprints.',
      route: 'SATPractice',
      icon: Play
    },
    {
      title: 'Performance Analytics',
      description: 'Track progress and identify weak areas.',
      route: 'SATPractice',
      icon: LineChart
    }
  ];

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
          <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <h1 className="text-3xl font-light text-white mb-2">SAT Workspace</h1>
                <p className="text-neutral-400">Master the SAT with structured practice and full simulations.</p>
              </div>
              <div className="flex gap-4">
                <div className="bg-neutral-900 rounded-xl border border-neutral-800 px-6 py-4 text-center hover:border-neutral-700 transition-colors">
                  <div className="text-2xl font-semibold text-white mb-1">{stats.scoreEstimate}</div>
                  <div className="text-xs text-neutral-400">Score Estimate</div>
                </div>
                <div className="bg-neutral-900 rounded-xl border border-neutral-800 px-6 py-4 text-center hover:border-neutral-700 transition-colors">
                  <div className="text-2xl font-semibold text-white mb-1">{stats.accuracy}%</div>
                  <div className="text-xs text-neutral-400">Accuracy</div>
                </div>
                <div className="bg-neutral-900 rounded-xl border border-neutral-800 px-6 py-4 text-center hover:border-neutral-700 transition-colors">
                  <div className="text-2xl font-semibold text-white mb-1 flex items-center justify-center gap-1">
                    <Flame className="w-5 h-5 text-orange-500" />
                    {stats.streak}
                  </div>
                  <div className="text-xs text-neutral-400">Day Streak</div>
                </div>
              </div>
            </div>

            {/* Main Grid Container */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Featured Action + Tools */}
              <div className="lg:col-span-2 space-y-8">
                {/* Primary Recommended Action */}
                <div 
                  onClick={() => navigate(createPageUrl('SATPractice'))}
                  className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 hover:border-neutral-600 rounded-2xl p-10 cursor-pointer transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-medium text-white mb-2">Continue SAT Practice</h2>
                      <p className="text-neutral-400">You're 120 points away from your goal.</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                  <button className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-neutral-100 transition-colors">
                    Resume Practice
                  </button>
                </div>

                {/* Core Tools Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {satCoreTools.map((tool, index) => {
                    const Icon = tool.icon;
                    return (
                      <div
                        key={index}
                        onClick={() => navigate(createPageUrl(tool.route))}
                        className="bg-neutral-900 border border-neutral-800 hover:border-neutral-600 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                      >
                        <Icon className="w-6 h-6 mb-4 text-neutral-300" />
                        <h3 className="text-lg font-medium text-white mb-2">
                          {tool.title}
                        </h3>
                        <p className="text-sm text-neutral-400 leading-relaxed">
                          {tool.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column - Score Trajectory */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h3 className="text-lg font-medium text-white mb-6">Score Trajectory</h3>
                <div className="space-y-3">
                  {scoreData.map((point, index) => {
                    const maxScore = Math.max(...scoreData.map(d => d.score));
                    const percentage = (point.score / maxScore) * 100;
                    return (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-neutral-400">Week {point.week}</span>
                          <span className="text-white font-medium">{point.score}</span>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 pt-6 border-t border-neutral-800">
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-white mb-1">+140</div>
                    <div className="text-sm text-neutral-400">Point Improvement</div>
                  </div>
                </div>
              </div>
            </div>
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