import React from 'react';
import { motion } from 'framer-motion';

export default function Results() {
  return (
    <div className="min-h-screen bg-[#0C0C0C] flex items-center justify-center" style={{ paddingTop: '120px' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 style={{ 
          color: '#F3F4F6',
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: '60px',
          fontWeight: '400',
          lineHeight: '1.05',
          letterSpacing: '-0.02em',
          marginBottom: '24px'
        }}>
          Results
        </h1>
        <p style={{ 
          color: '#9CA3AF',
          fontFamily: 'Inter, sans-serif',
          fontSize: '18px',
          fontWeight: '400',
          lineHeight: '1.6'
        }}>
          Performance analysis coming soon.
        </p>
      </motion.div>
    </div>
  );
}