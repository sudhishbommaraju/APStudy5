import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import PerformanceOverview from '@/components/analytics/PerformanceOverview';
import StrengthWeaknessAnalysis from '@/components/analytics/StrengthWeaknessAnalysis';
import SubjectProgress from '@/components/analytics/SubjectProgress';
import ActionableInsights from '@/components/analytics/ActionableInsights';
import { AuroraBackground } from '@/components/ui/animated-background';
import { ArrowLeft, BarChart3, Loader2 } from 'lucide-react';

export default function Analytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const user = await base44.auth.me();

      // Fetch all practice sessions
      const sessions = await base44.entities.EnginePracticeSession.filter({
        user_email: user.email
      }, '-completed_at', 100);

      // Fetch skill performance
      const skillPerformance = await base44.entities.EngineUserSkillPerformance.filter({
        user_email: user.email
      }, '-accuracy', 100);

      // Fetch all responses
      const allResponses = await Promise.all(
        sessions.map(session => 
          base44.entities.EnginePracticeResponse.filter({
            session_id: session.id
          }, '', 1000)
        )
      );
      const responses = allResponses.flat();

      // Calculate overall metrics
      const completedSessions = sessions.filter(s => s.completed_at).length;
      const totalAttempts = responses.length;
      const correctAnswers = responses.filter(r => r.is_correct).length;
      const overallAccuracy = totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0;
      const avgResponseTime = responses.length > 0 
        ? (responses.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) / responses.length) / 1000
        : 0;

      // Build accuracy trend
      const sessionAccuracy = sessions
        .filter(s => s.completed_at && s.score)
        .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at))
        .slice(-10)
        .map(s => ({
          date: new Date(s.completed_at).toLocaleDateString(),
          accuracy: s.score
        }));

      // Subject performance
      const subjectMap = {};
      skillPerformance.forEach(skill => {
        const subject = skill.subject_id || 'General';
        if (!subjectMap[subject]) {
          subjectMap[subject] = { accuracy: 0, attempts: 0, count: 0 };
        }
        subjectMap[subject].accuracy += skill.accuracy || 0;
        subjectMap[subject].attempts += skill.attempts || 0;
        subjectMap[subject].count += 1;
      });

      const subjectData = Object.entries(subjectMap).map(([subject, data]) => ({
        subject,
        accuracy: data.accuracy / data.count,
        attempts: data.attempts
      }));

      // Time series data
      const timeSeriesData = sessions
        .filter(s => s.completed_at)
        .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at))
        .slice(-14)
        .map(s => ({
          date: new Date(s.completed_at).toLocaleDateString(),
          accuracy: s.score || 0
        }));

      setData({
        overallAccuracy: overallAccuracy.toFixed(1),
        avgResponseTime: avgResponseTime.toFixed(1),
        totalSessions: completedSessions,
        skillPerformance: skillPerformance.map(s => ({
          name: s.skill_id || 'Unknown',
          accuracy: s.accuracy || 0,
          correct: s.correct || 0,
          attempts: s.attempts || 0
        })),
        subjectData,
        timeSeriesData: timeSeriesData.length > 0 ? timeSeriesData : [{ date: 'No data', accuracy: 0 }],
        accuracyTrend: sessionAccuracy.length > 0 ? sessionAccuracy : [{ date: 'No data', accuracy: 0 }],
        completionData: [
          { name: 'Completed', value: completedSessions },
          { name: 'In Progress', value: sessions.length - completedSessions }
        ]
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
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
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-neutral-400">Loading your analytics...</p>
            </div>
          </div>
        </AuroraBackground>
      </ProtectedRoute>
    );
  }

  if (!data) {
    return (
      <ProtectedRoute>
        <AuroraBackground>
          <DashboardNavbar />
          <div className="min-h-screen py-16">
            <div className="max-w-6xl mx-auto px-6">
              <button
                onClick={() => navigate(createPageUrl('Dashboard'))}
                className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-12"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
              </button>
              <div className="text-center">
                <h1 className="text-3xl font-light text-white mb-2">No Data Available</h1>
                <p className="text-neutral-400">Complete practice sessions to see your analytics.</p>
              </div>
            </div>
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
            <div className="mb-12">
              <button
                onClick={() => navigate(createPageUrl('Dashboard'))}
                className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-6"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
              </button>

              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-blue-500" />
                <div>
                  <h1 className="text-3xl font-light text-white">Performance Analytics</h1>
                  <p className="text-neutral-400 mt-1">Comprehensive insights into your learning progress</p>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="space-y-12">
              {/* Performance Overview */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-6">Performance Overview</h2>
                <PerformanceOverview data={data} />
              </section>

              {/* Insights */}
              <section>
                <ActionableInsights data={data} />
              </section>

              {/* Subject Progress */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-6">Subject & Unit Analysis</h2>
                <SubjectProgress 
                  subjectData={data.subjectData} 
                  timeSeriesData={data.timeSeriesData}
                />
              </section>

              {/* Strength & Weakness */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-6">Skill Breakdown</h2>
                <StrengthWeaknessAnalysis 
                  skillPerformance={data.skillPerformance}
                />
              </section>
            </div>
          </div>
        </div>
      </AuroraBackground>
    </ProtectedRoute>
  );
}