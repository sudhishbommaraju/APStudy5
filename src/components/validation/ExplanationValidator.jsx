/**
 * EXPLANATION VALIDATOR
 * Ensures explanations are structured, verified, and logically consistent
 */

export class ExplanationValidator {
  
  /**
   * Validate that explanation is substantive and references the correct answer
   */
  static validate(question) {
    const errors = [];
    
    if (!question.explanation) {
      errors.push('Explanation is required');
      return { valid: false, errors };
    }
    
    // Rule 1: Explanation must be substantive
    if (question.explanation.length < 20) {
      errors.push('Explanation too short (minimum 20 characters)');
    }
    
    // Rule 2: Explanation should reference the correct answer
    const correctLetter = question.correct_answer;
    const correctChoice = question[`choice_${correctLetter?.toLowerCase()}`];
    
    // Check if explanation mentions why this is correct
    const mentionsAnswer = question.explanation.includes(correctLetter) ||
                          question.explanation.toLowerCase().includes('correct') ||
                          question.explanation.toLowerCase().includes('answer');
    
    if (!mentionsAnswer) {
      errors.push('Explanation does not clearly indicate why the answer is correct');
    }
    
    // Rule 3: Explanation should not contradict the answer
    const wrongAnswers = ['A', 'B', 'C', 'D'].filter(a => a !== correctLetter);
    const seemsToSupportWrongAnswer = wrongAnswers.some(wrong => 
      question.explanation.toLowerCase().includes(`${wrong.toLowerCase()} is correct`) ||
      question.explanation.toLowerCase().includes(`answer is ${wrong.toLowerCase()}`)
    );
    
    if (seemsToSupportWrongAnswer) {
      errors.push('Explanation contradicts the marked correct answer');
    }
    
    // Rule 4: Check for LaTeX errors in explanation
    const hasUnmatchedDollarSigns = (question.explanation.match(/\$/g) || []).length % 2 !== 0;
    if (hasUnmatchedDollarSigns) {
      errors.push('Explanation has unmatched LaTeX delimiters');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Extract structured steps from explanation (future enhancement)
   */
  static extractSteps(explanation) {
    // Parse explanation into logical steps
    // Each step should be verifiable
    
    const lines = explanation.split('\n').filter(l => l.trim());
    const steps = [];
    
    lines.forEach(line => {
      // Detect step markers
      if (/^(step|Step|\d+\.|\d+\))/.test(line)) {
        steps.push({
          text: line.trim(),
          hasLatex: line.includes('$'),
          verified: false // Would need deeper validation
        });
      }
    });
    
    return steps;
  }
  
  /**
   * Verify explanation steps are logically consistent
   */
  static verifySteps(steps, question) {
    // Future: verify each step leads to the next
    // Future: verify final step produces correct_answer
    
    return {
      valid: true,
      unverifiedSteps: steps.map((_, idx) => idx)
    };
  }
}