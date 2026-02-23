import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTier } from '@/components/tierSystem/tierUtils';

export default function LevelUpModal({ level, isOpen, onClose }) {
  const [shouldShow, setShouldShow] = useState(isOpen);

  useEffect(() => {
    setShouldShow(isOpen);
    if (isOpen) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  const tier = getTier(level);

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 20 }}
            transition={{ type: 'spring', damping: 15 }}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 max-w-md text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6 }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>

            <h2 className="text-3xl font-bold text-white mb-2">Level Up!</h2>
            <p className="text-neutral-400 mb-4">
              You are now <span className="text-blue-400 font-semibold">Level {level}</span> —{' '}
              <span className="text-amber-400 font-semibold">{tier}</span> Tier
            </p>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}