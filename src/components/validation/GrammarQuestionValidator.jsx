/**
 * Grammar Question Validator
 * Validates SAT/ACT grammar questions for proper underline and bold formatting
 */

export class GrammarQuestionValidator {
  static validate(question, examType) {
    const errors = [];
    
    // Only validate for grammar/writing questions
    const isGrammarQuestion = this.isGrammarQuestion(question);
    if (!isGrammarQuestion) {
      return { valid: true, errors: [] };
    }

    // Rule 1: Must have exactly ONE underlined portion
    const underlineMatches = question.question_text.match(/<u>.*?<\/u>/g);
    if (!underlineMatches || underlineMatches.length === 0) {
      errors.push({
        type: 'MISSING_UNDERLINE',
        message: 'Grammar question must have an underlined portion using <u> tags',
      });
    } else if (underlineMatches.length > 1) {
      errors.push({
        type: 'MULTIPLE_UNDERLINES',
        message: 'Grammar question must have exactly ONE underlined portion',
      });
    }

    // Rule 2: Must NOT contain the word "UNDERLINED"
    if (/\bUNDERLINED\b/i.test(question.question_text)) {
      errors.push({
        type: 'CONTAINS_UNDERLINED_TEXT',
        message: 'Question text must not contain the word "UNDERLINED"',
      });
    }

    // Rule 3: Question stem must be bold
    const hasBoldQuestion = /\*\*.*?\*\*/g.test(question.question_text);
    if (!hasBoldQuestion) {
      errors.push({
        type: 'QUESTION_NOT_BOLD',
        message: 'Question stem must be bold using **text** markdown',
      });
    }

    // Rule 4: Choice A must be "NO CHANGE"
    if (question.choice_a !== 'NO CHANGE') {
      errors.push({
        type: 'CHOICE_A_NOT_NO_CHANGE',
        message: 'Choice A must be "NO CHANGE" for grammar questions',
      });
    }

    // Rule 5: Underlined text should match choice A concept
    if (underlineMatches && underlineMatches.length === 1) {
      const underlinedText = underlineMatches[0].replace(/<\/?u>/g, '').trim();
      // This is a soft check - just verify something was underlined
      if (underlinedText.length < 3) {
        errors.push({
          type: 'UNDERLINED_TOO_SHORT',
          message: 'Underlined text seems too short to be meaningful',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static isGrammarQuestion(question) {
    // Check if this is a grammar/conventions question
    const grammarKeywords = [
      'sentence structure',
      'maintains',
      'punctuation',
      'grammar',
      'convention',
      'clarity',
      'NO CHANGE',
      'best choice',
      'most effectively'
    ];

    const questionText = question.question_text.toLowerCase();
    const choiceA = question.choice_a;

    return grammarKeywords.some(keyword => questionText.includes(keyword.toLowerCase())) ||
           choiceA === 'NO CHANGE';
  }

  static hasProperFormatting(question) {
    const hasUnderline = /<u>.*?<\/u>/g.test(question.question_text);
    const hasBold = /\*\*.*?\*\*/g.test(question.question_text);
    const noUnderlinedWord = !/\bUNDERLINED\b/i.test(question.question_text);
    
    return hasUnderline && hasBold && noUnderlinedWord;
  }
}