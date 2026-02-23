import React from 'react';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { getTier, TIER_PERKS, getXPToNextLevel } from '@/lib/tierSystem';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import { AuroraBackground } from '@/components/ui/animated-background';

export default function TierPage() {
  const navigate = useNavigate();
  const { profile, xp, level, tier, getProgress } = useUserProfile();
  const progress = getProgress();
  const xpToNext = getXPToNextLevel(xp, level);

  const tierOrder = ['Beginner', 'Scholar', 'Master', 'Elite', 'Legend'];
  const currentTierIndex = tierOrder.indexOf(tier);

  return (
    <ProtectedRoute>
      <AuroraBackground>
        <DashboardNavbar />
        <div className="min-h-screen py-16">
          <div className="max-w-4xl mx-auto px-6">
            <button
              onClick={() => navigate(createPageUrl('Dashboard'))}
              className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl font-light text-white mb-2">Proofly Progress</h1>
              <p className="text-neutral-400">Your Journey to Mastery</p>
            </motion.div>

            {/* Current Progress Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 mb-8"
            >
              <div className="grid md:grid-cols-3 gap-6">
                {/* Tier Display */}
                <div className="text-center">
                  <div className="text-6xl mb-3 font-light text-white">{level}</div>
                  <div className="text-sm text-neutral-400 mb-2">Current Level</div>
                  <div className="inline-block px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 text-xs font-medium">
                    {tier}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="md:col-span-2">
                  <div className="mb-4">
                    <h3 className="text-white font-medium mb-2">XP Progress</h3>
                    <div className="w-full bg-neutral-800 rounded-full h-4 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress?.percentage || 0}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">{progress?.current || 0} / {progress?.required || 0} XP</span>
                    <span className="text-neutral-300 font-medium">{xpToNext} XP until next level</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Tier Progression */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 mb-8"
            >
              <h2 className="text-xl font-medium text-white mb-6">Tier Progression</h2>
              <div className="space-y-4">
                {tierOrder.map((tierName, idx) => {
                  const isUnlocked = idx <= currentTierIndex;
                  const isCurrent = tierName === tier;

                  return (
                    <motion.div
                      key={tierName}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className={`p-4 rounded-lg border transition-all ${
                        isCurrent
                          ? 'bg-blue-600/20 border-blue-500/40'
                          : isUnlocked
                          ? 'bg-neutral-800/50 border-neutral-700'
                          : 'bg-neutral-800/20 border-neutral-700/30 opacity-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {isCurrent && <Star className="w-5 h-5 text-blue-400" />}
                          {!isUnlocked && <Lock className="w-5 h-5 text-neutral-600" />}
                          <div>
                            <h3 className="text-white font-medium">{tierName}</h3>
                            <p className="text-xs text-neutral-400">
                              {isUnlocked ? 'Unlocked' : 'Locked'}
                            </p>
                          </div>
                        </div>
                        {isCurrent && <div className="text-xs text-blue-400 font-medium">Current</div>}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Tier Perks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8"
            >
              <h2 className="text-xl font-medium text-white mb-6">Your Perks</h2>
              <div className="space-y-3">
                {TIER_PERKS[tier].map((perk, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-neutral-800/30"
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-neutral-300">{perk}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </AuroraBackground>
    </ProtectedRoute>
  );
}