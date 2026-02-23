import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookmarkPlus, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function DashboardStudyPlan({ examType, analyticsData }) {
  const navigate = useNavigate();
  const [focusAreas, setFocusAreas] = useState([]);

  useEffect(() => {
    if (analyticsData?.skillPerformance) {
      const weak = analyticsData.skillPerformance
        .filter(s => s.accuracy < 70)
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 3);
      setFocusAreas(weak);
    }
  }, [analyticsData]);

  if (focusAreas.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-6 mt-8"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <BookmarkPlus className="w-6 h-6 text-purple-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">Recommended Study Plan</h3>
            <p className="text-sm text-neutral-400">Based on your performance</p>
          </div>
        </div>
        <Button
          onClick={() => navigate(createPageUrl('StudyPlans'))}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700"
        >
          Customize Plan
        </Button>
      </div>

      <div className="space-y-3">
        {focusAreas.map((area, idx) => (
          <div
            key={idx}
            className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-3 flex items-start gap-3"
          >
            <Target className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{area.name}</p>
              <p className="text-xs text-neutral-400">{area.accuracy.toFixed(1)}% accuracy</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-500">Priority</p>
              <p className="text-sm font-semibold text-red-400">High</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-neutral-500 mt-4">
        💡 Focus on these weak areas first, then practice timed drills to improve speed
      </p>
    </motion.div>
  );
}