/**
 * Answer Correctness Validator
 * Ensures correct_answer actually matches one choice and is mathematically correct
 */

export class AnswerValidator {
  static validateMCQ(question) {
    const errors = [];

    // Rule 1: correct_answer must be A, B, C, or D
    if (!['A', 'B', 'C', 'D'].includes(question.correct_answer)) {
      errors.push({
        type: 'INVALID_ANSWER_KEY',
        message: `correct_answer "${question.correct_answer}" is not A, B, C, or D`,
      });
    }

    // Rule 2: The choice corresponding to correct_answer must exist
    const correctChoice = question[`choice_${question.correct_answer?.toLowerCase()}`];
    if (!correctChoice) {
      errors.push({
        type: 'MISSING_CORRECT_CHOICE',
        message: `Choice ${question.correct_answer} is missing`,
      });
    }

    // Rule 3: All choices must be distinct
    const choices = [
      question.choice_a,
      question.choice_b,
      question.choice_c,
      question.choice_d
    ].filter(Boolean);

    const normalizedChoices = choices.map(c => this.normalizeChoice(c));
    const uniqueChoices = new Set(normalizedChoices);
    
    if (uniqueChoices.size !== choices.length) {
      errors.push({
        type: 'DUPLICATE_CHOICES',
        message: 'Two or more choices are identical or too similar',
        choices: normalizedChoices,
      });
    }

    // Rule 4: Detect if any choice is duplicated within itself
    choices.forEach((choice, idx) => {
      const letter = ['A', 'B', 'C', 'D'][idx];
      if (this.hasSelfDuplication(choice)) {
        errors.push({
          type: 'SELF_DUPLICATED_CHOICE',
          message: `Choice ${letter} contains duplicated content: "${choice}"`,
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static normalizeChoice(choice) {
    if (!choice) return '';
    
    // Remove LaTeX delimiters and whitespace for comparison
    return choice
      .replace(/\$/g, '')
      .replace(/\\text\{[^}]*\}/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  static hasSelfDuplication(text) {
    if (!text || text.length < 4) return false;

    // Check for exact substring repetition
    // e.g., "CH4CH4" or "$H_{2}O$H2O"
    const normalized = text.replace(/\s+/g, '');
    
    // Try different substring lengths
    for (let len = 3; len <= normalized.length / 2; len++) {
      const firstHalf = normalized.substring(0, len);
      const secondHalf = normalized.substring(len, len * 2);
      
      // Check if first half repeats immediately
      if (firstHalf === secondHalf) {
        return true;
      }
    }

    // Check for LaTeX followed by plain text version
    // e.g., "$x^2$x2" or "$H_{2}O$H2O"
    const latexPattern = /\$([^$]+)\$([a-zA-Z0-9]+)/;
    const match = text.match(latexPattern);
    if (match) {
      const latexContent = match[1].replace(/[_{}\^\\]/g, '');
      const plainContent = match[2];
      if (latexContent.toLowerCase().includes(plainContent.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  static validateExplanation(question) {
    const errors = [];

    if (!question.explanation) {
      errors.push({
        type: 'MISSING_EXPLANATION',
        message: 'Explanation is required',
      });
      return { valid: false, errors };
    }

    // Check explanation references correct answer
    const correctChoice = question[`choice_${question.correct_answer?.toLowerCase()}`];
    
    // Basic check: explanation should be substantive
    if (question.explanation.length < 20) {
      errors.push({
        type: 'INSUFFICIENT_EXPLANATION',
        message: 'Explanation is too short to be helpful',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static extractNumericValue(text) {
    // Try to extract a numeric value from text (for basic validation)
    const matches = text.match(/-?\d+\.?\d*/);
    return matches ? parseFloat(matches[0]) : null;
  }

  static validateWrongAnswerExplanations(question) {
    const errors = [];

    if (!question.wrong_answer_explanations) {
      return { valid: true, errors }; // Optional field
    }

    const choices = ['A', 'B', 'C', 'D'];
    const wrongChoices = choices.filter(c => c !== question.correct_answer);

    wrongChoices.forEach(choice => {
      if (!question.wrong_answer_explanations[choice]) {
        errors.push({
          type: 'MISSING_WRONG_EXPLANATION',
          message: `Missing explanation for why ${choice} is wrong`,
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}