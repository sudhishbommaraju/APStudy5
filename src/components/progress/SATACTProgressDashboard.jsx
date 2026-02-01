import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, Target, Award, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SATACTProgressDashboard({ examType, section, userEmail }) {
  const { data: topicMasteries = [] } = useQuery({
    queryKey: ['topicMastery', examType, section, userEmail],
    queryFn: () => base44.entities.TopicMastery.filter({
      exam_type: examType,
      section,
      created_by: userEmail
    }),
    enabled: !!userEmail
  });

  const masteryColors = {
    learning: { bg: '#FEE2E2', text: '#000000', icon: '#DC2626' },
    practicing: { bg: '#FEF3C7', text: '#000000', icon: '#D97706' },
    proficient: { bg: '#DBEAFE', text: '#000000', icon: '#1E3A8A' },
    mastered: { bg: '#DCFCE7', text: '#000000', icon: '#16A34A' }
  };

  const overallAccuracy = topicMasteries.length > 0
    ? (topicMasteries.reduce((sum, t) => sum + t.accuracy, 0) / topicMasteries.length).toFixed(1)
    : 0;

  const masteredCount = topicMasteries.filter(t => t.mastery_level === 'mastered').length;
  const needsWorkTopics = topicMasteries
    .filter(t => t.accuracy < 70)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5);

  return (
    <div className="space-y-6 smooth-transition">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#CBD5E1] p-6 card-smooth">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
              <Target className="w-5 h-5 text-[#1E3A8A]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#000000]">{overallAccuracy}%</div>
              <div className="text-sm text-[#404040]">Overall Accuracy</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#CBD5E1] p-6 card-smooth">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#DCFCE7] flex items-center justify-center">
              <Award className="w-5 h-5 text-[#16A34A]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#000000]">{masteredCount}</div>
              <div className="text-sm text-[#404040]">Topics Mastered</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#CBD5E1] p-6 card-smooth">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#000000]">{topicMasteries.length}</div>
              <div className="text-sm text-[#404040]">Topics Attempted</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mastery Breakdown */}
      <div className="bg-white rounded-xl border border-[#CBD5E1] p-6">
        <h3 className="text-lg font-semibold text-[#000000] mb-4">Mastery by Topic</h3>
        <div className="space-y-3">
          {topicMasteries.length === 0 ? (
            <div className="text-center py-8 text-[#404040]">
              No practice data yet. Start practicing to see your progress!
            </div>
          ) : (
            topicMasteries.map((topic) => {
              const colors = masteryColors[topic.mastery_level];
              return (
                <div key={topic.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#F8FAFC] card-smooth">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-[#000000]">{topic.topic_name}</span>
                      <span 
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: colors.bg, color: colors.text }}
                      >
                        {topic.mastery_level}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#404040]">
                      <span>{topic.attempts} attempts</span>
                      <span>{topic.correct} correct</span>
                      <span className="font-semibold text-[#000000]">{topic.accuracy}%</span>
                    </div>
                  </div>
                  <div className="w-24 h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-500"
                      style={{ 
                        width: `${topic.accuracy}%`,
                        backgroundColor: colors.icon
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Needs Work Section */}
      {needsWorkTopics.length > 0 && (
        <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-[#D97706]" />
            <h3 className="text-lg font-semibold text-[#000000]">Focus Areas</h3>
          </div>
          <div className="space-y-2">
            {needsWorkTopics.map((topic) => (
              <div key={topic.id} className="flex items-center justify-between text-sm">
                <span className="text-[#000000] font-medium">{topic.topic_name}</span>
                <span className="text-[#000000]">{topic.accuracy}% accuracy</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}