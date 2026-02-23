import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Target, BarChart, Activity } from 'lucide-react';
import { LineChart, Line, BarChart as ReBarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { calculateWeightedMovingAverage, projectSATScore, projectACTScore, analyzeDifficultyPerformance, calculateImprovementVelocity } from '@/components/engine/ScoreProjection';

export default function EngineAnalytics() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [skillPerformance, setSkillPerformance] = useState([]);
  const [difficultyBreakdown, setDifficultyBreakdown] = useState([]);
  const [projectedScore, setProjectedScore] = useState(null);
  const [improvementVelocity, setImprovementVelocity] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    const user = await base44.auth.me();
    
    // Load practice sessions
    const userSessions = await base44.entities.EnginePracticeSession.filter({
      user_email: user.email
    });
    const completed = userSessions.filter(s => s.completed_at).sort(
      (a, b) => new Date(b.completed_at) - new Date(a.completed_at)
    );
    setSessions(completed);

    // Load skill performance
    const performance = await base44.entities.EngineUserSkillPerformance.filter({
      user_email: user.email
    });
    setSkillPerformance(performance.sort((a, b) => b.accuracy - a.accuracy));

    // Calculate difficulty performance
    const skills = await base44.entities.EngineSkill.list();
    const performanceWithDifficulty = performance.map(p => {
      const skill = skills.find(s => s.id === p.skill_id);
      return { ...p, difficulty_level: skill?.difficulty_level || 3 };
    });
    const diffBreakdown = analyzeDifficultyPerformance(performanceWithDifficulty);
    setDifficultyBreakdown(diffBreakdown);

    // Calculate projections
    const wma = calculateWeightedMovingAverage(completed);
    setProjectedScore(projectSATScore(wma)); // Default to SAT, can make dynamic

    // Calculate improvement velocity
    const velocity = await calculateImprovementVelocity(user.email);
    setImprovementVelocity(velocity);

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading analytics...</div>
      </div>
    );
  }

  const progressData = sessions.slice(0, 10).reverse().map((session, idx) => ({
    session: idx + 1,
    score: session.score || 0
  }));

  const totalQuestions = skillPerformance.reduce((sum, s) => sum + s.attempts, 0);
  const totalCorrect = skillPerformance.reduce((sum, s) => sum + s.correct, 0);
  const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

  return (
    <div className="min-h-screen bg-black py-16">
      <div className="max-w-6xl mx-auto px-6">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="mb-8 text-neutral-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-12">
          <h1 className="text-3xl font-light text-white mb-2">Performance Analytics</h1>
          <p className="text-neutral-400">Track your improvement over time</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Activity className="w-5 h-5 text-blue-400" />
              <div className="text-sm text-neutral-400">Total Sessions</div>
            </div>
            <div className="text-3xl font-semibold text-white">{sessions.length}</div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Target className="w-5 h-5 text-green-400" />
              <div className="text-sm text-neutral-400">Questions Attempted</div>
            </div>
            <div className="text-3xl font-semibold text-white">{totalQuestions}</div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <div className="text-sm text-neutral-400">Overall Accuracy</div>
            </div>
            <div className="text-3xl font-semibold text-white">
              {overallAccuracy.toFixed(0)}%
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <BarChart className="w-5 h-5 text-orange-400" />
              <div className="text-sm text-neutral-400">Skills Practiced</div>
            </div>
            <div className="text-3xl font-semibold text-white">
              {skillPerformance.length}
            </div>
          </div>
        </div>

        {/* Score Projection */}
        {projectedScore && (
          <div className="bg-gradient-to-br from-blue-900 to-blue-950 border border-blue-800 rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-medium text-white mb-4">Projected Score</h2>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-400 mb-2">{projectedScore}</div>
              <div className="text-sm text-blue-300 mb-4">Estimated SAT Score</div>
              {improvementVelocity > 0 && (
                <div className="text-sm text-green-400">
                  +{improvementVelocity.toFixed(1)}% improvement velocity
                </div>
              )}
            </div>
          </div>
        )}

        {/* Difficulty Performance Curve */}
        {difficultyBreakdown.length > 0 && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-medium text-white mb-6">Difficulty Performance Curve</h2>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer>
                <ReBarChart data={difficultyBreakdown}>
                  <XAxis
                    dataKey="difficulty"
                    stroke="rgba(255, 255, 255, 0.3)"
                    style={{ fontSize: '12px', fill: '#9CA3AF' }}
                    tickFormatter={(v) => `Level ${v}`}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="rgba(255, 255, 255, 0.3)"
                    style={{ fontSize: '12px', fill: '#9CA3AF' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171717',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                  />
                  <Bar dataKey="accuracy" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Progress Chart */}
        {progressData.length > 0 && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-medium text-white mb-6">Progress Over Time</h2>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer>
                <LineChart data={progressData}>
                  <XAxis
                    dataKey="session"
                    stroke="rgba(255, 255, 255, 0.3)"
                    style={{ fontSize: '12px', fill: '#9CA3AF' }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="rgba(255, 255, 255, 0.3)"
                    style={{ fontSize: '12px', fill: '#9CA3AF' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171717',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Skill Performance */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
          <h2 className="text-xl font-medium text-white mb-6">Skill Performance</h2>
          {skillPerformance.length > 0 ? (
            <div className="space-y-4">
              {skillPerformance.slice(0, 10).map((skill, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white">Skill {idx + 1}</span>
                    <span className="text-neutral-400">
                      {skill.correct}/{skill.attempts} ({skill.accuracy.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      style={{ width: `${skill.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-400">
              No practice data yet. Start a practice session to see your performance!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}