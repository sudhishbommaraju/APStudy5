import { base44 } from '@/api/base44Client';

/**
 * Score Projection Model
 * Calculates projected exam scores based on practice performance
 */

export function calculateWeightedMovingAverage(sessions, windowSize = 5) {
  if (!sessions || sessions.length === 0) return 0;
  
  const recent = sessions.slice(-windowSize);
  let weightedSum = 0;
  let weightSum = 0;
  
  recent.forEach((session, index) => {
    const weight = index + 1; // More recent = higher weight
    weightedSum += (session.score || 0) * weight;
    weightSum += weight;
  });
  
  return weightSum > 0 ? weightedSum / weightSum : 0;
}

export function projectSATScore(accuracy) {
  // SAT scoring model: 400-1600 scale
  // Rough approximation based on accuracy
  const baseScore = 400;
  const maxScore = 1600;
  const range = maxScore - baseScore;
  
  return Math.round(baseScore + (accuracy / 100) * range);
}

export function projectACTScore(accuracy) {
  // ACT scoring model: 1-36 scale
  const baseScore = 1;
  const maxScore = 36;
  const range = maxScore - baseScore;
  
  return Math.round(baseScore + (accuracy / 100) * range);
}

export function projectAPScore(accuracy) {
  // AP scoring model: 1-5 scale with probability
  if (accuracy >= 85) return { score: 5, probability: 0.85 };
  if (accuracy >= 70) return { score: 4, probability: 0.75 };
  if (accuracy >= 55) return { score: 3, probability: 0.65 };
  if (accuracy >= 40) return { score: 2, probability: 0.50 };
  return { score: 1, probability: 0.40 };
}

export function analyzeDifficultyPerformance(skillPerformance) {
  const difficultyBreakdown = {
    1: { attempts: 0, correct: 0, accuracy: 0 },
    2: { attempts: 0, correct: 0, accuracy: 0 },
    3: { attempts: 0, correct: 0, accuracy: 0 },
    4: { attempts: 0, correct: 0, accuracy: 0 },
    5: { attempts: 0, correct: 0, accuracy: 0 }
  };
  
  skillPerformance.forEach(skill => {
    const level = skill.difficulty_level || 3;
    if (difficultyBreakdown[level]) {
      difficultyBreakdown[level].attempts += skill.attempts;
      difficultyBreakdown[level].correct += skill.correct;
    }
  });
  
  Object.keys(difficultyBreakdown).forEach(level => {
    const data = difficultyBreakdown[level];
    data.accuracy = data.attempts > 0 ? (data.correct / data.attempts) * 100 : 0;
  });
  
  return Object.entries(difficultyBreakdown).map(([level, data]) => ({
    difficulty: parseInt(level),
    ...data
  }));
}

export async function calculateImprovementVelocity(userEmail) {
  const sessions = await base44.entities.EnginePracticeSession.filter({
    user_email: userEmail
  });
  
  const completed = sessions
    .filter(s => s.completed_at)
    .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at));
  
  if (completed.length < 2) return 0;
  
  const firstHalf = completed.slice(0, Math.floor(completed.length / 2));
  const secondHalf = completed.slice(Math.floor(completed.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, s) => sum + (s.score || 0), 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, s) => sum + (s.score || 0), 0) / secondHalf.length;
  
  return secondAvg - firstAvg;
}