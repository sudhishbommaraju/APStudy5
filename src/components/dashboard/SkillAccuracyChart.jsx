import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function SkillAccuracyChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
        Complete some questions to see your skill breakdown
      </div>
    );
  }

  const getColor = (accuracy) => {
    if (accuracy >= 80) return '#10b981';
    if (accuracy >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
        >
          <XAxis 
            type="number" 
            domain={[0, 100]} 
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={120}
            tick={{ fontSize: 11, fill: '#475569' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            formatter={(value) => [`${value.toFixed(0)}%`, 'Accuracy']}
            contentStyle={{
              background: '#1e293b',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '12px'
            }}
          />
          <Bar dataKey="accuracy" radius={[0, 4, 4, 0]} maxBarSize={24}>
            {data.map((entry, index) => (
              <Cell key={index} fill={getColor(entry.accuracy)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}