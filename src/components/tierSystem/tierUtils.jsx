// XP and Level Progression Logic

export const TIER_CONFIG = {
  Beginner: { minLevel: 1, maxLevel: 2 },
  Scholar: { minLevel: 3, maxLevel: 4 },
  Master: { minLevel: 5, maxLevel: 7 },
  Elite: { minLevel: 8, maxLevel: 10 },
  Legend: { minLevel: 11, maxLevel: Infinity }
};

export const TIER_PERKS = {
  Beginner: ['Basic Practice', 'Limited AI Help'],
  Scholar: ['Custom Practice Sets', 'Mistake Review Insights'],
  Master: ['Full AI Tutor', 'Advanced Analytics', 'Priority Question Generation'],
  Elite: ['Unlimited Practice', 'Deep Weakness Reports'],
  Legend: ['All Features', 'Beta Access', 'Founder Badge']
};

export const XP_REWARDS = {
  PRACTICE_COMPLETED: 25,
  FULL_LENGTH_TEST: 50,
  DAILY_STREAK: 10,
  NOTES_CREATED: 15
};

export function getXPForLevel(level) {
  if (level === 1) return 0;
  
  let totalXP = 0;
  for (let i = 2; i <= level; i++) {
    totalXP += Math.floor(100 * (i - 1) * 1.5);
  }
  return totalXP;
}

export function getNextLevelXP(level) {
  return Math.floor(100 * level * 1.5);
}

export function getTier(level) {
  if (level <= 2) return 'Beginner';
  if (level <= 4) return 'Scholar';
  if (level <= 7) return 'Master';
  if (level <= 10) return 'Elite';
  return 'Legend';
}

export function calculateLevel(totalXP) {
  let level = 1;
  while (totalXP >= getXPForLevel(level + 1)) {
    level++;
  }
  return level;
}

export function getProgressInLevel(totalXP, level) {
  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = getXPForLevel(level + 1);
  const progressXP = totalXP - currentLevelXP;
  const requiredXP = nextLevelXP - currentLevelXP;
  return {
    current: progressXP,
    required: requiredXP,
    percentage: Math.min((progressXP / requiredXP) * 100, 100)
  };
}

export function formatXPProgress(totalXP, level) {
  const progress = getProgressInLevel(totalXP, level);
  return `${progress.current} / ${progress.required} XP`;
}

export function getXPToNextLevel(totalXP, level) {
  const nextLevelXP = getXPForLevel(level + 1);
  return Math.max(0, nextLevelXP - totalXP);
}