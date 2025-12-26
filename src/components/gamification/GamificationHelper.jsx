import { base44 } from '@/api/base44Client';

const BADGES = {
  first_correct: { id: 'first_correct', name: 'First Steps', description: 'Answer your first question correctly', icon: '🎯', points: 10 },
  streak_5: { id: 'streak_5', name: 'On Fire', description: '5 correct answers in a row', icon: '🔥', points: 50 },
  streak_10: { id: 'streak_10', name: 'Unstoppable', description: '10 correct answers in a row', icon: '⚡', points: 100 },
  streak_20: { id: 'streak_20', name: 'Legendary', description: '20 correct answers in a row', icon: '👑', points: 200 },
  questions_50: { id: 'questions_50', name: 'Scholar', description: 'Answer 50 questions', icon: '📚', points: 75 },
  questions_100: { id: 'questions_100', name: 'Expert', description: 'Answer 100 questions', icon: '🎓', points: 150 },
  questions_500: { id: 'questions_500', name: 'Master', description: 'Answer 500 questions', icon: '🏆', points: 500 },
  accuracy_90: { id: 'accuracy_90', name: 'Perfectionist', description: '90%+ accuracy over 20 questions', icon: '💎', points: 200 },
  daily_practice: { id: 'daily_practice', name: 'Dedicated', description: 'Practice 7 days in a row', icon: '📅', points: 100 },
  subject_master: { id: 'subject_master', name: 'Subject Master', description: '95%+ accuracy in any subject (50+ questions)', icon: '🌟', points: 300 },
};

const POINTS_PER_CORRECT = 10;
const POINTS_PER_STREAK = 5;

export async function getUserStats(userEmail) {
  try {
    const stats = await base44.entities.UserStats.filter({ created_by: userEmail });
    if (stats.length > 0) {
      return stats[0];
    }
    // Create initial stats
    const newStats = await base44.entities.UserStats.create({
      total_points: 0,
      current_streak: 0,
      longest_streak: 0,
      badges_earned: [],
      total_questions_answered: 0,
      total_correct: 0,
      level: 1,
      last_activity_date: new Date().toISOString().split('T')[0],
    });
    return newStats;
  } catch (e) {
    console.error('Failed to get user stats:', e);
    return null;
  }
}

export async function updateStatsForAnswer(userEmail, isCorrect, currentStreak) {
  try {
    const stats = await getUserStats(userEmail);
    if (!stats) return null;

    let points = stats.total_points;
    let streak = currentStreak;
    const badges = [...stats.badges_earned];
    const newBadges = [];

    // Points for correct answer
    if (isCorrect) {
      points += POINTS_PER_CORRECT;
      points += streak * POINTS_PER_STREAK;
    }

    const totalQuestions = stats.total_questions_answered + 1;
    const totalCorrect = stats.total_correct + (isCorrect ? 1 : 0);

    // Check for new badges
    if (isCorrect && totalCorrect === 1 && !badges.includes('first_correct')) {
      badges.push('first_correct');
      newBadges.push(BADGES.first_correct);
      points += BADGES.first_correct.points;
    }

    if (streak === 5 && !badges.includes('streak_5')) {
      badges.push('streak_5');
      newBadges.push(BADGES.streak_5);
      points += BADGES.streak_5.points;
    }

    if (streak === 10 && !badges.includes('streak_10')) {
      badges.push('streak_10');
      newBadges.push(BADGES.streak_10);
      points += BADGES.streak_10.points;
    }

    if (streak === 20 && !badges.includes('streak_20')) {
      badges.push('streak_20');
      newBadges.push(BADGES.streak_20);
      points += BADGES.streak_20.points;
    }

    if (totalQuestions === 50 && !badges.includes('questions_50')) {
      badges.push('questions_50');
      newBadges.push(BADGES.questions_50);
      points += BADGES.questions_50.points;
    }

    if (totalQuestions === 100 && !badges.includes('questions_100')) {
      badges.push('questions_100');
      newBadges.push(BADGES.questions_100);
      points += BADGES.questions_100.points;
    }

    if (totalQuestions === 500 && !badges.includes('questions_500')) {
      badges.push('questions_500');
      newBadges.push(BADGES.questions_500);
      points += BADGES.questions_500.points;
    }

    // Calculate level (100 points per level)
    const level = Math.floor(points / 100) + 1;

    const updatedStats = await base44.entities.UserStats.update(stats.id, {
      total_points: points,
      current_streak: streak,
      longest_streak: Math.max(stats.longest_streak, streak),
      badges_earned: badges,
      total_questions_answered: totalQuestions,
      total_correct: totalCorrect,
      level,
      last_activity_date: new Date().toISOString().split('T')[0],
    });

    return {
      stats: updatedStats,
      newBadges,
      pointsEarned: points - stats.total_points,
    };
  } catch (e) {
    console.error('Failed to update stats:', e);
    return null;
  }
}

export function getBadgeInfo(badgeId) {
  return BADGES[badgeId] || null;
}

export function getAllBadges() {
  return Object.values(BADGES);
}