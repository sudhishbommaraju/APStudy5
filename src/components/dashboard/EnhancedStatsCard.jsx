import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function EnhancedStatsCard({ icon: Icon, title, value, subtitle, trend }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      const increment = numValue / 20;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= numValue) {
          setDisplayValue(numValue);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, 30);
      return () => clearInterval(timer);
    }
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(255, 255, 255, 0.1)' }}
      className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 cursor-pointer transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded-lg bg-neutral-800">
          <Icon className="w-5 h-5 text-blue-400" />
        </div>
        {trend && (
          <span className={`text-xs font-semibold ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">
        {displayValue}{typeof value === 'string' && value.includes('%') ? '%' : ''}
      </div>
      <div className="text-xs text-neutral-400">{title}</div>
      {subtitle && <div className="text-xs text-neutral-500 mt-2">{subtitle}</div>}
    </motion.div>
  );
}