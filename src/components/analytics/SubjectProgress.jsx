import React from 'react';
import { motion } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function SubjectProgress({ subjectData, timeSeriesData }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Subject Radar Chart */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Subject Mastery Overview</h3>
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={subjectData}>
            <PolarGrid stroke="#333" />
            <PolarAngleAxis dataKey="subject" stroke="#888" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#888" />
            <Radar 
              name="Accuracy %" 
              dataKey="accuracy" 
              stroke="#3b82f6" 
              fill="#3b82f6" 
              fillOpacity={0.6}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
              formatter={(value) => `${value.toFixed(1)}%`}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Progress Over Time */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Progress Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={timeSeriesData}>
            <defs>
              <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
              formatter={(value) => `${value.toFixed(1)}%`}
            />
            <Area 
              type="monotone" 
              dataKey="accuracy" 
              stroke="#3b82f6" 
              fillOpacity={1} 
              fill="url(#colorAccuracy)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Subject Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjectData.map((subject, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-4"
          >
            <p className="text-neutral-400 text-sm font-medium mb-2">{subject.subject}</p>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold text-white">{subject.accuracy.toFixed(1)}%</p>
              <p className="text-xs text-neutral-500">{subject.attempts} attempts</p>
            </div>
            <div className="w-full bg-neutral-800 rounded-full h-2 mt-3">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${subject.accuracy}%` }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}