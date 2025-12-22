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
  Play,
  FileText,
  Brain
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
import Calendar from '@/components/dashboard/Calendar';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-4 mb-4">
          <h1 className="text-xl font-bold text-slate-900 mb-1">
            {getGreeting()}{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-slate-600 text-sm mb-3">
            Choose a subject and start a personalized study session.
          </p>
          <Button 
            size="sm" 
            onClick={() => document.getElementById('study-action-card')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Study Session
          </Button>
        </div>

        {/* Study Action Card - PRIMARY */}
        <div id="study-action-card" className="bg-white rounded-xl border border-slate-200 p-4 mb-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-3">Start Studying</h2>
          
          <div className="space-y-3">
            {/* Subject Selector */}
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1.5 block">
                Select Subject
              </label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a subject to study" />
                </SelectTrigger>
                <SelectContent className="max-h-96">
                  {(() => {
                    // Remove duplicates by subject_id
                    const uniqueSubjects = Array.from(
                      new Map(subjects.map(s => [s.subject_id, s])).values()
                    );

                    const grouped = uniqueSubjects.reduce((acc, subject) => {
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
                <label className="text-xs font-medium text-slate-700 mb-1.5 block">
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
            <div className="flex gap-2 pt-1">
              <Button 
                onClick={handleStartPractice}
                disabled={!selectedSubject}
                size="sm"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                <BookOpen className="w-3 h-3 mr-1.5" />
                Start Practice
              </Button>
              <Button 
                onClick={handleStartExam}
                disabled={!selectedSubject}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Clock className="w-3 h-3 mr-1.5" />
                Create Exam
              </Button>
            </div>
          </div>
        </div>

        {/* Today's Plan (Contextual) */}
        {recommendedSubject && totalQuestions > 10 && (
          <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Recommended Session</h3>
                <p className="text-xs text-slate-600 mt-0.5">Based on recent activity</p>
              </div>
              <Target className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="space-y-1 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{recommendedSubject.icon}</span>
                <span className="text-sm font-medium text-slate-900">{recommendedSubject.name}</span>
              </div>
              <p className="text-xs text-slate-600">
                {lastAttempt.unit_name && `Focus: ${lastAttempt.unit_name}`}
              </p>
            </div>
            <Button 
              onClick={() => {
                setSelectedSubject(recommendedSubject.subject_id);
                if (lastAttempt.unit_id) setSelectedUnit(lastAttempt.unit_id);
                document.getElementById('study-action-card')?.scrollIntoView({ behavior: 'smooth' });
              }}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Start Session
              <ArrowRight className="w-3 h-3 ml-2" />
            </Button>
          </div>
        )}

        {/* Progress Snapshot */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Your Progress</h3>
          <div className="grid sm:grid-cols-3 gap-2">
            <div className="text-center p-2 bg-slate-50 rounded-lg">
              <div className="text-xl font-bold text-slate-900">{totalQuestions}</div>
              <div className="text-xs text-slate-600 mt-0.5">Questions</div>
            </div>
            <div className="text-center p-2 bg-slate-50 rounded-lg">
              <div className="text-xl font-bold text-indigo-600">{overallAccuracy.toFixed(0)}%</div>
              <div className="text-xs text-slate-600 mt-0.5">Accuracy</div>
            </div>
            <div className="text-center p-2 bg-slate-50 rounded-lg">
              <div className="text-xl font-bold text-slate-900">{studyDays.size}</div>
              <div className="text-xs text-slate-600 mt-0.5">Study Days</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
          <button
            onClick={() => navigate(createPageUrl('Practice'))}
            className="bg-white rounded-lg border border-slate-200 p-3 hover:border-indigo-300 hover:shadow-sm transition-all text-left"
          >
            <BookOpen className="w-5 h-5 text-slate-600 mb-2" />
            <div className="text-sm font-medium text-slate-900">Practice</div>
            <div className="text-xs text-slate-600 mt-0.5">Master topics</div>
          </button>

          <button
            onClick={() => navigate(createPageUrl('Exam'))}
            className="bg-white rounded-lg border border-slate-200 p-3 hover:border-indigo-300 hover:shadow-sm transition-all text-left"
          >
            <Clock className="w-5 h-5 text-slate-600 mb-2" />
            <div className="text-sm font-medium text-slate-900">Exam</div>
            <div className="text-xs text-slate-600 mt-0.5">Timed test</div>
          </button>

          <button
            onClick={() => navigate(createPageUrl('Notes'))}
            className="bg-white rounded-lg border border-slate-200 p-3 hover:border-indigo-300 hover:shadow-sm transition-all text-left"
          >
            <FileText className="w-5 h-5 text-slate-600 mb-2" />
            <div className="text-sm font-medium text-slate-900">Notes</div>
            <div className="text-xs text-slate-600 mt-0.5">Key concepts</div>
          </button>

          <button
            onClick={() => navigate(createPageUrl('Progress'))}
            className="bg-white rounded-lg border border-slate-200 p-3 hover:border-indigo-300 hover:shadow-sm transition-all text-left"
          >
            <TrendingUp className="w-5 h-5 text-slate-600 mb-2" />
            <div className="text-sm font-medium text-slate-900">Progress</div>
            <div className="text-xs text-slate-600 mt-0.5">Track growth</div>
          </button>
        </div>

        {/* Calendar */}
        <Calendar user={user} />

      </div>
    </div>
  );
}