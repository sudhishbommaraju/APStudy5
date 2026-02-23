import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function TierProgressBar() {
  const [xpData, setXpData] = useState({ current: 0, max: 50 });

  useEffect(() => {
    // Mock data - replace with actual user XP from context
    setXpData({ current: 12, max: 50 });
  }, []);

  const percentage = (xpData.current / xpData.max) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mb-6"
    >
      <div className="flex justify-between items-center mb-2">
        <p className="text-xs font-semibold text-neutral-400 uppercase">Level Progress</p>
        <p className="text-xs text-neutral-500">{xpData.current} / {xpData.max} XP</p>
      </div>
      <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
        />
      </div>
    </motion.div>
  );
}