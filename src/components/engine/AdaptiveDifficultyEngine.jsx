import { base44 } from '@/api/base44Client';

/**
 * Adaptive Difficulty Engine
 * Implements hybrid weighted progression based on user performance
 */

const ROLLING_WINDOW_SIZE = 30;
const HIGH_ACCURACY_THRESHOLD = 80;
const LOW_ACCURACY_THRESHOLD = 60;

export async function getNextDifficultyLevel(userEmail, skillId) {
  // Get recent performance for this skill
  const performance = await base44.entities.EngineUserSkillPerformance.filter({
    user_email: userEmail,
    skill_id: skillId
  });

  if (performance.length === 0 || !performance[0].attempts) {
    return 3; // Start at medium difficulty
  }

  const skillPerf = performance[0];
  const accuracy = skillPerf.accuracy || 0;

  // Get current difficulty from recent questions
  const skill = await base44.entities.EngineSkill.list();
  const currentSkill = skill.find(s => s.id === skillId);
  const currentDifficulty = currentSkill?.difficulty_level || 3;

  // Adaptive logic
  if (accuracy >= HIGH_ACCURACY_THRESHOLD && currentDifficulty < 5) {
    return Math.min(currentDifficulty + 1, 5);
  } else if (accuracy < LOW_ACCURACY_THRESHOLD && currentDifficulty > 1) {
    return Math.max(currentDifficulty - 1, 1);
  }

  return currentDifficulty;
}

export async function selectAdaptiveQuestions({
  userEmail,
  examType,
  domainId,
  unitId,
  questionCount
}) {
  // Get user's skill performance
  const performance = await base44.entities.EngineUserSkillPerformance.filter({
    user_email: userEmail
  });

  // Get all skills for this domain/unit
  const skills = await base44.entities.EngineSkill.list();
  const relevantSkills = skills.filter(s => {
    if (domainId) return s.domain_id === domainId;
    if (unitId) return s.unit_id === unitId;
    return false;
  });

  // Calculate weights based on performance
  const skillWeights = relevantSkills.map(skill => {
    const perf = performance.find(p => p.skill_id === skill.id);
    const accuracy = perf?.accuracy || 50;
    
    // Lower accuracy = higher weight (more practice needed)
    const weight = 100 - accuracy;
    
    return {
      skill,
      weight: Math.max(weight, 10), // Minimum weight of 10
      difficulty: perf ? getNextDifficultyLevel(userEmail, skill.id) : 3
    };
  });

  // Select skills weighted by need
  const selectedSkills = weightedRandomSelection(skillWeights, questionCount);

  // Get questions for selected skills
  const questions = [];
  for (const { skill, difficulty } of selectedSkills) {
    const skillQuestions = await base44.entities.ProoflyQuestion.filter({
      skill_id: skill.id,
      difficulty: await difficulty,
      is_active: true
    });

    if (skillQuestions.length > 0) {
      const randomQuestion = skillQuestions[Math.floor(Math.random() * skillQuestions.length)];
      questions.push(randomQuestion);
    }
  }

  return questions;
}

function weightedRandomSelection(items, count) {
  const selected = [];
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

  for (let i = 0; i < Math.min(count, items.length); i++) {
    let random = Math.random() * totalWeight;
    
    for (const item of items) {
      random -= item.weight;
      if (random <= 0) {
        selected.push(item);
        break;
      }
    }
  }

  return selected;
}

export async function updateRollingWindow(userEmail, skillId, isCorrect) {
  const performance = await base44.entities.EngineUserSkillPerformance.filter({
    user_email: userEmail,
    skill_id: skillId
  });

  if (performance.length === 0) return;

  const perf = performance[0];
  const newAttempts = Math.min(perf.attempts + 1, ROLLING_WINDOW_SIZE);
  const newCorrect = isCorrect ? perf.correct + 1 : perf.correct;

  // If we're at window size, use rolling average
  const accuracy = (newCorrect / newAttempts) * 100;

  await base44.entities.EngineUserSkillPerformance.update(perf.id, {
    attempts: newAttempts,
    correct: newCorrect,
    accuracy,
    last_updated: new Date().toISOString()
  });
}