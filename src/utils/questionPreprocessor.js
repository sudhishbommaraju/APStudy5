/**
 * Question preprocessing layer
 * Ensures all math expressions are valid LaTeX before storage
 */

import { cleanLaTeX, restoreBackslashes, extractMath } from './latexUtils';

/**
 * Clean a question object to ensure all math is properly formatted
 */
export function preprocessQuestion(question) {
  if (!question) return question;
  
  const cleaned = { ...question };
  
  // Clean question text
  if (cleaned.question_text) {
    cleaned.question_text = cleanLaTeX(cleaned.question_text);
  }
  
  // Clean all choices
  ['choice_a', 'choice_b', 'choice_c', 'choice_d'].forEach(key => {
    if (cleaned[key]) {
      cleaned[key] = cleanLaTeX(cleaned[key]);
    }
  });
  
  // Clean explanation
  if (cleaned.explanation) {
    cleaned.explanation = cleanLaTeX(cleaned.explanation);
  }
  
  // Clean hint
  if (cleaned.hint) {
    cleaned.hint = cleanLaTeX(cleaned.hint);
  }
  
  // Clean wrong answer explanations
  if (cleaned.wrong_answer_explanations && typeof cleaned.wrong_answer_explanations === 'object') {
    const cleaned_explanations = {};
    for (const [key, value] of Object.entries(cleaned.wrong_answer_explanations)) {
      cleaned_explanations[key] = typeof value === 'string' ? cleanLaTeX(value) : value;
    }
    cleaned.wrong_answer_explanations = cleaned_explanations;
  }
  
  return cleaned;
}

/**
 * Batch preprocess multiple questions
 */
export function preprocessQuestions(questions) {
  return Array.isArray(questions) 
    ? questions.map(preprocessQuestion)
    : preprocessQuestion(questions);
}

/**
 * Validate that a question has proper LaTeX
 */
export function validateQuestionMath(question) {
  const errors = [];
  
  if (!question) {
    errors.push('Question is null');
    return { valid: false, errors };
  }
  
  // Check question text
  if (question.question_text) {
    const parts = extractMath(question.question_text);
    for (const part of parts) {
      if (part.type !== 'text' && !isValidMathExpression(part.content)) {
        errors.push(`Invalid math in question_text: ${part.content}`);
      }
    }
  }
  
  // Check choices
  ['choice_a', 'choice_b', 'choice_c', 'choice_d'].forEach(key => {
    if (question[key]) {
      const parts = extractMath(question[key]);
      for (const part of parts) {
        if (part.type !== 'text' && !isValidMathExpression(part.content)) {
          errors.push(`Invalid math in ${key}: ${part.content}`);
        }
      }
    }
  });
  
  // Check explanation
  if (question.explanation) {
    const parts = extractMath(question.explanation);
    for (const part of parts) {
      if (part.type !== 'text' && !isValidMathExpression(part.content)) {
        errors.push(`Invalid math in explanation: ${part.content}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if a math expression is valid LaTeX
 */
function isValidMathExpression(latex) {
  if (!latex || typeof latex !== 'string') return false;
  
  // Check for matching braces
  let braceCount = 0;
  let i = 0;
  while (i < latex.length) {
    if (latex[i] === '\\' && i + 1 < latex.length) {
      i += 2; // Skip escaped characters
      continue;
    }
    if (latex[i] === '{') braceCount++;
    if (latex[i] === '}') braceCount--;
    if (braceCount < 0) return false;
    i++;
  }
  
  if (braceCount !== 0) return false;
  
  // Check for common missing backslashes
  if (/\bfrac\b/.test(latex.replace(/\\frac/g, '')) ||
      /\bsin\b/.test(latex.replace(/\\sin/g, '')) ||
      /\bcos\b/.test(latex.replace(/\\cos/g, ''))) {
    return false;
  }
  
  return true;
}