import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { SpacedRepetitionEngine } from '@/components/flashcards/SpacedRepetitionEngine';

/**
 * Tracks and updates topic mastery with spaced repetition
 */
export function useSATACTSpacedRepetition(examType, section, userEmail) {
  const queryClient = useQueryClient();

  const { data: topicMasteries = [] } = useQuery({
    queryKey: ['topicMastery', examType, section, userEmail],
    queryFn: () => base44.entities.TopicMastery.filter({
      exam_type: examType,
      section,
      created_by: userEmail
    }),
    enabled: !!userEmail
  });

  const updateMasteryMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TopicMastery.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topicMastery'] });
    },
  });

  const createMasteryMutation = useMutation({
    mutationFn: (data) => base44.entities.TopicMastery.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topicMastery'] });
    },
  });

  /**
   * Record a question attempt and update mastery
   */
  const recordAttempt = async (topicName, isCorrect, difficulty = 'medium') => {
    const existing = topicMasteries.find(t => t.topic_name === topicName);
    
    if (existing) {
      const newAttempts = existing.attempts + 1;
      const newCorrect = existing.correct + (isCorrect ? 1 : 0);
      const newAccuracy = (newCorrect / newAttempts) * 100;
      const masteryLevel = SpacedRepetitionEngine.calculateMasteryLevel(newAccuracy, newAttempts);
      
      // Calculate next review date based on performance
      const quality = isCorrect ? (difficulty === 'hard' ? 5 : 4) : 2;
      const srData = SpacedRepetitionEngine.calculateNextReview(
        quality,
        existing.repetitions || 0,
        existing.ease_factor || 2.5,
        existing.interval_days || 1
      );

      await updateMasteryMutation.mutateAsync({
        id: existing.id,
        data: {
          attempts: newAttempts,
          correct: newCorrect,
          accuracy: newAccuracy,
          mastery_level: masteryLevel,
          last_practiced: new Date().toISOString(),
          next_review_date: srData.nextReviewDate,
          difficulty_progression: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        }
      });
    } else {
      // Create new mastery record
      const masteryLevel = isCorrect ? 'learning' : 'learning';
      const srData = SpacedRepetitionEngine.calculateNextReview(
        isCorrect ? 4 : 2,
        0,
        2.5,
        1
      );

      await createMasteryMutation.mutateAsync({
        exam_type: examType,
        section,
        topic_name: topicName,
        attempts: 1,
        correct: isCorrect ? 1 : 0,
        accuracy: isCorrect ? 100 : 0,
        mastery_level: masteryLevel,
        last_practiced: new Date().toISOString(),
        next_review_date: srData.nextReviewDate,
        difficulty_progression: 1,
      });
    }
  };

  /**
   * Get topics due for review today
   */
  const getTopicsDueForReview = () => {
    const today = new Date().toISOString().split('T')[0];
    return topicMasteries.filter(topic => {
      if (!topic.next_review_date) return false;
      return topic.next_review_date <= today;
    });
  };

  /**
   * Get weakest topics that need practice
   */
  const getWeakTopics = (limit = 5) => {
    return topicMasteries
      .filter(t => t.attempts >= 3 && t.accuracy < 70)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, limit);
  };

  return {
    topicMasteries,
    recordAttempt,
    getTopicsDueForReview,
    getWeakTopics,
  };
}