/**
 * SUBJECT-SPECIFIC VALIDATORS
 * Each validator knows how to derive and validate answers for its domain
 */

export class MathValidator {
  static validate(question) {
    const errors = [];
    
    // Ensure numeric answer can be extracted
    const canon = question.canonical_representation;
    if (!canon || canon.type !== 'math_expression') {
      errors.push('Math question must have canonical type "math_expression"');
      return errors;
    }
    
    if (canon.answer_value === undefined && !canon.symbolic_answer) {
      errors.push('Math question must specify answer_value or symbolic_answer');
    }
    
    // Validate all choices are parseable as numbers (if numeric)
    if (canon.answer_value !== undefined) {
      const choices = [question.choice_a, question.choice_b, question.choice_c, question.choice_d];
      const parseableCount = choices.filter(c => {
        const num = this.extractNumber(c);
        return num !== null;
      }).length;
      
      if (parseableCount === 0) {
        errors.push('Numeric answer but no choices contain numbers');
      }
    }
    
    return errors;
  }
  
  static extractNumber(text) {
    if (!text) return null;
    const match = text.match(/-?\d+\.?\d*/);
    return match ? parseFloat(match[0]) : null;
  }
}

export class PhysicsValidator {
  static validate(question) {
    const errors = [];
    
    const canon = question.canonical_representation;
    if (!canon || canon.type !== 'physics_problem') {
      errors.push('Physics question must have canonical type "physics_problem"');
      return errors;
    }
    
    if (canon.final_value === undefined) {
      errors.push('Physics question must specify final_value');
    }
    
    if (!canon.unit) {
      errors.push('Physics question must specify unit');
    }
    
    // Ensure at least one choice has matching unit
    const choices = [question.choice_a, question.choice_b, question.choice_c, question.choice_d];
    const hasMatchingUnit = choices.some(c => c && c.includes(canon.unit));
    
    if (!hasMatchingUnit) {
      errors.push(`No choice contains required unit: ${canon.unit}`);
    }
    
    return errors;
  }
}

export class ChemistryValidator {
  static validate(question) {
    const errors = [];
    
    const canon = question.canonical_representation;
    if (!canon || canon.type !== 'chemistry_problem') {
      errors.push('Chemistry question must have canonical type "chemistry_problem"');
      return errors;
    }
    
    if (!canon.answer_formula && canon.answer_value === undefined) {
      errors.push('Chemistry question must specify answer_formula or answer_value');
    }
    
    return errors;
  }
}

export class CSValidator {
  static validate(question) {
    const errors = [];
    
    const canon = question.canonical_representation;
    if (!canon || canon.type !== 'code_execution') {
      // CS questions don't always need canonical (conceptual questions)
      return errors;
    }
    
    if (canon.expected_output === undefined) {
      errors.push('Code execution must specify expected_output');
    }
    
    return errors;
  }
}

export class ConceptValidator {
  static validate(question) {
    const errors = [];
    
    const canon = question.canonical_representation;
    if (!canon || canon.type !== 'concept_mapping') {
      // Not all questions need canonical (reading comprehension, etc.)
      return errors;
    }
    
    if (!canon.correct_concept && !canon.correct_term) {
      errors.push('Concept question must specify correct_concept or correct_term');
    }
    
    return errors;
  }
}