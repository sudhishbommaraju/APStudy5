/**
 * Spaced Repetition System (SRS) scheduling logic
 * Intervals based on mastery percentage using SM-2 inspired algorithm
 */

export function calculateNextReviewDate(masteryPercentage) {
  const today = new Date();
  let daysUntilReview = 1; // default

  if (masteryPercentage < 40) {
    // Low mastery: review in 1 day
    daysUntilReview = 1;
  } else if (masteryPercentage < 60) {
    // Developing: review in 3 days
    daysUntilReview = 3;
  } else if (masteryPercentage < 80) {
    // Proficient: review in 7 days
    daysUntilReview = 7;
  } else if (masteryPercentage < 95) {
    // Advanced: review in 14 days
    daysUntilReview = 14;
  } else {
    // Mastered: review in 30 days
    daysUntilReview = 30;
  }

  const nextReview = new Date(today);
  nextReview.setDate(nextReview.getDate() + daysUntilReview);
  return nextReview.toISOString().split('T')[0]; // YYYY-MM-DD format
}

export function isReviewDue(nextReviewDate) {
  if (!nextReviewDate) return false;
  const today = new Date().toISOString().split('T')[0];
  return nextReviewDate <= today;
}

export function getDaysUntilReview(nextReviewDate) {
  if (!nextReviewDate) return null;
  const today = new Date();
  const review = new Date(nextReviewDate);
  const diff = review.getTime() - today.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days;
}

export function getMasteryLabel(masteryPercentage) {
  if (!masteryPercentage) return 'Not Started';
  if (masteryPercentage < 40) return 'Developing';
  if (masteryPercentage < 60) return 'Proficient';
  if (masteryPercentage < 80) return 'Advanced';
  if (masteryPercentage < 95) return 'Near Master';
  return 'Mastered';
}

export function getMasteryColor(masteryPercentage) {
  if (!masteryPercentage) return 'gray';
  if (masteryPercentage < 40) return 'red';
  if (masteryPercentage < 60) return 'yellow';
  if (masteryPercentage < 80) return 'blue';
  if (masteryPercentage < 95) return 'green';
  return 'emerald';
}