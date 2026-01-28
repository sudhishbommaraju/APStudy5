/**
 * Master Question Validator
 * Orchestrates all validation rules
 * BLOCKS invalid questions from reaching users
 */

import { LatexValidator } from './LatexValidator';
import { AnswerValidator } from './AnswerValidator';

export class QuestionValidator {
  static validate(question) {
    const results = {
      valid: true,
      errors: [],
      warnings: [],
      fieldValidations: {},
    };

    // Phase 1: LaTeX Validation
    const latexValidation = LatexValidator.validateAllFields(question);
    results.fieldValidations.latex = latexValidation;
    
    if (!latexValidation.valid) {
      results.valid = false;
      results.errors.push({
        phase: 'LATEX_VALIDATION',
        details: latexValidation.errors,
      });
    }

    // Phase 2: MCQ Answer Validation
    if (question.choice_a && question.choice_b) {
      const mcqValidation = AnswerValidator.validateMCQ(question);
      results.fieldValidations.mcq = mcqValidation;
      
      if (!mcqValidation.valid) {
        results.valid = false;
        results.errors.push({
          phase: 'MCQ_VALIDATION',
          details: mcqValidation.errors,
        });
      }
    }

    // Phase 3: Explanation Validation
    const explanationValidation = AnswerValidator.validateExplanation(question);
    results.fieldValidations.explanation = explanationValidation;
    
    if (!explanationValidation.valid) {
      results.valid = false;
      results.errors.push({
        phase: 'EXPLANATION_VALIDATION',
        details: explanationValidation.errors,
      });
    }

    // Phase 4: Wrong Answer Explanations (warning only)
    const wrongExplanationValidation = AnswerValidator.validateWrongAnswerExplanations(question);
    if (!wrongExplanationValidation.valid) {
      results.warnings.push({
        phase: 'WRONG_EXPLANATION_VALIDATION',
        details: wrongExplanationValidation.errors,
      });
    }

    // Phase 5: Required fields
    const requiredFields = [
      'subject_id',
      'question_text',
      'choice_a',
      'choice_b',
      'choice_c',
      'choice_d',
      'correct_answer',
      'explanation',
    ];

    requiredFields.forEach(field => {
      if (!question[field]) {
        results.valid = false;
        results.errors.push({
          phase: 'REQUIRED_FIELDS',
          details: [{
            type: 'MISSING_FIELD',
            message: `Required field "${field}" is missing`,
          }],
        });
      }
    });

    return results;
  }

  static validateBatch(questions) {
    const report = {
      total: questions.length,
      valid: 0,
      invalid: 0,
      invalidQuestions: [],
    };

    questions.forEach(q => {
      const result = this.validate(q);
      if (result.valid) {
        report.valid++;
      } else {
        report.invalid++;
        report.invalidQuestions.push({
          id: q.id,
          subject: q.subject_id,
          unit: q.unit_name,
          skill: q.skill_name,
          validationResult: result,
        });
      }
    });

    return report;
  }

  static generateReport(batchResult) {
    let report = `QUESTION INTEGRITY REPORT
Generated: ${new Date().toISOString()}

SUMMARY
-------
Total Questions: ${batchResult.total}
Valid: ${batchResult.valid} (${((batchResult.valid / batchResult.total) * 100).toFixed(1)}%)
Invalid: ${batchResult.invalid} (${((batchResult.invalid / batchResult.total) * 100).toFixed(1)}%)

`;

    if (batchResult.invalid > 0) {
      report += `INVALID QUESTIONS
-----------------

`;
      batchResult.invalidQuestions.forEach((iq, idx) => {
        report += `${idx + 1}. Question ID: ${iq.id}
   Subject: ${iq.subject}
   Unit: ${iq.unit}
   Skill: ${iq.skill}
   
   Errors:
`;
        iq.validationResult.errors.forEach(err => {
          report += `   - [${err.phase}]\n`;
          err.details.forEach(detail => {
            report += `     • ${detail.message}\n`;
          });
        });
        report += '\n';
      });
    }

    return report;
  }

  static shouldBlockQuestion(question) {
    const result = this.validate(question);
    return !result.valid;
  }

  static getBlockedQuestionMessage(validationResult) {
    const errorTypes = validationResult.errors.map(e => e.phase).join(', ');
    return `This question has been blocked due to integrity issues: ${errorTypes}. An admin has been notified.`;
  }
}