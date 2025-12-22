/**
 * Math Rendering Validation Layer
 * Ensures all math content is properly formatted for KaTeX rendering
 * Non-negotiable correctness for academic rigor
 */

export class MathValidator {
  static validateLatex(text) {
    if (!text) return { isValid: true, text };

    const issues = [];
    
    // Check for broken LaTeX commands
    const brokenPatterns = [
      { pattern: /\\text[^{]/, message: 'Broken \\text command - must be \\text{...}' },
      { pattern: /\\times[^{\s$]/, message: 'Improperly spaced \\times' },
      { pattern: /\^\{?[^}]*extkg/, message: 'Corrupted unit in exponent' },
      { pattern: /(\$\$[^$]*)\1/, message: 'Duplicated equation block' },
      { pattern: /[0-9.]+\\text[^{]/, message: 'Unit without proper \\text{} wrapper' },
    ];

    for (const { pattern, message } of brokenPatterns) {
      if (pattern.test(text)) {
        issues.push(message);
      }
    }

    // Check for proper math block usage
    const displayBlocks = text.match(/\$\$[\s\S]*?\$\$/g) || [];
    const inlineBlocks = text.match(/\$[^$]+\$/g) || [];
    
    // Warn if mixing inline and display inappropriately
    if (displayBlocks.length > 0 && text.includes('^') && !text.match(/\$\$[\s\S]*\^[\s\S]*\$\$/)) {
      issues.push('Caret notation (^) outside LaTeX blocks');
    }

    return {
      isValid: issues.length === 0,
      issues,
      text
    };
  }

  static sanitizeExplanation(explanation) {
    if (!explanation) return '';

    // Remove duplicate equation blocks
    let sanitized = explanation;
    const blocks = explanation.match(/\$\$[\s\S]*?\$\$/g) || [];
    const seen = new Set();
    
    blocks.forEach(block => {
      const normalized = block.replace(/\s+/g, ' ').trim();
      if (seen.has(normalized)) {
        // Remove duplicate
        sanitized = sanitized.replace(block, '');
      } else {
        seen.add(normalized);
      }
    });

    // Ensure units are properly wrapped
    sanitized = sanitized.replace(/(\d+\.?\d*)\s*([a-zA-Z]+\/?[a-zA-Z]*\^?\d*)(?!\})/g, (match, num, unit) => {
      // Don't touch if already in LaTeX
      if (match.includes('\\text{')) return match;
      return `${num} \\text{ ${unit}}`;
    });

    return sanitized.trim();
  }

  static extractMathErrors(text) {
    const errors = [];
    
    // Look for common LaTeX mistakes
    const mathBlockPattern = /\$\$([\s\S]*?)\$\$/g;
    let match;
    
    while ((match = mathBlockPattern.exec(text)) !== null) {
      const content = match[1];
      
      // Check for common errors
      if (content.includes('ext') && !content.includes('\\text')) {
        errors.push({
          type: 'broken_command',
          content: match[0],
          suggestion: 'Corrupted LaTeX command detected'
        });
      }
      
      if (/\d+[a-zA-Z]/.test(content) && !content.includes('\\text{')) {
        errors.push({
          type: 'missing_unit_wrapper',
          content: match[0],
          suggestion: 'Units should be wrapped in \\text{}'
        });
      }
    }
    
    return errors;
  }

  static formatMathStep(step) {
    // Ensure each calculation step is in its own block
    if (!step.trim().startsWith('$$')) {
      return `$$\n${step.trim()}\n$$`;
    }
    return step;
  }

  static buildStepByStepExplanation(concept, formula, given, steps, conclusion) {
    return `${concept}

The formula is:

$$
${formula}
$$

Given values:

$$
${given}
$$

${steps.map(step => this.formatMathStep(step)).join('\n\n')}

${conclusion}`;
  }
}

export default MathValidator;