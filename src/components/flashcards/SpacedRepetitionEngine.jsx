/**
 * Spaced Repetition Engine using SM-2 algorithm
 * Calculates optimal review intervals based on performance
 */

export class SpacedRepetitionEngine {
  /**
   * Calculate next review date based on SM-2 algorithm
   * @param {number} quality - Quality of response (0-5)
   * @param {number} repetitions - Number of successful reviews
   * @param {number} easeFactor - Current ease factor
   * @param {number} interval - Current interval in days
   */
  static calculateNextReview(quality, repetitions, easeFactor, interval) {
    let newRepetitions = repetitions;
    let newEaseFactor = easeFactor;
    let newInterval = interval;

    if (quality >= 3) {
      // Correct response
      if (newRepetitions === 0) {
        newInterval = 1;
      } else if (newRepetitions === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(interval * easeFactor);
      }
      newRepetitions += 1;
    } else {
      // Incorrect response - reset
      newRepetitions = 0;
      newInterval = 1;
    }

    // Update ease factor
    newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    
    if (newEaseFactor < 1.3) {
      newEaseFactor = 1.3;
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    return {
      repetitions: newRepetitions,
      easeFactor: newEaseFactor,
      interval: newInterval,
      nextReviewDate: nextReviewDate.toISOString().split('T')[0]
    };
  }

  /**
   * Get cards due for review today
   */
  static getCardsForReview(reviews) {
    const today = new Date().toISOString().split('T')[0];
    return reviews.filter(review => {
      if (!review.next_review_date) return true;
      return review.next_review_date <= today;
    });
  }

  /**
   * Calculate mastery level based on performance
   */
  static calculateMasteryLevel(accuracy, attempts) {
    if (attempts < 3) return 'learning';
    if (accuracy >= 90) return 'mastered';
    if (accuracy >= 70) return 'proficient';
    if (accuracy >= 50) return 'practicing';
    return 'learning';
  }

  /**
   * Get point reward based on quality
   */
  static getPointsForReview(quality, isStreak) {
    const basePoints = {
      5: 10,
      4: 8,
      3: 5,
      2: 2,
      1: 1,
      0: 0
    };
    
    let points = basePoints[quality] || 0;
    if (isStreak) points *= 1.5;
    
    return Math.round(points);
  }
}