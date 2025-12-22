import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  BookOpen, 
  Target, 
  Clock, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2,
  Zap,
  Play,
  FileText,
  Brain,
  X,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, subDays, parseISO } from 'date-fns';
import UpgradeModal from '@/components/monetization/UpgradeModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  
  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      // Redirect to onboarding if not completed
      if (!currentUser.onboarding_complete) {
        window.location.href = createPageUrl('Onboarding');
      }
    };
    loadUser();
  }, []);

  const { data: attempts = [] } = useQuery({
    queryKey: ['attempts'],
    queryFn: () => base44.entities.Attempt.list('-created_date', 500),
    enabled: !!user,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.Session.list('-created_date', 50),
    enabled: !!user,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list('subject_id'),
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units', selectedSubject],
    queryFn: () => base44.entities.Unit.filter({ subject_id: selectedSubject }),
    enabled: !!selectedSubject,
  });

  const userAttempts = attempts.filter(a => a.created_by === user?.email);

  // Calculate stats
  const totalQuestions = userAttempts.length;
  const correctCount = userAttempts.filter(a => a.is_correct).length;
  const overallAccuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

  // Get time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Recommendation based on recent activity
  const lastAttempt = userAttempts[0];
  const recommendedSubject = lastAttempt ? subjects.find(s => s.subject_id === lastAttempt.subject_id) : null;

  const handleStartPractice = () => {
    if (selectedSubject) {
      navigate(createPageUrl('Practice') + `?subject=${selectedSubject}${selectedUnit ? `&unit=${selectedUnit}` : ''}`);
    }
  };

  const handleStartExam = () => {
    if (selectedSubject) {
      navigate(createPageUrl('Exam') + `?subject=${selectedSubject}`);
    }
  };

  // Recent sessions
  const recentSessions = sessions
    .filter(s => s.created_by === user?.email && s.status === 'completed')
    .slice(0, 5);

  // Study streak (days in a row with attempts)
  const studyDays = new Set();
  userAttempts.forEach(a => {
    studyDays.add(format(parseISO(a.created_date), 'yyyy-MM-dd'));
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F1F5FB', fontFamily: 'Georgia, serif' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-8 mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {getGreeting()}{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-slate-600 text-lg mb-6">
            Choose a subject and start a personalized study session.
          </p>
          <Button 
            size="lg" 
            onClick={() => document.getElementById('study-action-card')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Study Session
          </Button>
        </div>

        {/* Study Action Card - PRIMARY */}
        <div id="study-action-card" className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Start Studying</h2>
          
          <div className="space-y-4">
            {/* Subject Selector */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Select Subject
              </label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a subject to study" />
                </SelectTrigger>
                <SelectContent className="max-h-96">
                  {(() => {
                    const grouped = subjects.reduce((acc, subject) => {
                      const category = subject.category;
                      if (!acc[category]) acc[category] = [];
                      acc[category].push(subject);
                      return acc;
                    }, {});
                    
                    return Object.entries(grouped).map(([category, categorySubjects]) => (
                      <div key={category}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          {category}
                        </div>
                        {categorySubjects.map((subject) => (
                          <SelectItem key={subject.subject_id} value={subject.subject_id}>
                            <div className="flex items-center gap-2">
                              {subject.icon && <span>{subject.icon}</span>}
                              <span>{subject.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>

            {/* Unit Selector (appears after subject selection) */}
            {selectedSubject && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Select Unit (Optional)
                </label>
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All units" />
                  </SelectTrigger>
                  <SelectContent className="max-h-96">
                    <SelectItem value={null}>All Units</SelectItem>
                    {units.sort((a, b) => a.unit_number - b.unit_number).map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        Unit {unit.unit_number}: {unit.unit_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={handleStartPractice}
                disabled={!selectedSubject}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Start Practice
              </Button>
              <Button 
                onClick={handleStartExam}
                disabled={!selectedSubject}
                variant="outline"
                className="flex-1"
              >
                <Clock className="w-4 h-4 mr-2" />
                Create Exam
              </Button>
            </div>
          </div>
        </div>

        {/* Today's Plan (Contextual) */}
        {recommendedSubject && totalQuestions > 10 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Recommended Study Session</h3>
                <p className="text-sm text-slate-600 mt-1">Based on your recent activity</p>
              </div>
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{recommendedSubject.icon}</span>
                <span className="font-medium text-slate-900">{recommendedSubject.name}</span>
              </div>
              <p className="text-sm text-slate-600">
                {lastAttempt.unit_name && `Focus: ${lastAttempt.unit_name}`}
              </p>
              <p className="text-sm text-slate-600">Estimated time: 15-20 minutes</p>
            </div>
            <Button 
              onClick={() => {
                setSelectedSubject(recommendedSubject.subject_id);
                if (lastAttempt.unit_id) setSelectedUnit(lastAttempt.unit_id);
                document.getElementById('study-action-card')?.scrollIntoView({ behavior: 'smooth' });
              }}
              variant="outline"
              className="w-full"
            >
              Start Recommended Session
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Progress Snapshot */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Progress</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <div className="text-3xl font-bold text-slate-900">{totalQuestions}</div>
              <div className="text-sm text-slate-600 mt-1">Questions Practiced</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <div className="text-3xl font-bold text-indigo-600">{overallAccuracy.toFixed(0)}%</div>
              <div className="text-sm text-slate-600 mt-1">Overall Accuracy</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <div className="text-3xl font-bold text-slate-900">{studyDays.size}</div>
              <div className="text-sm text-slate-600 mt-1">Study Days</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => navigate(createPageUrl('Practice'))}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all text-left"
          >
            <BookOpen className="w-6 h-6 text-slate-600 mb-3" />
            <div className="font-medium text-slate-900">Practice by Unit</div>
            <div className="text-sm text-slate-600 mt-1">Master specific topics</div>
          </button>

          <button
            onClick={() => navigate(createPageUrl('Exam'))}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all text-left"
          >
            <Clock className="w-6 h-6 text-slate-600 mb-3" />
            <div className="font-medium text-slate-900">Custom Exam</div>
            <div className="text-sm text-slate-600 mt-1">Timed practice test</div>
          </button>

          <button
            onClick={() => navigate(createPageUrl('Notes'))}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all text-left"
          >
            <FileText className="w-6 h-6 text-slate-600 mb-3" />
            <div className="font-medium text-slate-900">Study Notes</div>
            <div className="text-sm text-slate-600 mt-1">Review key concepts</div>
          </button>

          <button
            onClick={() => navigate(createPageUrl('Progress'))}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all text-left"
          >
            <TrendingUp className="w-6 h-6 text-slate-600 mb-3" />
            <div className="font-medium text-slate-900">View Progress</div>
            <div className="text-sm text-slate-600 mt-1">Track your growth</div>
          </button>
        </div>

        {/* Pricing Plans */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Choose Your Plan</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <div className="border-2 border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-slate-900">Free</h4>
                <div className="text-2xl font-bold text-slate-900">$0</div>
              </div>
              <p className="text-slate-600 text-sm mb-6">Perfect for getting started</p>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">5 AI-generated questions per day</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Basic practice mode</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Progress tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-400">Custom exams</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-400">AI tutor</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-400">Generate from notes/videos</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-400">Flashcards</span>
                </li>
              </ul>

              {user?.plan === 'free' && (
                <div className="text-center py-2 text-sm text-slate-500 font-medium">
                  Current Plan
                </div>
              )}
            </div>

            {/* Pro Plan */}
            <div className="border-2 border-purple-500 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                POPULAR
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-xl font-bold text-slate-900">Pro</h4>
                  <Crown className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">$9.99</div>
                  <div className="text-xs text-slate-500">/month</div>
                </div>
              </div>
              <p className="text-slate-600 text-sm mb-6">Unlock your full potential</p>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700 font-medium">Unlimited AI-generated questions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700 font-medium">Custom timed exams</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700 font-medium">AI tutor for instant help</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700 font-medium">Generate from your notes & videos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700 font-medium">Unlimited flashcards</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700 font-medium">Advanced analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700 font-medium">Priority support</span>
                </li>
              </ul>

              {user?.plan === 'free' ? (
                <Button 
                  onClick={() => setUpgradeModalOpen(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Button>
              ) : (
                <div className="text-center py-2 text-sm text-purple-600 font-medium">
                  Current Plan
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
    </div>
  );
}