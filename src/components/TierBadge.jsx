import React from 'react';
import { useUserProfile } from '@/components/tierSystem/UserProfileContext';
import { motion } from 'framer-motion';

export default function TierBadge() {
  const { tier, level } = useUserProfile();

  const tierColors = {
    Beginner: { bg: 'bg-blue-600/20', border: 'border-blue-500/40', text: 'text-blue-400' },
    Scholar: { bg: 'bg-purple-600/20', border: 'border-purple-500/40', text: 'text-purple-400' },
    Master: { bg: 'bg-amber-600/20', border: 'border-amber-500/40', text: 'text-amber-400' },
    Elite: { bg: 'bg-red-600/20', border: 'border-red-500/40', text: 'text-red-400' },
    Legend: { bg: 'bg-pink-600/20', border: 'border-pink-500/40', text: 'text-pink-400' }
  };

  const colors = tierColors[tier] || tierColors.Beginner;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${colors.bg} border ${colors.border}`}
    >
      <span className={`text-xs font-medium ${colors.text}`}>
        {tier} • Level {level}
      </span>
    </motion.div>
  );
}