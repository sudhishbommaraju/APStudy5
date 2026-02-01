/**
 * CONTENT FORMATTER - SINGLE SOURCE OF TRUTH
 * Enforces formatting rules across all subjects
 */

export const SUBJECTS = {
  MATH: 'Math',
  PHYSICS: 'Physics',
  CHEMISTRY: 'Chemistry',
  BIOLOGY: 'Biology',
  SAT_READING: 'SAT_Reading',
  SAT_WRITING: 'SAT_Writing',
  ACT_ENGLISH: 'ACT_English',
  ACT_READING: 'ACT_Reading',
  ACT_SCIENCE: 'ACT_Science'
};

export const LATEX_SUBJECTS = new Set([
  SUBJECTS.MATH,
  SUBJECTS.PHYSICS,
  SUBJECTS.CHEMISTRY,
  SUBJECTS.ACT_SCIENCE
]);

export const TEXT_ONLY_SUBJECTS = new Set([
  SUBJECTS.SAT_READING,
  SUBJECTS.SAT_WRITING,
  SUBJECTS.ACT_ENGLISH,
  SUBJECTS.ACT_READING,
  SUBJECTS.BIOLOGY
]);

/**
 * Classify subject from subject_id
 */
export function classifySubject(subjectId) {
  const id = subjectId?.toLowerCase() || '';
  
  if (id.includes('math')) return SUBJECTS.MATH;
  if (id.includes('physics')) return SUBJECTS.PHYSICS;
  if (id.includes('chemistry')) return SUBJECTS.CHEMISTRY;
  if (id.includes('biology')) return SUBJECTS.BIOLOGY;
  if (id === 'sat') return SUBJECTS.SAT_READING; // Default SAT
  if (id === 'act') return SUBJECTS.ACT_ENGLISH; // Default ACT
  
  return SUBJECTS.MATH; // Safe default
}

/**
 * Check if subject requires LaTeX
 */
export function requiresLatex(subject) {
  return LATEX_SUBJECTS.has(subject);
}

/**
 * Validate content formatting
 */
export class ContentValidator {
  static validate(content, subject) {
    const errors = [];
    
    // Check for forbidden patterns
    if (content.includes('ext') && !content.includes('\\text{')) {
      errors.push('Found "ext" corruption - must use \\text{} in LaTeX');
    }
    
    // Check for malformed units
    const badUnits = ['extm', 'ms^-2', 'm/s2', 'extg', 'extkg'];
    for (const bad of badUnits) {
      if (content.includes(bad)) {
        errors.push(`Malformed unit: ${bad} - use LaTeX with \\text{}`);
      }
    }
    
    // Check LaTeX subjects have proper formatting
    if (LATEX_SUBJECTS.has(subject)) {
      // Should have LaTeX delimiters
      if (!content.includes('$') && content.length > 50) {
        errors.push('LaTeX subject missing math delimiters');
      }
    }
    
    // Check text-only subjects don't have LaTeX
    if (TEXT_ONLY_SUBJECTS.has(subject)) {
      if (content.includes('$$') || content.includes('\\frac')) {
        errors.push('Text-only subject should not contain LaTeX');
      }
    }
    
    // Check for duplication patterns
    const duplicatePatterns = [
      /H2OH2O/,
      /CO2CO2/,
      /\$.*?\$\1/, // $x$x pattern
      /(\d+)°C\1°C/ // Temperature duplication
    ];
    
    for (const pattern of duplicatePatterns) {
      if (pattern.test(content)) {
        errors.push('Found content duplication - write formulas once only');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Generate subject-specific prompt rules
 */
export function getPromptRules(subject) {
  const baseRules = `
CRITICAL FORMATTING RULES FOR ${subject}:

FORBIDDEN PATTERNS:
❌ NEVER write "ext" without \\text{}
❌ NEVER duplicate formulas: "$H_2O$H2O" 
❌ NEVER use malformed units: "extm", "m/s2"
❌ NEVER append $$ to text: "formula)$$"
`;

  if (subject === SUBJECTS.MATH || subject === SUBJECTS.PHYSICS) {
    return baseRules + `
MATH/PHYSICS RULES:
✓ ALL math in LaTeX: $x^2 + 3x - 4 = 0$
✓ Units with \\text{}: $20\\,\\text{m/s}$
✓ Block equations:
$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$
✓ Write each formula ONCE only
${subject === SUBJECTS.PHYSICS ? '✓ Vectors: $\\vec{v}$, $\\vec{a}$' : ''}
`;
  }
  
  if (subject === SUBJECTS.CHEMISTRY) {
    return baseRules + `
CHEMISTRY RULES:
✓ Chemical equations in display math:
$$
2H_2 + O_2 \\rightarrow 2H_2O
$$
✓ Subscripts in LaTeX: $H_2O$, $CO_2$
✓ Concentrations: $5.0\\,\\text{mol/L}$
✓ Write each formula ONCE only
`;
  }
  
  if (subject === SUBJECTS.ACT_SCIENCE) {
    return baseRules + `
ACT SCIENCE RULES:
✓ Text descriptions first
✓ LaTeX for calculations: $\\Delta T = T_2 - T_1$
✓ Units with \\text{}: $25\\,\\text{°C}$
✓ Data interpretation in plain English
`;
  }
  
  if (TEXT_ONLY_SUBJECTS.has(subject)) {
    return `
${subject.toUpperCase()} RULES:
✓ NO LaTeX allowed
✓ Plain English only
✓ Short paragraphs
✓ Clear structure
✓ Quoted text in italics
❌ NO math formatting
❌ NO LaTeX blocks
`;
  }
  
  return baseRules;
}

/**
 * Generate flashcard with correct format
 */
export function createFlashcard(front, back, subject) {
  return {
    front,
    back,
    subject,
    usesLatex: LATEX_SUBJECTS.has(subject)
  };
}

/**
 * Validate flashcard format
 */
export function validateFlashcard(flashcard) {
  const errors = [];
  
  if (!flashcard.subject) {
    errors.push('Missing subject classification');
  }
  
  if (flashcard.usesLatex === undefined) {
    errors.push('Missing usesLatex flag');
  }
  
  if (flashcard.usesLatex && !flashcard.front.includes('$')) {
    errors.push('LaTeX flashcard missing math delimiters');
  }
  
  if (!flashcard.usesLatex && flashcard.front.includes('\\frac')) {
    errors.push('Non-LaTeX flashcard contains LaTeX');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export default {
  SUBJECTS,
  classifySubject,
  requiresLatex,
  ContentValidator,
  getPromptRules,
  createFlashcard,
  validateFlashcard
};