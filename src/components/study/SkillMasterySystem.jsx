/**
 * Skill Mastery System
 * Deterministic skill progression tracking
 * Replaces raw accuracy with meaningful progression states
 */

export const MASTERY_LEVELS = {
  NOT_STARTED: 'not_started',
  DEVELOPING: 'developing',
  PROFICIENT: 'proficient',
  MASTERED: 'mastered'
};

export const MASTERY_CONFIG = {
  [MASTERY_LEVELS.NOT_STARTED]: {
    label: 'Not Started',
    color: '#94A3B8',
    bgColor: '#F1F5F9',
    minAccuracy: 0,
    minAttempts: 0,
    description: 'No attempts yet'
  },
  [MASTERY_LEVELS.DEVELOPING]: {
    label: 'Developing',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    minAccuracy: 0,
    minAttempts: 1,
    description: 'Building understanding'
  },
  [MASTERY_LEVELS.PROFICIENT]: {
    label: 'Proficient',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    minAccuracy: 70,
    minAttempts: 5,
    description: 'Solid grasp of concept'
  },
  [MASTERY_LEVELS.MASTERED]: {
    label: 'Mastered',
    color: '#10B981',
    bgColor: '#D1FAE5',
    minAccuracy: 85,
    minAttempts: 10,
    description: 'Consistent excellence'
  }
};

export class SkillMasterySystem {
  /**
   * Calculate mastery level based on attempts
   */
  static calculateMasteryLevel(totalAttempts, correctAttempts, recentAccuracy = null) {
    if (totalAttempts === 0) {
      return MASTERY_LEVELS.NOT_STARTED;
    }

    const overallAccuracy = (correctAttempts / totalAttempts) * 100;
    const accuracyToUse = recentAccuracy !== null ? recentAccuracy : overallAccuracy;

    // Mastered: 10+ attempts with 85%+ recent accuracy
    if (totalAttempts >= 10 && accuracyToUse >= 85) {
      return MASTERY_LEVELS.MASTERED;
    }

    // Proficient: 5+ attempts with 70%+ accuracy
    if (totalAttempts >= 5 && accuracyToUse >= 70) {
      return MASTERY_LEVELS.PROFICIENT;
    }

    // Developing: Any attempts
    return MASTERY_LEVELS.DEVELOPING;
  }

  /**
   * Get skill priority for adaptive selection
   * Lower number = higher priority (more likely to appear)
   */
  static getSkillPriority(masteryLevel, daysSinceLastPractice) {
    const basePriority = {
      [MASTERY_LEVELS.NOT_STARTED]: 100,
      [MASTERY_LEVELS.DEVELOPING]: 80,
      [MASTERY_LEVELS.PROFICIENT]: 40,
      [MASTERY_LEVELS.MASTERED]: 20
    }[masteryLevel];

    // Increase priority if not practiced recently
    const recencyBonus = Math.min(daysSinceLastPractice * 5, 50);
    
    return basePriority + recencyBonus;
  }

  /**
   * Calculate recent accuracy from last N attempts
   */
  static calculateRecentAccuracy(attempts, count = 5) {
    if (attempts.length === 0) return 0;
    
    const recent = attempts.slice(0, Math.min(count, attempts.length));
    const correct = recent.filter(a => a.is_correct).length;
    
    return (correct / recent.length) * 100;
  }

  /**
   * Update skill mastery record
   */
  static async updateSkillMastery(base44, userId, skillData, attemptResult) {
    const { subject_id, skill_id, skill_name } = skillData;
    
    // Get or create mastery record
    const masteryRecords = await base44.entities.SkillMastery.filter({
      created_by: userId,
      skill_id
    });

    let masteryRecord = masteryRecords[0];
    const totalAttempts = (masteryRecord?.total_attempts || 0) + 1;
    const correctAttempts = (masteryRecord?.correct_attempts || 0) + (attemptResult.is_correct ? 1 : 0);

    // Calculate recent accuracy from actual attempts
    const userAttempts = await base44.entities.Attempt.filter({
      created_by: userId,
      skill_id
    });
    const recentAccuracy = this.calculateRecentAccuracy(userAttempts, 5);

    const newMasteryLevel = this.calculateMasteryLevel(
      totalAttempts,
      correctAttempts,
      recentAccuracy
    );

    const masteryData = {
      subject_id,
      skill_id,
      skill_name,
      mastery_level: newMasteryLevel,
      total_attempts: totalAttempts,
      correct_attempts: correctAttempts,
      recent_accuracy: recentAccuracy,
      last_practiced: new Date().toISOString()
    };

    if (masteryRecord) {
      await base44.entities.SkillMastery.update(masteryRecord.id, masteryData);
    } else {
      masteryRecord = await base44.entities.SkillMastery.create(masteryData);
    }

    return masteryRecord;
  }

  /**
   * Get skills sorted by adaptive priority
   */
  static sortSkillsByPriority(skillMasteryRecords) {
    const now = new Date();
    
    return skillMasteryRecords
      .map(skill => {
        const lastPracticed = skill.last_practiced ? new Date(skill.last_practiced) : new Date(0);
        const daysSince = Math.floor((now - lastPracticed) / (1000 * 60 * 60 * 24));
        
        return {
          ...skill,
          priority: this.getSkillPriority(skill.mastery_level, daysSince)
        };
      })
      .sort((a, b) => b.priority - a.priority);
  }
}

export default SkillMasterySystem;