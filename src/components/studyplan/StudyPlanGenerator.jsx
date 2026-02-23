import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Lightbulb, Target, Zap, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StudyPlanGenerator({ userEmail, analyticsData }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateStudyPlan = async () => {
    setLoading(true);
    try {
      const weakAreas = analyticsData.skillPerformance
        .filter(s => s.accuracy < 70)
        .slice(0, 5)
        .map(s => s.name)
        .join(', ');

      const strongAreas = analyticsData.skillPerformance
        .filter(s => s.accuracy >= 85)
        .slice(0, 3)
        .map(s => s.name)
        .join(', ');

      const prompt = `Create a personalized study plan for a student with:
- Overall Accuracy: ${analyticsData.overallAccuracy}%
- Weak Areas: ${weakAreas || 'Balanced'}
- Strong Areas: ${strongAreas || 'All areas'}
- Sessions Completed: ${analyticsData.totalSessions}

Provide a JSON object with:
{
  "focus_areas": [{"topic": "...", "priority": "high|medium|low", "recommended_sessions": 5}],
  "practice_modes": ["timed", "untimed", "adaptive"],
  "weekly_goals": [{"goal": "...", "target": "..."}],
  "tips": ["...", "...", "..."]
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            focus_areas: {
              type: 'array',
              items: { type: 'object' }
            },
            practice_modes: { type: 'array', items: { type: 'string' } },
            weekly_goals: { type: 'array', items: { type: 'object' } },
            tips: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      setPlan(response);

      // Save to database
      await base44.entities.StudyPlan.create({
        user_email: userEmail,
        plan_data: response,
        created_at: new Date().toISOString(),
        status: 'active'
      });
    } catch (error) {
      console.error('Failed to generate plan:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!plan) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-8 text-center"
      >
        <Lightbulb className="w-12 h-12 text-purple-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Get Your Personalized Study Plan</h3>
        <p className="text-neutral-300 mb-6">Based on your analytics, we'll create a tailored plan to maximize improvement.</p>
        <Button
          onClick={generateStudyPlan}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Generate Study Plan
            </>
          )}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Focus Areas */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-red-500" />
          Focus Areas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plan.focus_areas?.map((area, idx) => (
            <div
              key={idx}
              className="bg-neutral-900 border border-neutral-800 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-white">{area.topic}</h4>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  area.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                  area.priority === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-green-500/20 text-green-300'
                }`}>
                  {area.priority}
                </span>
              </div>
              <p className="text-xs text-neutral-400">{area.recommended_sessions} sessions recommended</p>
            </div>
          ))}
        </div>
      </div>

      {/* Practice Modes */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          Recommended Practice Modes
        </h3>
        <div className="flex gap-2 flex-wrap">
          {plan.practice_modes?.map((mode, idx) => (
            <span
              key={idx}
              className="bg-amber-500/20 text-amber-300 px-4 py-2 rounded-full text-sm font-medium"
            >
              {mode}
            </span>
          ))}
        </div>
      </div>

      {/* Weekly Goals */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-500" />
          Weekly Goals
        </h3>
        <div className="space-y-2">
          {plan.weekly_goals?.map((goal, idx) => (
            <div key={idx} className="flex items-center gap-3 text-neutral-300">
              <input type="checkbox" className="rounded" />
              <span>{goal.goal}</span>
              <span className="text-neutral-500 text-sm ml-auto">{goal.target}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Pro Tips</h3>
        <ul className="space-y-2">
          {plan.tips?.map((tip, idx) => (
            <li key={idx} className="flex gap-2 text-sm text-neutral-300">
              <span className="text-blue-400 mt-1">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}