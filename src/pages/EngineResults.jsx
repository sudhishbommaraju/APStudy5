import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Target, Clock, BarChart } from 'lucide-react';

export default function EngineResults() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session');

  const [session, setSession] = useState(null);
  const [responses, setResponses] = useState([]);
  const [skillBreakdown, setSkillBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [sessionId]);

  async function loadResults() {
    const sessionData = await base44.entities.EnginePracticeSession.list();
    const current = sessionData.find(s => s.id === sessionId);
    setSession(current);

    const sessionResponses = await base44.entities.EnginePracticeResponse.filter({
      session_id: sessionId
    });
    setResponses(sessionResponses);

    // Calculate skill breakdown
    const questions = await base44.entities.ProoflyQuestion.list();
    const skills = await base44.entities.EngineSkill.list();
    
    const skillMap = {};
    for (const response of sessionResponses) {
      const question = questions.find(q => q.id === response.question_id);
      if (question) {
        if (!skillMap[question.skill_id]) {
          const skill = skills.find(s => s.id === question.skill_id);
          skillMap[question.skill_id] = {
            name: skill?.name || 'Unknown',
            attempts: 0,
            correct: 0
          };
        }
        skillMap[question.skill_id].attempts++;
        if (response.is_correct) {
          skillMap[question.skill_id].correct++;
        }
      }
    }

    const breakdown = Object.entries(skillMap).map(([skillId, data]) => ({
      ...data,
      accuracy: (data.correct / data.attempts) * 100
    }));

    setSkillBreakdown(breakdown);
    setLoading(false);
  }

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading results...</div>
      </div>
    );
  }

  const correct = responses.filter(r => r.is_correct).length;
  const total = responses.length;
  const accuracy = (correct / total) * 100;
  const avgTime = responses.reduce((sum, r) => sum + r.response_time_ms, 0) / responses.length;

  return (
    <div className="min-h-screen bg-black py-16">
      <div className="max-w-4xl mx-auto px-6">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="mb-8 text-neutral-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-12 text-center">
          <h1 className="text-4xl font-light text-white mb-4">Practice Complete</h1>
          <p className="text-neutral-400">Here's how you performed</p>
        </div>

        {/* Score Card */}
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-12 mb-8 text-center">
          <div className="text-6xl font-bold text-white mb-4">
            {accuracy.toFixed(0)}%
          </div>
          <div className="text-xl text-neutral-400 mb-8">
            {correct} out of {total} correct
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-neutral-800/50 rounded-xl p-4">
              <div className="text-2xl font-semibold text-white mb-1">{correct}</div>
              <div className="text-sm text-neutral-400">Correct</div>
            </div>
            <div className="bg-neutral-800/50 rounded-xl p-4">
              <div className="text-2xl font-semibold text-white mb-1">{total - correct}</div>
              <div className="text-sm text-neutral-400">Incorrect</div>
            </div>
            <div className="bg-neutral-800/50 rounded-xl p-4">
              <div className="text-2xl font-semibold text-white mb-1">
                {(avgTime / 1000).toFixed(1)}s
              </div>
              <div className="text-sm text-neutral-400">Avg Time</div>
            </div>
          </div>
        </div>

        {/* Skill Breakdown */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-medium text-white mb-6 flex items-center gap-2">
            <BarChart className="w-5 h-5" />
            Skill Breakdown
          </h2>
          <div className="space-y-4">
            {skillBreakdown.map((skill, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white">{skill.name}</span>
                  <span className="text-neutral-400">
                    {skill.correct}/{skill.attempts} ({skill.accuracy.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full"
                    style={{ width: `${skill.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => navigate(createPageUrl('EnginePracticeBuilder'))}
            variant="outline"
            className="py-6"
          >
            New Practice Session
          </Button>
          <Button
            onClick={() => navigate(createPageUrl('EngineAnalytics'))}
            className="bg-white text-black hover:bg-neutral-100 py-6"
          >
            View Full Analytics
          </Button>
        </div>
      </div>
    </div>
  );
}