import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StrengthWeaknessAnalysis({ skillPerformance }) {
  const [sortBy, setSortBy] = useState('accuracy');

  const sortedSkills = [...skillPerformance].sort((a, b) => {
    if (sortBy === 'accuracy') {
      return b.accuracy - a.accuracy;
    } else if (sortBy === 'attempts') {
      return b.attempts - a.attempts;
    }
    return 0;
  });

  const topStrengths = sortedSkills.filter(s => s.accuracy >= 75).slice(0, 5);
  const areasForImprovement = sortedSkills.filter(s => s.accuracy < 75).slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Skill Performance Chart */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Skill Performance by Accuracy</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={sortedSkills}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="name" stroke="#888" angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#888" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
              formatter={(value) => `${value.toFixed(1)}%`}
            />
            <Bar 
              dataKey="accuracy" 
              fill="#3b82f6"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Strengths */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-white">Top Strengths</h3>
          </div>
          <div className="space-y-3">
            {topStrengths.length > 0 ? (
              topStrengths.map((skill, idx) => (
                <div key={idx} className="bg-neutral-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-white font-medium">{skill.name}</p>
                    <span className="bg-green-500/20 text-green-400 text-xs font-semibold px-2 py-1 rounded">
                      {skill.accuracy.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>{skill.correct}/{skill.attempts} correct</span>
                    <div className="w-24 bg-neutral-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${skill.accuracy}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-neutral-400 text-sm">No strong areas yet. Keep practicing!</p>
            )}
          </div>
        </motion.div>

        {/* Areas for Improvement */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-white">Areas for Improvement</h3>
          </div>
          <div className="space-y-3">
            {areasForImprovement.length > 0 ? (
              areasForImprovement.map((skill, idx) => (
                <div key={idx} className="bg-neutral-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-white font-medium">{skill.name}</p>
                    <span className="bg-red-500/20 text-red-400 text-xs font-semibold px-2 py-1 rounded">
                      {skill.accuracy.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>{skill.correct}/{skill.attempts} correct</span>
                    <div className="w-24 bg-neutral-700 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${skill.accuracy}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-neutral-400 text-sm">Great job! No weak areas detected.</p>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}