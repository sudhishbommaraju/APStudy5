/**
 * Adaptive Question Selection
 * Deterministic, explainable algorithm for question selection
 * No ML required - pure logic based on mastery and recency
 */

import { SkillMasterySystem, MASTERY_LEVELS } from './SkillMasterySystem';

export class AdaptiveQuestionSelector {
  /**
   * Select skills for practice session
   * Weighted by mastery level and recency
   */
  static selectSkillsForSession(skillMasteryRecords, questionCount) {
    if (skillMasteryRecords.length === 0) {
      return { skills: [], reasoning: 'No skill data available' };
    }

    // Sort by adaptive priority
    const prioritized = SkillMasterySystem.sortSkillsByPriority(skillMasteryRecords);

    // Distribution strategy:
    // 60% weak skills (not_started, developing)
    // 30% proficient (maintain)
    // 10% mastered (retention check)
    
    const weak = prioritized.filter(s => 
      s.mastery_level === MASTERY_LEVELS.NOT_STARTED || 
      s.mastery_level === MASTERY_LEVELS.DEVELOPING
    );
    const proficient = prioritized.filter(s => s.mastery_level === MASTERY_LEVELS.PROFICIENT);
    const mastered = prioritized.filter(s => s.mastery_level === MASTERY_LEVELS.MASTERED);

    const weakCount = Math.ceil(questionCount * 0.6);
    const proficientCount = Math.ceil(questionCount * 0.3);
    const masteredCount = questionCount - weakCount - proficientCount;

    const selectedSkills = [
      ...weak.slice(0, weakCount),
      ...proficient.slice(0, proficientCount),
      ...mastered.slice(0, masteredCount)
    ];

    // Fill remaining with highest priority
    while (selectedSkills.length < questionCount && prioritized.length > selectedSkills.length) {
      const next = prioritized.find(p => !selectedSkills.includes(p));
      if (next) selectedSkills.push(next);
      else break;
    }

    const reasoning = this.generateReasoning(selectedSkills, questionCount);

    return { skills: selectedSkills, reasoning };
  }

  /**
   * Generate human-readable explanation for skill selection
   */
  static generateReasoning(skills, totalQuestions) {
    const byLevel = skills.reduce((acc, skill) => {
      acc[skill.mastery_level] = (acc[skill.mastery_level] || 0) + 1;
      return acc;
    }, {});

    const reasons = [];
    
    if (byLevel[MASTERY_LEVELS.NOT_STARTED] || byLevel[MASTERY_LEVELS.DEVELOPING]) {
      const count = (byLevel[MASTERY_LEVELS.NOT_STARTED] || 0) + (byLevel[MASTERY_LEVELS.DEVELOPING] || 0);
      reasons.push(`${count} questions on skills you're still developing`);
    }
    
    if (byLevel[MASTERY_LEVELS.PROFICIENT]) {
      reasons.push(`${byLevel[MASTERY_LEVELS.PROFICIENT]} questions to maintain proficiency`);
    }
    
    if (byLevel[MASTERY_LEVELS.MASTERED]) {
      reasons.push(`${byLevel[MASTERY_LEVELS.MASTERED]} questions for retention check`);
    }

    return reasons.join(', ');
  }

  /**
   * Select questions based on skill weights
   */
  static async selectQuestionsAdaptively(base44, subject_id, unit_ids, questionCount, userId) {
    // Get user's skill mastery
    const masteryRecords = await base44.entities.SkillMastery.filter({
      created_by: userId,
      subject_id
    });

    // Get available skills for selected units
    const allSkills = await base44.entities.Skill.list();
    const unitSkills = allSkills.filter(s => 
      unit_ids.includes(s.unit_id) && s.subject_id === subject_id
    );

    // Merge skill data with mastery data
    const skillsWithMastery = unitSkills.map(skill => {
      const mastery = masteryRecords.find(m => m.skill_id === skill.id);
      return {
        ...skill,
        mastery_level: mastery?.mastery_level || MASTERY_LEVELS.NOT_STARTED,
        total_attempts: mastery?.total_attempts || 0,
        recent_accuracy: mastery?.recent_accuracy || 0,
        last_practiced: mastery?.last_practiced || null
      };
    });

    // Select skills adaptively
    const { skills: selectedSkills, reasoning } = this.selectSkillsForSession(
      skillsWithMastery,
      questionCount
    );

    // Get questions for selected skills
    const allQuestions = await base44.entities.Question.filter({ subject_id });
    const selectedQuestions = [];

    for (const skill of selectedSkills) {
      const skillQuestions = allQuestions.filter(q => q.skill_id === skill.id || q.skill_name === skill.skill_name);
      if (skillQuestions.length > 0) {
        // Randomly select one question for this skill
        const randomQ = skillQuestions[Math.floor(Math.random() * skillQuestions.length)];
        selectedQuestions.push(randomQ);
      }
    }

    return {
      questions: selectedQuestions.slice(0, questionCount),
      reasoning,
      skillDistribution: selectedSkills.map(s => ({
        skill_name: s.skill_name,
        mastery_level: s.mastery_level
      }))
    };
  }

  /**
   * Get weak skills for mistake replay
   */
  static async getWeakSkills(base44, userId, subject_id) {
    const masteryRecords = await base44.entities.SkillMastery.filter({
      created_by: userId,
      subject_id
    });

    return masteryRecords
      .filter(m => 
        m.mastery_level === MASTERY_LEVELS.DEVELOPING || 
        (m.mastery_level === MASTERY_LEVELS.PROFICIENT && m.recent_accuracy < 75)
      )
      .sort((a, b) => a.recent_accuracy - b.recent_accuracy);
  }

  /**
   * Calculate difficulty based on mastery
   */
  static getDifficultyForMastery(masteryLevel) {
    switch(masteryLevel) {
      case MASTERY_LEVELS.NOT_STARTED:
      case MASTERY_LEVELS.DEVELOPING:
        return 'easy';
      case MASTERY_LEVELS.PROFICIENT:
        return 'medium';
      case MASTERY_LEVELS.MASTERED:
        return 'hard';
      default:
        return 'medium';
    }
  }
}

export default AdaptiveQuestionSelector;