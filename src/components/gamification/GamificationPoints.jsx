import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const POINTS_CONFIG = {
  correct_answer: 10,
  incorrect_answer: 0,
  session_completion: 50,
  perfect_accuracy: 100,
  streak_bonus: 25,
};

export default function GamificationPoints({ user, onPointsChange }) {
  const [points, setPoints] = useState(0);
  const [badges, setBadges] = useState([]);
  const [showPointsPopup, setShowPointsPopup] = useState(false);
  const [pointsGained, setPointsGained] = useState(0);

  useEffect(() => {
    loadUserStats();
  }, [user]);

  const loadUserStats = async () => {
    try {
      if (user?.total_points) {
        setPoints(user.total_points);
      }
      if (user?.badges) {
        setBadges(user.badges);
      }
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const awardPoints = async (type, amount = POINTS_CONFIG[type]) => {
    try {
      const newTotal = points + amount;
      setPointsGained(amount);
      setShowPointsPopup(true);
      setPoints(newTotal);

      // Update user
      await base44.auth.updateMe({
        total_points: newTotal
      });

      if (onPointsChange) {
        onPointsChange(newTotal);
      }

      setTimeout(() => setShowPointsPopup(false), 2000);
    } catch (error) {
      console.error('Failed to award points:', error);
    }
  };

  const checkAndAwardBadges = async (accuracy, sessionCount) => {
    const newBadges = [...badges];

    // High Accuracy Badge
    if (accuracy >= 90 && !badges.includes('HIGH_ACCURACY')) {
      newBadges.push('HIGH_ACCURACY');
    }

    // Perfect Score Badge
    if (accuracy === 100 && !badges.includes('PERFECT_SCORE')) {
      newBadges.push('PERFECT_SCORE');
    }

    // Consistent Learner Badge
    if (sessionCount >= 10 && !badges.includes('CONSISTENT_LEARNER')) {
      newBadges.push('CONSISTENT_LEARNER');
    }

    if (newBadges.length > badges.length) {
      setBadges(newBadges);
      await base44.auth.updateMe({ badges: newBadges });
    }
  };

  const getBadgeInfo = (badgeId) => {
    const badgeMap = {
      HIGH_ACCURACY: { name: 'High Achiever', icon: '🎯', color: 'bg-amber-500' },
      PERFECT_SCORE: { name: 'Perfect Score', icon: '⭐', color: 'bg-yellow-500' },
      CONSISTENT_LEARNER: { name: 'Consistent Learner', icon: '🔥', color: 'bg-red-500' },
    };
    return badgeMap[badgeId] || { name: 'Unknown', icon: '?', color: 'bg-gray-500' };
  };

  return (
    <div className="space-y-4">
      {/* Points Display */}
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex items-center justify-between"
      >
        <div>
          <p className="text-neutral-400 text-sm">Total Points</p>
          <p className="text-3xl font-bold text-blue-400">{points}</p>
        </div>
        <Sparkles className="w-8 h-8 text-blue-500" />
      </motion.div>

      {/* Badges Display */}
      {badges.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <p className="text-neutral-400 text-sm mb-3">Badges Earned</p>
          <div className="flex gap-2 flex-wrap">
            {badges.map((badgeId) => {
              const badge = getBadgeInfo(badgeId);
              return (
                <motion.div
                  key={badgeId}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`${badge.color} rounded-full p-3 text-white text-sm font-semibold`}
                  title={badge.name}
                >
                  {badge.icon}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Points Popup */}
      <AnimatePresence>
        {showPointsPopup && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 right-8 bg-green-500 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 z-50"
          >
            <Sparkles className="w-5 h-5" />
            +{pointsGained} points!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}