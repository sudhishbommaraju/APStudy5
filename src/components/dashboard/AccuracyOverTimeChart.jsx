import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function AccuracyOverTimeChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
        Complete some questions to see your progress over time
      </div>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickFormatter={(v) => `${v}%`}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            formatter={(value) => [`${value.toFixed(0)}%`, 'Accuracy']}
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{
              background: '#1e293b',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '12px'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="accuracy" 
            stroke="#3b82f6" 
            strokeWidth={2}
            fill="url(#accuracyGradient)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}