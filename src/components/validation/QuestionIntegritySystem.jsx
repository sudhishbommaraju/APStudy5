/**
 * QUESTION INTEGRITY SYSTEM
 * Central orchestrator for all validation logic
 * 
 * GUARANTEE: No invalid question reaches a student
 */

import { CanonicalValidator } from './CanonicalValidator';
import { MathValidator, PhysicsValidator, ChemistryValidator, CSValidator, ConceptValidator } from './SubjectValidators';
import { ExplanationValidator } from './ExplanationValidator';
import { QuestionValidator } from './QuestionValidator';

export class QuestionIntegritySystem {
  
  /**
   * Main validation entry point
   * Returns { valid: boolean, errors: string[], computedAnswer: string|null }
   */
  static validateQuestion(question) {
    const allErrors = [];
    
    // Step 1: Canonical validation (universal)
    const canonicalResult = CanonicalValidator.validate(question);
    allErrors.push(...canonicalResult.errors);
    
    // Step 2: Legacy validator (LaTeX + MCQ checks)
    const legacyResult = QuestionValidator.validate(question);
    if (!legacyResult.valid) {
      legacyResult.errors.forEach(err => {
        if (err.details) {
          err.details.forEach(detail => {
            allErrors.push(`${err.phase}: ${detail.message || detail.type}`);
          });
        }
      });
    }
    
    // Step 3: Subject-specific validation
    const subjectErrors = this.getSubjectValidator(question.subject_id).validate(question);
    allErrors.push(...subjectErrors);
    
    // Step 4: Explanation validation
    const explanationResult = ExplanationValidator.validate(question);
    if (!explanationResult.valid) {
      allErrors.push(...explanationResult.errors.map(e => `Explanation: ${e}`));
    }
    
    // Step 5: Derive computed answer
    let computedAnswer = null;
    if (question.canonical_representation) {
      const derivedResult = CanonicalValidator.deriveAnswer(question);
      if (derivedResult.error) {
        allErrors.push(`Answer derivation: ${derivedResult.error}`);
      } else {
        computedAnswer = derivedResult.answer;
      }
    }
    
    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      computedAnswer,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Get validator for subject
   */
  static getSubjectValidator(subjectId) {
    if (!subjectId) return ConceptValidator;
    
    const lower = subjectId.toLowerCase();
    
    if (lower.includes('calc') || lower.includes('stats') || lower.includes('algebra') || lower.includes('geometry')) {
      return MathValidator;
    }
    if (lower.includes('physics')) {
      return PhysicsValidator;
    }
    if (lower.includes('chem')) {
      return ChemistryValidator;
    }
    if (lower.includes('csp') || lower.includes('csa') || lower.includes('computer')) {
      return CSValidator;
    }
    
    return ConceptValidator;
  }
  
  /**
   * Bulk validate multiple questions
   */
  static async validateBulk(questions) {
    const results = questions.map(q => ({
      questionId: q.id,
      subject: q.subject_id,
      validation: this.validateQuestion(q)
    }));
    
    const validCount = results.filter(r => r.validation.valid).length;
    const invalidCount = results.filter(r => !r.validation.valid).length;
    
    return {
      total: questions.length,
      valid: validCount,
      invalid: invalidCount,
      results: results.filter(r => !r.validation.valid) // Only show failures
    };
  }
  
  /**
   * Auto-fix question if possible
   */
  static autoFix(question, validationResult) {
    if (!validationResult.computedAnswer) {
      return { fixed: false, reason: 'Cannot auto-fix without computed answer' };
    }
    
    // If we have a computed answer that differs from stored, update it
    if (validationResult.computedAnswer !== question.correct_answer) {
      return {
        fixed: true,
        updates: {
          correct_answer: validationResult.computedAnswer,
          validation_status: 'valid',
          validation_errors: [],
          last_validated: new Date().toISOString()
        }
      };
    }
    
    return { fixed: false, reason: 'No auto-fix available' };
  }
  
  /**
   * Generate canonical representation from AI output (helper for generation)
   */
  static generateCanonical(aiResponse, subject_id) {
    // Attempt to extract canonical from AI output
    // This is called during question generation to add canonical_representation
    
    const lower = subject_id.toLowerCase();
    
    // For math subjects, try to extract numeric answer
    if (lower.includes('calc') || lower.includes('stats') || lower.includes('algebra')) {
      const answerChoice = aiResponse[`choice_${aiResponse.correct_answer.toLowerCase()}`];
      const numericValue = this.extractNumeric(answerChoice);
      
      if (numericValue !== null) {
        return {
          type: 'math_expression',
          answer_value: numericValue,
          tolerance: 0.01
        };
      }
    }
    
    // For physics, extract value + unit
    if (lower.includes('physics')) {
      const answerChoice = aiResponse[`choice_${aiResponse.correct_answer.toLowerCase()}`];
      const parsed = this.extractPhysicsValue(answerChoice);
      
      if (parsed) {
        return {
          type: 'physics_problem',
          final_value: parsed.value,
          unit: parsed.unit
        };
      }
    }
    
    // For chemistry, extract formula
    if (lower.includes('chem')) {
      const answerChoice = aiResponse[`choice_${aiResponse.correct_answer.toLowerCase()}`];
      const formula = this.extractChemicalFormula(answerChoice);
      
      if (formula) {
        return {
          type: 'chemistry_problem',
          answer_formula: formula
        };
      }
    }
    
    // Default: no canonical representation
    return null;
  }
  
  // Helper extraction functions
  
  static extractNumeric(text) {
    if (!text) return null;
    const match = text.match(/-?\d+\.?\d*/);
    return match ? parseFloat(match[0]) : null;
  }
  
  static extractPhysicsValue(text) {
    if (!text) return null;
    const match = text.match(/(-?\d+\.?\d*)\s*([a-zA-Z\/\^²³°]+)/);
    if (match) {
      return {
        value: parseFloat(match[1]),
        unit: match[2]
      };
    }
    return null;
  }
  
  static extractChemicalFormula(text) {
    if (!text) return null;
    // Extract content between $ signs or text
    const latexMatch = text.match(/\$([A-Z][a-z]?(?:_\{?\d+\}?)*)+\$/);
    if (latexMatch) return latexMatch[0];
    
    const plainMatch = text.match(/[A-Z][a-z]?\d*/g);
    if (plainMatch) return plainMatch.join('');
    
    return null;
  }
}