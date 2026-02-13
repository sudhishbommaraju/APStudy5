import { base44 } from '@/api/base44Client';

/**
 * Adaptive Difficulty Engine
 * Dynamically adjusts question difficulty based on real-time performance
 */

export class AdaptiveDifficultyEngine {
  constructor(userEmail) {
    this.userEmail = userEmail;
    this.sessionPerformance = [];
    this.currentDifficulty = 'medium';
  }

  /**
   * Analyze recent session performance and determine next difficulty
   */
  async getNextDifficulty(currentQuestionIndex, totalQuestions) {
    // Analyze last 3-5 questions
    const recentWindow = Math.min(5, currentQuestionIndex);
    const recentAnswers = this.sessionPerformance.slice(-recentWindow);
    
    if (recentAnswers.length < 2) return this.currentDifficulty;

    const recentAccuracy = recentAnswers.filter(a => a.isCorrect).length / recentAnswers.length;

    // Fetch historical performance for this skill
    const attempts = await base44.entities.Attempt.filter({ 
      created_by: this.userEmail 
    });
    const recentAttempts = attempts.slice(0, 20);
    const overallAccuracy = recentAttempts.length > 0 
      ? recentAttempts.filter(a => a.is_correct).length / recentAttempts.length 
      : 0.5;

    // Decision rules for difficulty adjustment
    let newDifficulty = this.currentDifficulty;

    if (recentAccuracy >= 0.8 && overallAccuracy >= 0.7) {
      // Student is performing well - increase difficulty
      newDifficulty = this.increaseDifficulty(this.currentDifficulty);
    } else if (recentAccuracy <= 0.4 || overallAccuracy <= 0.4) {
      // Student is struggling - decrease difficulty
      newDifficulty = this.decreaseDifficulty(this.currentDifficulty);
    }
    // else: maintain current difficulty

    this.currentDifficulty = newDifficulty;
    return newDifficulty;
  }

  increaseDifficulty(current) {
    const levels = ['easy', 'medium', 'hard'];
    const currentIndex = levels.indexOf(current);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : current;
  }

  decreaseDifficulty(current) {
    const levels = ['easy', 'medium', 'hard'];
    const currentIndex = levels.indexOf(current);
    return currentIndex > 0 ? levels[currentIndex - 1] : current;
  }

  /**
   * Record answer for session tracking
   */
  recordAnswer(questionId, skillName, difficulty, isCorrect, timeSpent) {
    this.sessionPerformance.push({
      questionId,
      skillName,
      difficulty,
      isCorrect,
      timeSpent,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get performance insights for current session
   */
  getSessionInsights() {
    if (this.sessionPerformance.length === 0) return null;

    const correctCount = this.sessionPerformance.filter(a => a.isCorrect).length;
    const accuracy = correctCount / this.sessionPerformance.length;

    const avgTimeSpent = this.sessionPerformance.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / this.sessionPerformance.length;

    const skillBreakdown = {};
    this.sessionPerformance.forEach(a => {
      if (!skillBreakdown[a.skillName]) {
        skillBreakdown[a.skillName] = { correct: 0, total: 0 };
      }
      skillBreakdown[a.skillName].total++;
      if (a.isCorrect) skillBreakdown[a.skillName].correct++;
    });

    return {
      totalQuestions: this.sessionPerformance.length,
      correctCount,
      accuracy,
      avgTimeSpent,
      currentDifficulty: this.currentDifficulty,
      skillBreakdown
    };
  }

  /**
   * AI-powered recommendation for next topic based on performance
   */
  async recommendNextTopic(availableSkills) {
    const topicMasteries = await base44.entities.TopicMastery.filter({
      created_by: this.userEmail
    });

    // Find topics with low mastery or due for review
    const weakTopics = topicMasteries
      .filter(t => t.accuracy < 70 || t.mastery_level === 'learning')
      .sort((a, b) => a.accuracy - b.accuracy);

    // Check spaced repetition schedule
    const dueForReview = topicMasteries.filter(t => {
      if (!t.next_review_date) return false;
      return new Date(t.next_review_date) <= new Date();
    });

    if (dueForReview.length > 0) {
      return {
        type: 'spaced_repetition',
        topic: dueForReview[0].topic_name,
        reason: 'Due for review based on spaced repetition'
      };
    }

    if (weakTopics.length > 0) {
      return {
        type: 'weakness',
        topic: weakTopics[0].topic_name,
        reason: `Low accuracy: ${weakTopics[0].accuracy.toFixed(0)}%`
      };
    }

    return null;
  }
}