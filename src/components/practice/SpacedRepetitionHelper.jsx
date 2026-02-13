import { base44 } from '@/api/base44Client';

/**
 * Spaced Repetition System
 * Implements SuperMemo SM-2 algorithm for optimal review scheduling
 */

export class SpacedRepetitionHelper {
  /**
   * Update mastery and calculate next review date after practice
   */
  static async updateTopicMastery(userEmail, skillName, subjectId, isCorrect, difficulty) {
    // Find or create topic mastery record
    const existing = await base44.entities.TopicMastery.filter({
      created_by: userEmail,
      topic_name: skillName,
      exam_type: subjectId
    });

    let mastery;
    if (existing.length > 0) {
      mastery = existing[0];
    } else {
      // Create new mastery record
      mastery = await base44.entities.TopicMastery.create({
        exam_type: subjectId,
        section: 'general',
        topic_name: skillName,
        attempts: 0,
        correct: 0,
        accuracy: 0,
        mastery_level: 'learning',
        difficulty_progression: 1
      });
    }

    // Update statistics
    const newAttempts = (mastery.attempts || 0) + 1;
    const newCorrect = (mastery.correct || 0) + (isCorrect ? 1 : 0);
    const newAccuracy = (newCorrect / newAttempts) * 100;

    // Calculate mastery level
    let masteryLevel = 'learning';
    if (newAccuracy >= 90 && newAttempts >= 5) masteryLevel = 'mastered';
    else if (newAccuracy >= 75 && newAttempts >= 3) masteryLevel = 'proficient';
    else if (newAccuracy >= 60) masteryLevel = 'practicing';

    // Calculate next review date using SM-2 algorithm
    const nextReview = this.calculateNextReview(mastery, isCorrect);
    
    // Adjust difficulty progression
    let difficultyProgression = mastery.difficulty_progression || 1;
    if (isCorrect && newAccuracy >= 80) {
      difficultyProgression = Math.min(3, difficultyProgression + 0.5);
    } else if (!isCorrect) {
      difficultyProgression = Math.max(1, difficultyProgression - 0.5);
    }

    // Update mastery record
    await base44.entities.TopicMastery.update(mastery.id, {
      attempts: newAttempts,
      correct: newCorrect,
      accuracy: newAccuracy,
      mastery_level: masteryLevel,
      last_practiced: new Date().toISOString(),
      next_review_date: nextReview,
      difficulty_progression: difficultyProgression
    });

    return {
      masteryLevel,
      accuracy: newAccuracy,
      nextReviewDate: nextReview,
      needsReview: masteryLevel === 'learning' || newAccuracy < 70
    };
  }

  /**
   * SM-2 Algorithm for spaced repetition
   */
  static calculateNextReview(mastery, isCorrect) {
    const now = new Date();
    
    // Base intervals (in days)
    let interval = 1;
    
    if (isCorrect) {
      const previousInterval = mastery.next_review_date 
        ? Math.floor((new Date(mastery.next_review_date) - new Date(mastery.last_practiced)) / (1000 * 60 * 60 * 24))
        : 1;
      
      // Successful recall: increase interval
      if (mastery.mastery_level === 'learning') {
        interval = 1; // Review tomorrow
      } else if (mastery.mastery_level === 'practicing') {
        interval = Math.max(3, previousInterval * 1.5);
      } else if (mastery.mastery_level === 'proficient') {
        interval = Math.max(7, previousInterval * 2);
      } else if (mastery.mastery_level === 'mastered') {
        interval = Math.max(14, previousInterval * 2.5);
      }
    } else {
      // Failed recall: reset to short interval
      interval = 1;
    }

    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + Math.floor(interval));
    return nextReview.toISOString().split('T')[0];
  }

  /**
   * Get topics due for review today
   */
  static async getDueTopics(userEmail) {
    const allMasteries = await base44.entities.TopicMastery.filter({
      created_by: userEmail
    });

    const today = new Date().toISOString().split('T')[0];
    
    const due = allMasteries.filter(m => {
      if (!m.next_review_date) return true; // Never reviewed
      return m.next_review_date <= today;
    });

    return due.sort((a, b) => {
      // Prioritize: learning > practicing > proficient > mastered
      const priority = { learning: 4, practicing: 3, proficient: 2, mastered: 1 };
      return (priority[b.mastery_level] || 0) - (priority[a.mastery_level] || 0);
    });
  }

  /**
   * Get recommended study topics based on mastery and spaced repetition
   */
  static async getRecommendedTopics(userEmail, limit = 5) {
    const dueTopics = await this.getDueTopics(userEmail);
    
    // Combine due topics with weak topics
    const allMasteries = await base44.entities.TopicMastery.filter({
      created_by: userEmail
    });

    const weakTopics = allMasteries
      .filter(m => m.accuracy < 70 || m.mastery_level === 'learning')
      .sort((a, b) => a.accuracy - b.accuracy);

    // Merge and deduplicate
    const recommended = [...dueTopics];
    for (const weak of weakTopics) {
      if (!recommended.find(r => r.topic_name === weak.topic_name)) {
        recommended.push(weak);
      }
    }

    return recommended.slice(0, limit);
  }
}