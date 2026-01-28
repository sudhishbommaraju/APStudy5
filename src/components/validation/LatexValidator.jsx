/**
 * LaTeX Validation Layer
 * HARD GATE: No malformed LaTeX reaches the UI
 */

export class LatexValidator {
  static validateLatex(latexString) {
    const errors = [];

    if (!latexString || typeof latexString !== 'string') {
      return { valid: true, errors }; // Empty is valid
    }

    // Rule 1: Check for duplication artifacts
    const duplicationPatterns = [
      /(\$[^$]+\$)\1/g, // $...$  repeated
      /([A-Z]{1,3}_?\{?\d\}?)\1{2,}/g, // CH4CH4CH4 or H2OH2O
      /(\w+ext)/g, // "ext" corruption (broken \text{})
    ];

    duplicationPatterns.forEach((pattern, idx) => {
      const matches = latexString.match(pattern);
      if (matches) {
        errors.push({
          type: 'DUPLICATION',
          message: `Detected duplicated content: "${matches[0]}"`,
          pattern: idx,
        });
      }
    });

    // Rule 2: Check for unicode math (should be LaTeX)
    const unicodePatterns = [
      { pattern: /[²³⁴⁵⁶⁷⁸⁹⁰]/g, name: 'superscript' },
      { pattern: /[₀₁₂₃₄₅₆₇₈₉]/g, name: 'subscript' },
      { pattern: /[×·÷]/g, name: 'math operators' },
      { pattern: /[≤≥≠≈]/g, name: 'comparison operators' },
    ];

    unicodePatterns.forEach(({ pattern, name }) => {
      const matches = latexString.match(pattern);
      if (matches) {
        errors.push({
          type: 'UNICODE_MATH',
          message: `Found unicode ${name} instead of LaTeX: "${matches.join('')}"`,
        });
      }
    });

    // Rule 3: Balanced braces
    const braceCount = (latexString.match(/\{/g) || []).length - (latexString.match(/\}/g) || []).length;
    if (braceCount !== 0) {
      errors.push({
        type: 'UNBALANCED_BRACES',
        message: `Braces are unbalanced (${braceCount > 0 ? 'extra opening' : 'extra closing'})`,
      });
    }

    // Rule 4: Check for "ext" corruption (broken \text{})
    if (/\dext[°C]/.test(latexString) || /ext[°C]/.test(latexString)) {
      errors.push({
        type: 'TEXT_CORRUPTION',
        message: 'Found "ext" corruption - should be \\text{°C}',
      });
    }

    // Rule 5: Inline math should use $ delimiters
    const inlineMathCount = (latexString.match(/\$/g) || []).length;
    if (inlineMathCount % 2 !== 0) {
      errors.push({
        type: 'UNMATCHED_DELIMITERS',
        message: 'Inline math delimiters ($) are not paired',
      });
    }

    // Rule 6: Display math should use $$
    const displayMathMatches = latexString.match(/\$\$/g) || [];
    if (displayMathMatches.length % 2 !== 0) {
      errors.push({
        type: 'UNMATCHED_DISPLAY_DELIMITERS',
        message: 'Display math delimiters ($$) are not paired',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static extractLatexBlocks(text) {
    const blocks = [];
    let lastIndex = 0;

    // Extract display math ($$...$$)
    const displayRegex = /\$\$([\s\S]*?)\$\$/g;
    let match;
    
    const displayMatches = [];
    while ((match = displayRegex.exec(text)) !== null) {
      displayMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        latex: match[1],
        mode: 'display'
      });
    }

    // Extract inline math ($...$)
    const inlineRegex = /\$([^$]+)\$/g;
    const inlineMatches = [];
    while ((match = inlineRegex.exec(text)) !== null) {
      // Skip if this is part of a display math block
      const isInDisplay = displayMatches.some(dm => 
        match.index >= dm.start && match.index < dm.end
      );
      if (!isInDisplay) {
        inlineMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          latex: match[1],
          mode: 'inline'
        });
      }
    }

    const allMatches = [...displayMatches, ...inlineMatches].sort((a, b) => a.start - b.start);

    allMatches.forEach(m => {
      // Add text before this match
      if (m.start > lastIndex) {
        blocks.push({
          type: 'text',
          content: text.substring(lastIndex, m.start)
        });
      }
      // Add latex block
      blocks.push({
        type: 'latex',
        mode: m.mode,
        latex: m.latex
      });
      lastIndex = m.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      blocks.push({
        type: 'text',
        content: text.substring(lastIndex)
      });
    }

    return blocks;
  }

  static validateAllFields(question) {
    const fieldsToCheck = [
      'question_text',
      'choice_a',
      'choice_b', 
      'choice_c',
      'choice_d',
      'explanation',
      'hint'
    ];

    const results = {};
    fieldsToCheck.forEach(field => {
      if (question[field]) {
        results[field] = this.validateLatex(question[field]);
      }
    });

    const allValid = Object.values(results).every(r => !r || r.valid);
    const allErrors = Object.entries(results)
      .filter(([_, r]) => r && !r.valid)
      .map(([field, r]) => ({ field, errors: r.errors }));

    return {
      valid: allValid,
      fieldResults: results,
      errors: allErrors
    };
  }
}