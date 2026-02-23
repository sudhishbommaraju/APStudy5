import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Clock, Lightbulb, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdaptivePracticeModes({ onSelectMode, weakAreas, analysis }) {
  const modes = [
    {
      id: 'weak_areas',
      icon: Target,
      title: 'Target Weak Areas',
      description: 'Focus on your lowest-performing skills',
      color: 'bg-red-500/20 border-red-500/50',
      badgeColor: 'bg-red-600',
      badge: 'Recommended'
    },
    {
      id: 'timed_challenge',
      icon: Clock,
      title: 'Timed Challenge',
      description: 'Improve speed and accuracy under pressure',
      color: 'bg-amber-500/20 border-amber-500/50',
      badgeColor: 'bg-amber-600',
      badge: 'Speed'
    },
    {
      id: 'concept_mastery',
      icon: Lightbulb,
      title: 'Concept Mastery',
      description: 'Deep dive into specific topics',
      color: 'bg-blue-500/20 border-blue-500/50',
      badgeColor: 'bg-blue-600',
      badge: 'Depth'
    },
    {
      id: 'adaptive_difficulty',
      icon: Zap,
      title: 'Adaptive Difficulty',
      description: 'AI adjusts difficulty based on performance',
      color: 'bg-purple-500/20 border-purple-500/50',
      badgeColor: 'bg-purple-600',
      badge: 'Smart'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold text-white">Select Practice Mode</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modes.map((mode, idx) => {
          const Icon = mode.icon;
          const isRecommended = weakAreas && weakAreas.length > 0 && mode.id === 'weak_areas';
          
          return (
            <motion.button
              key={mode.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => onSelectMode(mode.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left relative overflow-hidden ${mode.color} hover:shadow-lg`}
            >
              {isRecommended && (
                <span className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded ${mode.badgeColor} text-white`}>
                  {mode.badge}
                </span>
              )}
              <div className="flex items-start gap-3">
                <Icon className="w-6 h-6 text-neutral-300 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-white mb-1">{mode.title}</h4>
                  <p className="text-sm text-neutral-300">{mode.description}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}