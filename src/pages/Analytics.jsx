import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PerformanceAnalyticsDashboard from '@/components/analytics/PerformanceAnalyticsDashboard';
import GoalTracker from '@/components/goals/GoalTracker';

export default function Analytics() {
  const navigate = useNavigate();
  const [examType, setExamType] = useState('SAT');

  return (
    <div className="min-h-screen bg-black py-16">
      <div className="max-w-7xl mx-auto px-6">
        <button
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-light text-white mb-2">Performance Analytics</h1>
          <p className="text-neutral-400">Track your progress and achieve your goals</p>
        </div>

        <Tabs defaultValue="performance" className="space-y-8">
          <TabsList className="bg-neutral-900 border border-neutral-800">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-6">
            <div className="flex gap-4 mb-6">
              {['SAT', 'ACT', 'AP'].map((type) => (
                <button
                  key={type}
                  onClick={() => setExamType(type)}
                  className={`px-6 py-2 rounded-lg transition-all ${
                    examType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <PerformanceAnalyticsDashboard examType={examType} />
          </TabsContent>

          <TabsContent value="goals">
            <GoalTracker examType={examType} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}