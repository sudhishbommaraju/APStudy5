/**
 * Pre-save validation for AI-generated questions
 * Validates BEFORE saving to database
 * Auto-fixes common issues where possible
 */

import { LatexValidator } from './LatexValidator';
import { AnswerValidator } from './AnswerValidator';

export class GenerationValidator {
  static cleanAndValidate(aiResponse) {
    const cleaned = { ...aiResponse };
    const issues = [];

    // Clean each choice field
    ['choice_a', 'choice_b', 'choice_c', 'choice_d'].forEach(field => {
      if (cleaned[field]) {
        const { cleaned: cleanedText, hadIssues } = this.cleanChoice(cleaned[field]);
        cleaned[field] = cleanedText;
        if (hadIssues) {
          issues.push(`Fixed ${field}: removed duplication`);
        }
      }
    });

    // Clean question text
    if (cleaned.question_text) {
      const { cleaned: cleanedText, hadIssues } = this.cleanText(cleaned.question_text);
      cleaned.question_text = cleanedText;
      if (hadIssues) {
        issues.push('Fixed question_text: removed duplication');
      }
    }

    // Validate after cleaning
    const latexValidation = LatexValidator.validateAllFields(cleaned);
    const mcqValidation = AnswerValidator.validateMCQ(cleaned);

    return {
      cleaned,
      valid: latexValidation.valid && mcqValidation.valid,
      autofixed: issues.length > 0,
      issues,
      errors: [
        ...(latexValidation.errors || []),
        ...(mcqValidation.errors || []),
      ],
    };
  }

  static cleanChoice(text) {
    let cleaned = text;
    let hadIssues = false;

    // Pattern 1: "$...$" followed by plain text version
    // e.g., "$H_{2}O$H2O" → "$H_{2}O$"
    const latexDupPattern = /\$([^$]+)\$([A-Za-z0-9]+)/g;
    const originalCleaned = cleaned;
    cleaned = cleaned.replace(latexDupPattern, (match, latex, plain) => {
      hadIssues = true;
      return `$${latex}$`;
    });

    // Pattern 2: Direct repetition
    // e.g., "CH4CH4" or "NaClNaCl"
    const segments = [];
    for (let len = 3; len <= cleaned.length / 2; len++) {
      const first = cleaned.substring(0, len);
      const second = cleaned.substring(len, len * 2);
      if (first === second && first.length >= 3) {
        cleaned = first;
        hadIssues = true;
        break;
      }
    }

    // Pattern 3: "ext" corruption → proper \text{}
    if (cleaned.includes('ext°') || cleaned.includes('ext ')) {
      cleaned = cleaned.replace(/(\d+)ext\s*°C/g, '$$$1\\text{°C}$$');
      hadIssues = true;
    }

    return { cleaned, hadIssues };
  }

  static cleanText(text) {
    let cleaned = text;
    let hadIssues = false;

    // Remove common duplication patterns in question text
    // e.g., "f(x)=...f(x)=..." (keep first occurrence only)
    
    // Pattern: function definition repeated
    const functionPattern = /([a-z]\([a-z]\)\s*=\s*[^.]+?)\s+\1/g;
    if (functionPattern.test(cleaned)) {
      cleaned = cleaned.replace(functionPattern, '$1');
      hadIssues = true;
    }

    return { cleaned, hadIssues };
  }

  static shouldRetry(validationResult) {
    // Determine if we should regenerate this question
    const criticalErrors = validationResult.errors.filter(e => 
      e.phase === 'MCQ_VALIDATION' || 
      e.phase === 'REQUIRED_FIELDS'
    );
    
    return criticalErrors.length > 0;
  }

  static validateBeforeSave(questionData) {
    const result = this.cleanAndValidate(questionData);
    
    if (!result.valid) {
      console.warn('Question failed validation:', {
        data: questionData,
        errors: result.errors,
      });
    }

    return result;
  }
}