import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Play, FileText, AlertCircle, Clock, BarChart, BookOpen, Plus } from 'lucide-react';

export default function EngineHome() {
  const navigate = useNavigate();
  const [savedPractices, setSavedPractices] = useState([]);
  const [recentMistakes, setRecentMistakes] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const user = await base44.auth.me();
    
    // Load saved practices
    const saved = await base44.entities.SavedPractice.filter({
      user_email: user.email,
      is_active: true
    });
    setSavedPractices(saved);

    // Load recent mistakes
    const responses = await base44.entities.EnginePracticeResponse.filter({
      is_correct: false
    });
    const recent = responses.slice(0, 5);
    setRecentMistakes(recent);

    // Load stats
    const sessions = await base44.entities.EnginePracticeSession.filter({
      user_email: user.email
    });
    const completed = sessions.filter(s => s.completed_at);
    const totalQuestions = completed.reduce((sum, s) => sum + (s.question_count || 0), 0);
    
    setStats({
      totalSessions: completed.length,
      totalQuestions,
      savedPractices: saved.length
    });
  }

  return (
    <div className="min-h-screen bg-black py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <h1 className="text-4xl font-light text-white mb-4">Practice Engine</h1>
          <p className="text-neutral-400">Master SAT, ACT, and AP exams with AI-powered practice</p>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-6 mb-12">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <div className="text-3xl font-semibold text-white mb-2">{stats.totalSessions}</div>
              <div className="text-sm text-neutral-400">Practice Sessions</div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <div className="text-3xl font-semibold text-white mb-2">{stats.totalQuestions}</div>
              <div className="text-sm text-neutral-400">Questions Completed</div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <div className="text-3xl font-semibold text-white mb-2">{stats.savedPractices}</div>
              <div className="text-sm text-neutral-400">Saved Practices</div>
            </div>
          </div>
        )}

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div
            onClick={() => navigate(createPageUrl('EnginePracticeBuilder'))}
            className="bg-gradient-to-br from-blue-900 to-blue-950 border border-blue-800 rounded-2xl p-8 cursor-pointer hover:scale-[1.02] transition-all"
          >
            <Plus className="w-10 h-10 text-blue-400 mb-4" />
            <h3 className="text-2xl font-medium text-white mb-2">New Practice</h3>
            <p className="text-blue-300/70">Start a custom practice session</p>
          </div>

          <div
            onClick={() => navigate(createPageUrl('EngineNotes'))}
            className="bg-gradient-to-br from-purple-900 to-purple-950 border border-purple-800 rounded-2xl p-8 cursor-pointer hover:scale-[1.02] transition-all"
          >
            <BookOpen className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-2xl font-medium text-white mb-2">Generate Notes</h3>
            <p className="text-purple-300/70">AI study notes for any topic</p>
          </div>
        </div>

        {/* Resume Practice */}
        {savedPractices.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-medium text-white mb-4">Resume Practice</h2>
            <div className="space-y-3">
              {savedPractices.map((practice) => (
                <div
                  key={practice.id}
                  onClick={() => navigate(createPageUrl('EnginePracticeSession') + `?session=${practice.session_id}&resume=true`)}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-neutral-700 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <Play className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="text-white font-medium">Continue Practice</div>
                      <div className="text-sm text-neutral-400">
                        Question {practice.current_question_index + 1}
                      </div>
                    </div>
                  </div>
                  <Button className="bg-white text-black hover:bg-neutral-100">
                    Resume
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate(createPageUrl('EngineMistakes'))}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-left hover:border-neutral-700 transition-all"
          >
            <AlertCircle className="w-6 h-6 text-red-400 mb-3" />
            <h3 className="text-white font-medium mb-1">Mistake Review</h3>
            <p className="text-sm text-neutral-400">Review {recentMistakes.length} recent errors</p>
          </button>

          <button
            onClick={() => navigate(createPageUrl('EngineTimedQuiz'))}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-left hover:border-neutral-700 transition-all"
          >
            <Clock className="w-6 h-6 text-orange-400 mb-3" />
            <h3 className="text-white font-medium mb-1">Timed Quiz</h3>
            <p className="text-sm text-neutral-400">Quick 10-minute drill</p>
          </button>

          <button
            onClick={() => navigate(createPageUrl('EngineAnalytics'))}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-left hover:border-neutral-700 transition-all"
          >
            <BarChart className="w-6 h-6 text-blue-400 mb-3" />
            <h3 className="text-white font-medium mb-1">Analytics</h3>
            <p className="text-sm text-neutral-400">View performance trends</p>
          </button>
        </div>
      </div>
    </div>
  );
}