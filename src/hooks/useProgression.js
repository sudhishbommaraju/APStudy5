import { base44 } from '@/api/base44Client';

// XP awards per activity type
export const XP_AWARDS = {
  correct_mcq: 10,
  wrong_mcq: 2,
  correct_frq: 25,
  wrong_frq: 5,
  active_recall: 15,
};

// Level formula: floor(sqrt(xp / 50)) + 1
export function calcLevel(xp) {
  return Math.floor(Math.sqrt((xp || 0) / 50)) + 1;
}

// XP needed to reach next level
export function xpForLevel(level) {
  return Math.pow(level - 1, 2) * 50;
}

// Get or create UserStats for the current user
export async function getUserStats(userEmail) {
  const existing = await base44.entities.UserStats.filter({ user_email: userEmail }, '-created_date', 1);
  if (existing.length > 0) return existing[0];

  // Initialize fresh stats
  return base44.entities.UserStats.create({
    user_email: userEmail,
    xp: 0,
    level: 1,
    questions_answered: 0,
    correct_answers: 0,
    streak: 0,
  });
}

// Award XP after answering a question
// type: 'correct_mcq' | 'wrong_mcq' | 'correct_frq' | 'wrong_frq' | 'active_recall'
export async function awardXP(type, userEmail) {
  const xpGain = XP_AWARDS[type] || 0;
  const isCorrect = type.startsWith('correct') || type === 'active_recall';

  const stats = await getUserStats(userEmail);
  const newXp = (stats.xp || 0) + xpGain;
  const newLevel = calcLevel(newXp);
  const newStreak = isCorrect ? (stats.streak || 0) + 1 : 0;

  await base44.entities.UserStats.update(stats.id, {
    xp: newXp,
    level: newLevel,
    questions_answered: (stats.questions_answered || 0) + 1,
    correct_answers: isCorrect ? (stats.correct_answers || 0) + 1 : (stats.correct_answers || 0),
    streak: newStreak,
  });

  return { xp: newXp, level: newLevel, streak: newStreak, xpGain };
}