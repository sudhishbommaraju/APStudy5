import React from 'react';
import { motion } from 'framer-motion';

export default function GlowingCard({ children, className = '' }) {
  return (
    <motion.div
      whileHover={{ boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)' }}
      transition={{ duration: 0.3 }}
      className={`transition-all duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );
}