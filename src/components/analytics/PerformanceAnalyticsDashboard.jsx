import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Target, Award, Brain, Clock, CheckCircle } from 'lucide-react';

export default function PerformanceAnalyticsDashboard({ examType, userId }) {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, [examType, userId]);

  async function loadAnalytics() {
    try {
      setLoading(true);
      const user = await base44.auth.me();
      
      // Fetch sessions
      const sessions = await base44.entities.EnginePracticeSession.filter({
        user_email: user.email
      }, '-completed_at', 100);

      const completedSessions = sessions.filter(s => s.completed_at);

      // Fetch responses
      const allResponses = await Promise.all(
        completedSessions.map(s => 
          base44.entities.EnginePracticeResponse.filter({ session_id: s.id })
        )
      );
      const responses = allResponses.flat();

      // Fetch skill performance
      const skillPerf = await base44.entities.EngineUserSkillPerformance.filter({
        user_email: user.email
      }, '-accuracy', 50);

      // Calculate analytics
      const accuracyOverTime = completedSessions.slice(-10).map((session, idx) => {
        const sessionResponses = responses.filter(r => r.session_id === session.id);
        const correct = sessionResponses.filter(r => r.is_correct).length;
        return {
          session: idx + 1,
          accuracy: sessionResponses.length > 0 ? (correct / sessionResponses.length) * 100 : 0,
          date: new Date(session.completed_at).toLocaleDateString()
        };
      });

      const skillData = skillPerf.slice(0, 8).map(s => ({
        skill: s.skill_id?.substring(0, 20) || 'Unknown',
        accuracy: Math.round(s.accuracy),
        attempts: s.attempts
      }));

      const overallStats = {
        totalSessions: completedSessions.length,
        totalQuestions: responses.length,
        correctAnswers: responses.filter(r => r.is_correct).length,
        averageAccuracy: responses.length > 0 
          ? Math.round((responses.filter(r => r.is_correct).length / responses.length) * 100)
          : 0,
        averageTime: responses.length > 0
          ? Math.round(responses.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) / responses.length / 1000)
          : 0,
        streak: calculateStreak(completedSessions)
      };

      setAnalytics({
        accuracyOverTime,
        skillData,
        overallStats
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateStreak(sessions) {
    if (sessions.length === 0) return 0;
    
    const sortedSessions = sessions
      .filter(s => s.completed_at)
      .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const session of sortedSessions) {
      const sessionDate = new Date(session.completed_at);
      sessionDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((currentDate - sessionDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0 || daysDiff === 1) {
        streak++;
        currentDate = sessionDate;
      } else {
        break;
      }
    }
    
    return streak;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center p-12 text-neutral-400">
        No performance data available yet. Start practicing to see your analytics!
      </div>
    );
  }

  const { accuracyOverTime, skillData, overallStats } = analytics;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-neutral-900 border-neutral-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-neutral-400 text-sm">Sessions</span>
          </div>
          <div className="text-2xl font-semibold text-white">{overallStats.totalSessions}</div>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-5 h-5 text-blue-500" />
            <span className="text-neutral-400 text-sm">Questions</span>
          </div>
          <div className="text-2xl font-semibold text-white">{overallStats.totalQuestions}</div>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-purple-500" />
            <span className="text-neutral-400 text-sm">Accuracy</span>
          </div>
          <div className="text-2xl font-semibold text-white">{overallStats.averageAccuracy}%</div>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-5 h-5 text-yellow-500" />
            <span className="text-neutral-400 text-sm">Correct</span>
          </div>
          <div className="text-2xl font-semibold text-white">{overallStats.correctAnswers}</div>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <span className="text-neutral-400 text-sm">Avg Time</span>
          </div>
          <div className="text-2xl font-semibold text-white">{overallStats.averageTime}s</div>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-red-500" />
            <span className="text-neutral-400 text-sm">Streak</span>
          </div>
          <div className="text-2xl font-semibold text-white">{overallStats.streak} days</div>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="accuracy" className="w-full">
        <TabsList className="bg-neutral-900 border border-neutral-800">
          <TabsTrigger value="accuracy">Accuracy Trend</TabsTrigger>
          <TabsTrigger value="skills">Skill Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="accuracy" className="mt-6">
          <Card className="bg-neutral-900 border-neutral-800 p-6">
            <h3 className="text-lg font-medium text-white mb-6">Accuracy Over Last 10 Sessions</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={accuracyOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="session" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', r: 4 }}
                  name="Accuracy %"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="mt-6">
          <Card className="bg-neutral-900 border-neutral-800 p-6">
            <h3 className="text-lg font-medium text-white mb-6">Skill Performance Analysis</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={skillData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="skill" stroke="#9CA3AF" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#9CA3AF" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend />
                <Bar dataKey="accuracy" fill="#10B981" name="Accuracy %" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}