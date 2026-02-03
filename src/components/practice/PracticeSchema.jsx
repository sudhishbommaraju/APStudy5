/**
 * Strict schema validation for practice questions
 */

export function validateQuestionSchema(question) {
  const errors = [];

  if (!question.id || typeof question.id !== 'string') {
    errors.push('Missing or invalid question.id');
  }
  
  if (!question.question_text || typeof question.question_text !== 'string') {
    errors.push('Missing or invalid question_text');
  }

  if (!question.choice_a || typeof question.choice_a !== 'string') {
    errors.push('Missing choice_a');
  }
  if (!question.choice_b || typeof question.choice_b !== 'string') {
    errors.push('Missing choice_b');
  }
  if (!question.choice_c || typeof question.choice_c !== 'string') {
    errors.push('Missing choice_c');
  }
  if (!question.choice_d || typeof question.choice_d !== 'string') {
    errors.push('Missing choice_d');
  }

  if (!['A', 'B', 'C', 'D'].includes(question.correct_answer)) {
    errors.push('Invalid correct_answer (must be A, B, C, or D)');
  }

  if (!question.explanation || typeof question.explanation !== 'string') {
    errors.push('Missing explanation');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validatePracticeData(questions) {
  if (!Array.isArray(questions)) {
    return { valid: false, error: 'Questions must be an array' };
  }

  if (questions.length === 0) {
    return { valid: false, error: 'Questions array is empty' };
  }

  for (let i = 0; i < questions.length; i++) {
    const validation = validateQuestionSchema(questions[i]);
    if (!validation.valid) {
      return {
        valid: false,
        error: `Question ${i + 1} validation failed: ${validation.errors.join(', ')}`
      };
    }
  }

  return { valid: true };
}