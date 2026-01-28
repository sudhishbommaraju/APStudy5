/**
 * CANONICAL VALIDATOR
 * Core validation engine that enforces correctness via canonical representation
 * 
 * PRINCIPLE: The system derives the answer. The system does not trust the answer.
 */

import { LatexValidator } from './LatexValidator';
import { AnswerValidator } from './AnswerValidator';

export class CanonicalValidator {
  
  /**
   * Validate a question by deriving the answer from canonical representation
   * and comparing with the stored answer
   */
  static validate(question) {
    const errors = [];
    
    // Step 1: Basic structure validation
    if (!question.subject_id) errors.push('Missing subject_id');
    if (!question.question_text) errors.push('Missing question_text');
    if (!question.correct_answer) errors.push('Missing correct_answer');
    
    // Step 2: Choice validation - must have exactly 4 unique choices
    const choices = [
      question.choice_a,
      question.choice_b, 
      question.choice_c,
      question.choice_d
    ].filter(Boolean);
    
    if (choices.length !== 4) {
      errors.push(`Must have exactly 4 choices, found ${choices.length}`);
    }
    
    // Step 3: LaTeX validation for math-heavy subjects
    const mathSubjects = ['ap_calc_ab', 'ap_calc_bc', 'ap_stats', 'ap_physics_1', 'ap_physics_2', 'ap_physics_c', 'ap_chem', 'sat', 'act'];
    const isMathSubject = mathSubjects.some(s => question.subject_id?.includes(s) || question.subject_id?.includes('calc') || question.subject_id?.includes('physics') || question.subject_id?.includes('chem'));
    
    if (isMathSubject) {
      const latexErrors = LatexValidator.validate(question);
      errors.push(...latexErrors);
    }
    
    // Step 4: Answer uniqueness validation
    const answerErrors = AnswerValidator.validate(question);
    errors.push(...answerErrors);
    
    // Step 5: Canonical answer derivation (if canonical_representation exists)
    if (question.canonical_representation) {
      const derivedAnswer = this.deriveAnswer(question);
      
      if (derivedAnswer.error) {
        errors.push(`Answer derivation failed: ${derivedAnswer.error}`);
      } else if (derivedAnswer.answer !== question.correct_answer) {
        errors.push(`Computed answer (${derivedAnswer.answer}) != stored answer (${question.correct_answer})`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Derive the correct answer from canonical representation
   */
  static deriveAnswer(question) {
    if (!question.canonical_representation) {
      return { error: 'No canonical representation' };
    }
    
    const canon = question.canonical_representation;
    
    try {
      // Subject-specific derivation
      if (canon.type === 'math_expression') {
        return this.deriveMathAnswer(question);
      } else if (canon.type === 'physics_problem') {
        return this.derivePhysicsAnswer(question);
      } else if (canon.type === 'chemistry_problem') {
        return this.deriveChemistryAnswer(question);
      } else if (canon.type === 'code_execution') {
        return this.deriveCodeAnswer(question);
      } else if (canon.type === 'concept_mapping') {
        return this.deriveConceptAnswer(question);
      }
      
      return { error: 'Unknown canonical type' };
    } catch (e) {
      return { error: e.message };
    }
  }
  
  /**
   * Derive answer for math expressions
   */
  static deriveMathAnswer(question) {
    const canon = question.canonical_representation;
    
    if (canon.answer_value !== undefined) {
      // Compare with choices
      const choices = [
        { key: 'A', value: this.parseNumeric(question.choice_a) },
        { key: 'B', value: this.parseNumeric(question.choice_b) },
        { key: 'C', value: this.parseNumeric(question.choice_c) },
        { key: 'D', value: this.parseNumeric(question.choice_d) }
      ];
      
      const tolerance = canon.tolerance || 0.01;
      const matches = choices.filter(c => 
        c.value !== null && Math.abs(c.value - canon.answer_value) < tolerance
      );
      
      if (matches.length === 0) {
        return { error: 'No choice matches canonical answer' };
      }
      if (matches.length > 1) {
        return { error: 'Multiple choices match canonical answer' };
      }
      
      return { answer: matches[0].key };
    }
    
    return { error: 'Cannot derive numeric answer' };
  }
  
  /**
   * Derive answer for physics problems
   */
  static derivePhysicsAnswer(question) {
    const canon = question.canonical_representation;
    
    if (canon.final_value !== undefined && canon.unit) {
      // Match choices that have the same value + unit
      const choices = [
        { key: 'A', text: question.choice_a },
        { key: 'B', text: question.choice_b },
        { key: 'C', text: question.choice_c },
        { key: 'D', text: question.choice_d }
      ];
      
      const matches = choices.filter(c => {
        const parsed = this.parsePhysicsValue(c.text);
        return parsed && 
               Math.abs(parsed.value - canon.final_value) < 0.01 &&
               parsed.unit === canon.unit;
      });
      
      if (matches.length === 1) {
        return { answer: matches[0].key };
      }
      
      return { error: `Found ${matches.length} matches for physics answer` };
    }
    
    return { error: 'Missing final_value or unit in canonical' };
  }
  
  /**
   * Derive answer for chemistry problems
   */
  static deriveChemistryAnswer(question) {
    const canon = question.canonical_representation;
    
    if (canon.answer_formula || canon.answer_value) {
      // For chemistry, match molecular formulas or computed values
      const target = canon.answer_formula || String(canon.answer_value);
      
      const choices = [
        { key: 'A', text: question.choice_a },
        { key: 'B', text: question.choice_b },
        { key: 'C', text: question.choice_c },
        { key: 'D', text: question.choice_d }
      ];
      
      const matches = choices.filter(c => 
        this.normalizeChemistry(c.text).includes(this.normalizeChemistry(target))
      );
      
      if (matches.length === 1) {
        return { answer: matches[0].key };
      }
      
      return { error: `Found ${matches.length} chemistry matches` };
    }
    
    return { error: 'Missing answer_formula or answer_value' };
  }
  
  /**
   * Derive answer for code execution
   */
  static deriveCodeAnswer(question) {
    const canon = question.canonical_representation;
    
    if (canon.expected_output !== undefined) {
      const choices = [
        { key: 'A', text: question.choice_a },
        { key: 'B', text: question.choice_b },
        { key: 'C', text: question.choice_c },
        { key: 'D', text: question.choice_d }
      ];
      
      const matches = choices.filter(c => 
        this.normalizeCode(c.text) === this.normalizeCode(String(canon.expected_output))
      );
      
      if (matches.length === 1) {
        return { answer: matches[0].key };
      }
      
      return { error: `Found ${matches.length} code output matches` };
    }
    
    return { error: 'Missing expected_output' };
  }
  
  /**
   * Derive answer for concept-based questions
   */
  static deriveConceptAnswer(question) {
    const canon = question.canonical_representation;
    
    if (canon.correct_concept || canon.correct_term) {
      const target = (canon.correct_concept || canon.correct_term).toLowerCase();
      
      const choices = [
        { key: 'A', text: question.choice_a },
        { key: 'B', text: question.choice_b },
        { key: 'C', text: question.choice_c },
        { key: 'D', text: question.choice_d }
      ];
      
      const matches = choices.filter(c => 
        c.text.toLowerCase().includes(target) ||
        (canon.synonyms || []).some(syn => c.text.toLowerCase().includes(syn.toLowerCase()))
      );
      
      if (matches.length === 1) {
        return { answer: matches[0].key };
      }
      
      return { error: `Found ${matches.length} concept matches` };
    }
    
    return { error: 'Missing correct_concept or correct_term' };
  }
  
  // Helper functions
  
  static parseNumeric(text) {
    if (!text) return null;
    
    // Extract first number from LaTeX or plain text
    const match = text.match(/-?\d+\.?\d*/);
    return match ? parseFloat(match[0]) : null;
  }
  
  static parsePhysicsValue(text) {
    if (!text) return null;
    
    // Extract number and unit (e.g. "9.8 m/s^2")
    const match = text.match(/(-?\d+\.?\d*)\s*([a-zA-Z\/\^]+)/);
    if (match) {
      return {
        value: parseFloat(match[1]),
        unit: match[2]
      };
    }
    return null;
  }
  
  static normalizeChemistry(text) {
    // Remove LaTeX, spaces, keep only atoms and numbers
    return text.replace(/\$|\\text\{|\}|_|\^|\s/g, '').toUpperCase();
  }
  
  static normalizeCode(text) {
    // Remove whitespace variations
    return text.replace(/\s+/g, ' ').trim();
  }
}