import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Upload, Youtube, FileText, Target, Timer, BarChart, TrendingUp, Flame, BookOpen, Play, AlertCircle, LineChart } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('dashboard_active_tab') || 'SAT';
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('dashboard_active_tab', tab);
  };

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
      route: 'SATAdaptivePractice',
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

  const satStrategyContent = [
    {
      channel: 'Scalar Learning',
      title: 'SAT Math: Complete Strategy Guide',
      duration: '24:15',
      thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=340&fit=crop'
    },
    {
      channel: 'Hayden Rhodea SAT',
      title: 'Reading & Writing: Pattern Recognition',
      duration: '18:42',
      thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=340&fit=crop'
    },
    {
      channel: 'SupertutorTV',
      title: 'Time Management Strategies for SAT',
      duration: '15:30',
      thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=340&fit=crop'
    },
    {
      channel: 'The College Panda',
      title: 'Advanced Math Techniques',
      duration: '21:05',
      thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&h=340&fit=crop'
    },
    {
      channel: "Anna's Universe",
      title: 'SAT Grammar Rules You Must Know',
      duration: '19:20',
      thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&h=340&fit=crop'
    },
    {
      channel: 'PrepScholar SAT',
      title: 'Score 1500+: Complete Roadmap',
      duration: '28:45',
      thumbnail: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=600&h=340&fit=crop'
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

  const actStats = {
    scoreEstimate: 28,
    accuracy: 72,
    streak: 5
  };

  const actScoreData = [
    { week: 1, score: 23 },
    { week: 2, score: 25 },
    { week: 3, score: 26 },
    { week: 4, score: 27 },
    { week: 5, score: 28 }
  ];

  const actCoreTools = [
    {
      title: 'ACT Practice',
      description: 'Adaptive question drills by section.',
      route: 'ACTAdaptivePractice',
      icon: BookOpen
    },
    {
      title: 'Full-Length ACT Test',
      description: 'Simulated exam under timed conditions.',
      route: 'ACTFullTest',
      icon: Timer
    },
    {
      title: 'Section Drill',
      description: 'Focus on English, Math, Reading, or Science.',
      route: 'ACTPractice',
      icon: Target
    },
    {
      title: 'Mistake Review',
      description: 'Review incorrect answers and patterns.',
      route: 'ACTPractice',
      icon: AlertCircle
    },
    {
      title: 'Timed Mini Test',
      description: 'Short focused practice sessions.',
      route: 'ACTPractice',
      icon: Play
    },
    {
      title: 'Performance Analytics',
      description: 'Track progress across all sections.',
      route: 'ACTPractice',
      icon: LineChart
    }
  ];

  const actStrategyContent = [
    {
      channel: 'PrepScholar ACT',
      title: 'ACT Science: Master Data Interpretation',
      duration: '22:30',
      thumbnail: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&h=340&fit=crop'
    },
    {
      channel: 'The Testing Mom',
      title: 'ACT English: Grammar Essentials',
      duration: '17:55',
      thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=340&fit=crop'
    },
    {
      channel: 'Magoosh ACT',
      title: 'ACT Math: Problem-Solving Strategies',
      duration: '25:10',
      thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&h=340&fit=crop'
    },
    {
      channel: 'SupertutorTV',
      title: 'ACT Reading: Speed & Accuracy',
      duration: '19:40',
      thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=340&fit=crop'
    },
    {
      channel: 'Scalar Learning',
      title: 'Complete ACT Strategy Guide',
      duration: '31:25',
      thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=340&fit=crop'
    },
    {
      channel: 'ACT Academy',
      title: 'Score 34+: Proven Techniques',
      duration: '26:15',
      thumbnail: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=600&h=340&fit=crop'
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

  const apStats = {
    scoreEstimate: '4.2',
    mastery: 68,
    streak: 5
  };

  const apMasteryData = [
    { week: 1, mastery: 42 },
    { week: 2, mastery: 51 },
    { week: 3, mastery: 59 },
    { week: 4, mastery: 64 },
    { week: 5, mastery: 68 }
  ];

  const apCoreTools = [
    {
      icon: Upload,
      title: 'Upload Notes',
      description: 'AI personalizes PDFs into structured notes.',
      route: 'APUpload'
    },
    {
      icon: Youtube,
      title: 'Paste YouTube URL',
      description: 'AI transforms videos into personalized study notes.',
      route: 'APYoutube'
    },
    {
      icon: FileText,
      title: 'Generate Custom Notes',
      description: 'AI creates personalized notes from scratch.',
      route: 'APCreate'
    },
    {
      icon: Target,
      title: 'AP Practice (Notion)',
      description: 'Topic-based drills from your Notion question bank.',
      route: 'APPractice'
    },
    {
      icon: Timer,
      title: 'Full-Length Test (Notion)',
      description: 'Simulated AP exam using Notion content.',
      route: 'APFullTest'
    },
    {
      icon: BarChart,
      title: 'Progress Tracking (Notion)',
      description: 'Notion-powered mastery and score projection.',
      route: 'APProgress'
    }
  ];

  const apStrategyContent = [
    {
      channel: 'Heimler\'s History',
      title: 'AP US History: Period 3 Review',
      duration: '28:45',
      thumbnail: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=600&h=340&fit=crop'
    },
    {
      channel: 'Khan Academy',
      title: 'AP Calculus: Integration Techniques',
      duration: '23:15',
      thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&h=340&fit=crop'
    },
    {
      channel: 'Bozeman Science',
      title: 'AP Biology: Cell Respiration Deep Dive',
      duration: '20:30',
      thumbnail: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&h=340&fit=crop'
    },
    {
      channel: 'The Organic Chemistry Tutor',
      title: 'AP Chemistry: Equilibrium Mastery',
      duration: '31:50',
      thumbnail: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=600&h=340&fit=crop'
    },
    {
      channel: 'AP Physics with Mr. P',
      title: 'AP Physics: Mechanics Problem Solving',
      duration: '25:20',
      thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&h=340&fit=crop'
    },
    {
      channel: 'Fiveable',
      title: 'AP English: FRQ Writing Strategies',
      duration: '18:40',
      thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=340&fit=crop'
    }
  ];

  const apCards = [
    {
      icon: Upload,
      title: 'Upload Notes',
      description: 'AI personalizes PDFs into structured notes.',
      route: 'APUpload'
    },
    {
      icon: Youtube,
      title: 'Paste YouTube URL',
      description: 'AI transforms videos into personalized study notes.',
      route: 'APYoutube'
    },
    {
      icon: FileText,
      title: 'Generate Custom Notes',
      description: 'AI creates personalized notes from scratch.',
      route: 'APCreate'
    },
    {
      icon: Target,
      title: 'AP Practice (Notion)',
      description: 'Topic-based drills from your Notion question bank.',
      route: 'APPractice'
    },
    {
      icon: Timer,
      title: 'Full-Length Test (Notion)',
      description: 'Simulated AP exam using Notion content.',
      route: 'APFullTest'
    },
    {
      icon: BarChart,
      title: 'Progress Tracking (Notion)',
      description: 'Notion-powered mastery and score projection.',
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
                onClick={() => handleTabChange(tab)}
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

            {/* SAT Strategy Library */}
            <div className="mt-12">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-2xl font-light text-white mb-2">SAT Strategy Library</h2>
                  <p className="text-neutral-400">Curated expert breakdowns to boost your score.</p>
                </div>
                <button className="text-sm text-neutral-400 hover:text-white transition-colors">
                  View All →
                </button>
              </div>
              
              <div className="overflow-x-auto pb-4 -mx-6 px-6" style={{ scrollBehavior: 'smooth' }}>
                <div className="flex gap-6">
                  {satStrategyContent.map((video, index) => (
                    <div
                      key={index}
                      className="min-w-[300px] bg-neutral-900 border border-neutral-800 hover:border-neutral-600 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                    >
                      <div className="aspect-video bg-neutral-800 relative overflow-hidden">
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {video.duration}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="text-sm text-neutral-400 mb-2">{video.channel}</div>
                        <h3 className="text-base font-medium text-white mb-3 line-clamp-2">
                          {video.title}
                        </h3>
                        <button className="text-sm text-neutral-300 hover:text-white transition-colors">
                          Watch →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ACT' && (
          <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <h1 className="text-3xl font-light text-white mb-2">ACT Workspace</h1>
                <p className="text-neutral-400">Master the ACT with structured practice and comprehensive analytics.</p>
              </div>
              <div className="flex gap-4">
                <div className="bg-neutral-900 rounded-xl border border-neutral-800 px-6 py-4 text-center hover:border-neutral-700 transition-colors">
                  <div className="text-2xl font-semibold text-white mb-1">{actStats.scoreEstimate}</div>
                  <div className="text-xs text-neutral-400">Score Estimate</div>
                </div>
                <div className="bg-neutral-900 rounded-xl border border-neutral-800 px-6 py-4 text-center hover:border-neutral-700 transition-colors">
                  <div className="text-2xl font-semibold text-white mb-1">{actStats.accuracy}%</div>
                  <div className="text-xs text-neutral-400">Accuracy</div>
                </div>
                <div className="bg-neutral-900 rounded-xl border border-neutral-800 px-6 py-4 text-center hover:border-neutral-700 transition-colors">
                  <div className="text-2xl font-semibold text-white mb-1 flex items-center justify-center gap-1">
                    <Flame className="w-5 h-5 text-orange-500" />
                    {actStats.streak}
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
                  onClick={() => navigate(createPageUrl('ACTPractice'))}
                  className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 hover:border-neutral-600 rounded-2xl p-10 cursor-pointer transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-medium text-white mb-2">Continue ACT Practice</h2>
                      <p className="text-neutral-400">You're 8 points away from your target composite score.</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                  <button className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-neutral-100 transition-colors">
                    Resume Practice
                  </button>
                </div>

                {/* Core Tools Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {actCoreTools.map((tool, index) => {
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
                  {actScoreData.map((point, index) => {
                    const maxScore = 36;
                    const percentage = (point.score / maxScore) * 100;
                    return (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-neutral-400">Week {point.week}</span>
                          <span className="text-white font-medium">{point.score}</span>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 pt-6 border-t border-neutral-800">
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-white mb-1">+5</div>
                    <div className="text-sm text-neutral-400">Point Improvement</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ACT Strategy Library */}
            <div className="mt-12">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-2xl font-light text-white mb-2">ACT Strategy Library</h2>
                  <p className="text-neutral-400">Curated expert breakdowns to boost your score.</p>
                </div>
                <button className="text-sm text-neutral-400 hover:text-white transition-colors">
                  View All →
                </button>
              </div>
              
              <div className="overflow-x-auto pb-4 -mx-6 px-6" style={{ scrollBehavior: 'smooth' }}>
                <div className="flex gap-6">
                  {actStrategyContent.map((video, index) => (
                    <div
                      key={index}
                      className="min-w-[300px] bg-neutral-900 border border-neutral-800 hover:border-neutral-600 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                    >
                      <div className="aspect-video bg-neutral-800 relative overflow-hidden">
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {video.duration}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="text-sm text-neutral-400 mb-2">{video.channel}</div>
                        <h3 className="text-base font-medium text-white mb-3 line-clamp-2">
                          {video.title}
                        </h3>
                        <button className="text-sm text-neutral-300 hover:text-white transition-colors">
                          Watch →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'AP' && (
          <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <h1 className="text-3xl font-light text-white mb-2">AP Workspace</h1>
                <p className="text-neutral-400">Master AP exams with structured notes, targeted practice, and mastery tracking.</p>
              </div>
              <div className="flex gap-4">
                <div className="bg-neutral-900 rounded-xl border border-neutral-800 px-6 py-4 text-center hover:border-neutral-700 transition-colors">
                  <div className="text-2xl font-semibold text-white mb-1">{apStats.scoreEstimate}</div>
                  <div className="text-xs text-neutral-400">Score Estimate</div>
                </div>
                <div className="bg-neutral-900 rounded-xl border border-neutral-800 px-6 py-4 text-center hover:border-neutral-700 transition-colors">
                  <div className="text-2xl font-semibold text-white mb-1">{apStats.mastery}%</div>
                  <div className="text-xs text-neutral-400">Mastery</div>
                </div>
                <div className="bg-neutral-900 rounded-xl border border-neutral-800 px-6 py-4 text-center hover:border-neutral-700 transition-colors">
                  <div className="text-2xl font-semibold text-white mb-1 flex items-center justify-center gap-1">
                    <Flame className="w-5 h-5 text-orange-500" />
                    {apStats.streak}
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
                  onClick={() => navigate(createPageUrl('APPractice'))}
                  className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 hover:border-neutral-600 rounded-2xl p-10 cursor-pointer transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-medium text-white mb-2">Continue AP Practice</h2>
                      <p className="text-neutral-400">Notion-powered drills tailored to your weak points.</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                  <button className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-neutral-100 transition-colors">
                    Resume Practice
                  </button>
                </div>

                {/* Core Tools Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {apCoreTools.map((tool, index) => {
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

              {/* Right Column - Mastery Progress */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h3 className="text-lg font-medium text-white mb-6">Mastery Progress</h3>
                <div className="space-y-3">
                  {apMasteryData.map((point, index) => {
                    const percentage = point.mastery;
                    return (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-neutral-400">Week {point.week}</span>
                          <span className="text-white font-medium">{point.mastery}%</span>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 pt-6 border-t border-neutral-800">
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-white mb-1">+26%</div>
                    <div className="text-sm text-neutral-400">Mastery Gain</div>
                  </div>
                </div>
              </div>
            </div>

            {/* AP Strategy Library */}
            <div className="mt-12">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-2xl font-light text-white mb-2">AP Strategy Library</h2>
                  <p className="text-neutral-400">Curated expert breakdowns to boost your score.</p>
                </div>
                <button className="text-sm text-neutral-400 hover:text-white transition-colors">
                  View All →
                </button>
              </div>
              
              <div className="overflow-x-auto pb-4 -mx-6 px-6" style={{ scrollBehavior: 'smooth' }}>
                <div className="flex gap-6">
                  {apStrategyContent.map((video, index) => (
                    <div
                      key={index}
                      className="min-w-[300px] bg-neutral-900 border border-neutral-800 hover:border-neutral-600 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                    >
                      <div className="aspect-video bg-neutral-800 relative overflow-hidden">
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {video.duration}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="text-sm text-neutral-400 mb-2">{video.channel}</div>
                        <h3 className="text-base font-medium text-white mb-3 line-clamp-2">
                          {video.title}
                        </h3>
                        <button className="text-sm text-neutral-300 hover:text-white transition-colors">
                          Watch →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}