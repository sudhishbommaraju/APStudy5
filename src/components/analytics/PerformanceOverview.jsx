import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Target, Zap } from 'lucide-react';

export default function PerformanceOverview({ data }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const metrics = [
    {
      icon: Target,
      label: 'Overall Accuracy',
      value: data.overallAccuracy,
      unit: '%',
      color: 'text-blue-500'
    },
    {
      icon: Zap,
      label: 'Avg Response Time',
      value: data.avgResponseTime,
      unit: 's',
      color: 'text-amber-500'
    },
    {
      icon: TrendingUp,
      label: 'Total Sessions',
      value: data.totalSessions,
      unit: '',
      color: 'text-green-500'
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-neutral-400 text-sm font-medium">{metric.label}</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {metric.value}{metric.unit}
                  </p>
                </div>
                <Icon className={`w-8 h-8 ${metric.color}`} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Accuracy Trend */}
      <motion.div
        variants={itemVariants}
        className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Accuracy Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.accuracyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
              formatter={(value) => `${value}%`}
            />
            <Line 
              type="monotone" 
              dataKey="accuracy" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Session Completion Rate */}
      <motion.div
        variants={itemVariants}
        className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Session Completion</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.completionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  formatter={(value) => `${value}%`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col justify-center space-y-4">
            <div>
              <p className="text-neutral-400 text-sm">Completed</p>
              <p className="text-2xl font-bold text-green-500">{data.completionData[0]?.value}%</p>
            </div>
            <div>
              <p className="text-neutral-400 text-sm">In Progress</p>
              <p className="text-2xl font-bold text-red-500">{data.completionData[1]?.value}%</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}