import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import StudyPlanGenerator from '@/components/studyplan/StudyPlanGenerator';
import { AuroraBackground } from '@/components/ui/animated-background';
import { ArrowLeft, BookmarkPlus, Loader2, BarChart3 } from 'lucide-react';

export default function StudyPlans() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      // Fetch analytics
      const sessions = await base44.entities.EnginePracticeSession.filter({
        user_email: userData.email
      }, '-completed_at', 100);

      const skillPerformance = await base44.entities.EngineUserSkillPerformance.filter({
        user_email: userData.email
      }, '-accuracy', 100);

      const allResponses = await Promise.all(
        sessions.map(session =>
          base44.entities.EnginePracticeResponse.filter({
            session_id: session.id
          }, '', 1000)
        )
      );
      const responses = allResponses.flat();

      const completedSessions = sessions.filter(s => s.completed_at).length;
      const totalAttempts = responses.length;
      const correctAnswers = responses.filter(r => r.is_correct).length;
      const overallAccuracy = totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0;

      setAnalyticsData({
        overallAccuracy: parseFloat(overallAccuracy.toFixed(1)),
        totalSessions: completedSessions,
        skillPerformance: skillPerformance.map(s => ({
          name: s.skill_id || 'Unknown',
          accuracy: s.accuracy || 0,
          correct: s.correct || 0,
          attempts: s.attempts || 0
        }))
      });
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AuroraBackground>
          <DashboardNavbar />
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        </AuroraBackground>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AuroraBackground>
        <DashboardNavbar />
        <div className="min-h-screen py-16">
          <div className="max-w-6xl mx-auto px-6">
            {/* Header */}
            <button
              onClick={() => navigate(createPageUrl('Dashboard'))}
              className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-12"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>

            <div className="flex items-center gap-3 mb-12">
              <BookmarkPlus className="w-8 h-8 text-purple-500" />
              <div>
                <h1 className="text-3xl font-light text-white">Study Plans</h1>
                <p className="text-neutral-400 mt-1">AI-generated plans personalized to your learning</p>
              </div>
            </div>

            {/* Analytics Summary */}
            {analyticsData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                  <p className="text-neutral-400 text-sm">Overall Accuracy</p>
                  <p className="text-2xl font-bold text-white">{analyticsData.overallAccuracy}%</p>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                  <p className="text-neutral-400 text-sm">Sessions Completed</p>
                  <p className="text-2xl font-bold text-white">{analyticsData.totalSessions}</p>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                  <p className="text-neutral-400 text-sm">Skills Tracked</p>
                  <p className="text-2xl font-bold text-white">{analyticsData.skillPerformance.length}</p>
                </div>
              </div>
            )}

            {/* Study Plan Generator */}
            {analyticsData && user && (
              <StudyPlanGenerator 
                userEmail={user.email}
                analyticsData={analyticsData}
              />
            )}

            {/* Quick Link to Analytics */}
            <div className="mt-12 text-center">
              <button
                onClick={() => navigate(createPageUrl('Analytics'))}
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                View Full Analytics Dashboard
              </button>
            </div>
          </div>
        </div>
      </AuroraBackground>
    </ProtectedRoute>
  );
}