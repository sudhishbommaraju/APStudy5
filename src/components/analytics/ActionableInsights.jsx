import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function ActionableInsights({ data }) {
  const navigate = useNavigate();

  const getInsights = () => {
    const insights = [];

    // Accuracy-based insights
    if (data.overallAccuracy < 50) {
      insights.push({
        type: 'warning',
        icon: AlertCircle,
        title: 'Struggling with Fundamentals',
        message: 'Your accuracy is below 50%. Consider reviewing core concepts before taking more tests.',
        action: 'Review Notes',
        actionColor: 'bg-red-600 hover:bg-red-700'
      });
    } else if (data.overallAccuracy < 70) {
      insights.push({
        type: 'info',
        icon: Lightbulb,
        title: 'Room for Improvement',
        message: 'Focus on your weak areas to increase accuracy. Target weak topics in your next session.',
        action: 'Practice Weak Areas',
        actionColor: 'bg-amber-600 hover:bg-amber-700'
      });
    } else if (data.overallAccuracy >= 85) {
      insights.push({
        type: 'success',
        icon: CheckCircle,
        title: 'Excellent Progress!',
        message: 'Your accuracy is excellent! Try more challenging questions to push your limits.',
        action: 'Challenge Mode',
        actionColor: 'bg-green-600 hover:bg-green-700'
      });
    }

    // Volume-based insights
    if (data.totalSessions < 5) {
      insights.push({
        type: 'info',
        icon: Zap,
        title: 'Build Your Habit',
        message: `You've completed ${data.totalSessions} session(s). Aim for consistent practice to see rapid improvement.`,
        action: 'Start Practice',
        actionColor: 'bg-blue-600 hover:bg-blue-700'
      });
    }

    // Response time insights
    if (data.avgResponseTime > 30) {
      insights.push({
        type: 'warning',
        icon: AlertCircle,
        title: 'Improve Your Speed',
        message: 'Your average response time is high. Practice timed drills to increase speed without sacrificing accuracy.',
        action: 'Timed Practice',
        actionColor: 'bg-red-600 hover:bg-red-700'
      });
    } else if (data.avgResponseTime < 10) {
      insights.push({
        type: 'success',
        icon: CheckCircle,
        title: 'Impressive Speed!',
        message: 'You\'re answering questions quickly. Great work!',
        action: null,
        actionColor: ''
      });
    }

    return insights;
  };

  const insights = getInsights();

  const getIconColor = (type) => {
    switch (type) {
      case 'warning':
        return 'text-red-500';
      case 'success':
        return 'text-green-500';
      case 'info':
      default:
        return 'text-blue-500';
    }
  };

  const getBackgroundColor = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-red-500/10 border-red-500/20';
      case 'success':
        return 'bg-green-500/10 border-green-500/20';
      case 'info':
      default:
        return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2 mb-6">
        <Lightbulb className="w-6 h-6 text-yellow-500" />
        <h2 className="text-2xl font-semibold text-white">Actionable Insights</h2>
      </div>

      {insights.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, idx) => {
            const Icon = insight.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`border rounded-2xl p-6 ${getBackgroundColor(insight.type)}`}
              >
                <div className="flex items-start gap-4">
                  <Icon className={`w-6 h-6 mt-1 flex-shrink-0 ${getIconColor(insight.type)}`} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">{insight.title}</h3>
                    <p className="text-neutral-300 text-sm mb-4">{insight.message}</p>
                    {insight.action && (
                      <Button
                        size="sm"
                        className={`${insight.actionColor} text-white border-0`}
                        onClick={() => {
                          if (insight.action === 'Start Practice') {
                            navigate(createPageUrl('APPractice'));
                          } else if (insight.action === 'Practice Weak Areas') {
                            navigate(createPageUrl('Dashboard'));
                          }
                        }}
                      >
                        {insight.action}
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center">
          <p className="text-neutral-400">No specific insights yet. Complete more practice sessions to get personalized recommendations.</p>
        </div>
      )}
    </motion.div>
  );
}