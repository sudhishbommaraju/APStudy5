/**
 * SAFE QUESTION GENERATOR
 * Guarantees valid questions or explicit failure - NEVER silent errors
 * 
 * ABSOLUTE RULE: Never return invalid questions to the UI
 */

import { base44 } from '@/api/base44Client';
import { QuestionIntegritySystem } from '@/components/validation/QuestionIntegritySystem';
import { GenerationValidator } from '@/components/validation/GenerationValidator';

export class SafeQuestionGenerator {
  
  static MAX_RETRIES = 3;
  static BATCH_SIZE = 5; // Generate in batches for better UX
  
  /**
   * Generate questions with full validation and retry logic
   * Returns { success: boolean, questions: Question[], errors: string[] }
   */
  static async generateSafe({
    subject_id,
    unit,
    skill,
    count = 10,
    difficulty = 'medium',
    onProgress = null
  }) {
    
    const validQuestions = [];
    const allErrors = [];
    
    // Generate in batches
    const batches = Math.ceil(count / this.BATCH_SIZE);
    
    for (let batchIdx = 0; batchIdx < batches; batchIdx++) {
      const batchSize = Math.min(this.BATCH_SIZE, count - validQuestions.length);
      
      if (onProgress) {
        onProgress({
          phase: 'generating',
          current: validQuestions.length,
          total: count,
          message: `Generating questions ${validQuestions.length + 1}-${validQuestions.length + batchSize}...`
        });
      }
      
      const batchResults = await this.generateBatch({
        subject_id,
        unit,
        skill,
        count: batchSize,
        difficulty
      });
      
      validQuestions.push(...batchResults.questions);
      allErrors.push(...batchResults.errors);
      
      // If we still don't have enough valid questions, continue
      if (validQuestions.length < count) {
        continue;
      } else {
        break;
      }
    }
    
    // Final check
    if (validQuestions.length === 0) {
      return {
        success: false,
        questions: [],
        errors: allErrors.length > 0 ? allErrors : ['Failed to generate any valid questions']
      };
    }
    
    // Trim to exact count requested
    return {
      success: true,
      questions: validQuestions.slice(0, count),
      errors: allErrors
    };
  }
  
  /**
   * Generate a single batch with validation and retry
   */
  static async generateBatch({ subject_id, unit, skill, count, difficulty }) {
    const validQuestions = [];
    const errors = [];
    
    for (let i = 0; i < count; i++) {
      let attempts = 0;
      let questionGenerated = false;
      
      while (attempts < this.MAX_RETRIES && !questionGenerated) {
        attempts++;
        
        try {
          const aiResponse = await this.callAIGeneration({ subject_id, unit, skill, difficulty });
          
          // Pre-save validation and cleaning
          const cleanedData = GenerationValidator.validateBeforeSave({
            subject_id,
            unit_id: unit?.id || '',
            skill_id: skill?.id || '',
            unit_name: unit?.unit_name || '',
            skill_name: skill?.skill_name || 'General',
            difficulty,
            ...aiResponse
          });
          
          if (!cleanedData.valid) {
            errors.push(`Attempt ${attempts}: ${cleanedData.errors.join(', ')}`);
            continue;
          }
          
          // Add canonical representation
          const canonical = QuestionIntegritySystem.generateCanonical(aiResponse, subject_id);
          const questionData = {
            ...cleanedData.cleaned,
            canonical_representation: canonical
          };
          
          // Validate with full integrity system
          const validation = QuestionIntegritySystem.validateQuestion(questionData);
          
          if (!validation.valid) {
            errors.push(`Integrity check failed (attempt ${attempts}): ${validation.errors.join(', ')}`);
            continue;
          }
          
          // Auto-fix if computed answer differs
          if (validation.computedAnswer && validation.computedAnswer !== questionData.correct_answer) {
            questionData.correct_answer = validation.computedAnswer;
          }
          
          // Mark as validated
          questionData.validation_status = 'valid';
          questionData.validation_errors = [];
          questionData.last_validated = new Date().toISOString();
          questionData.computed_answer = validation.computedAnswer || questionData.correct_answer;
          
          // Save to database
          const created = await base44.entities.Question.create(questionData);
          validQuestions.push(created);
          questionGenerated = true;
          
        } catch (e) {
          errors.push(`Generation error (attempt ${attempts}): ${e.message}`);
        }
      }
      
      if (!questionGenerated) {
        errors.push(`Failed to generate valid question after ${this.MAX_RETRIES} attempts`);
      }
    }
    
    return { questions: validQuestions, errors };
  }
  
  /**
   * Call AI to generate question content
   */
  static async callAIGeneration({ subject_id, unit, skill, difficulty }) {
    const subjects = await base44.entities.Subject.list();
    const subject = subjects.find(s => s.subject_id === subject_id);
    
    let contextInstructions = `Generate an exam-style multiple choice question for ${subject?.name || subject_id}.`;
    if (unit) contextInstructions += ` Unit: ${unit.unit_name}.`;
    if (skill) contextInstructions += ` Focus on: ${skill.skill_name}.`;
    
    const prompt = `${contextInstructions}

CRITICAL CONTENT QUALITY RULES:

1. ANSWER CORRECTNESS:
   - The correct answer must be mathematically/scientifically ACCURATE
   - Verify your answer before outputting
   - For math: compute the actual numeric result
   - For physics: check units and calculations
   - For chemistry: verify stoichiometry

2. LATEX FORMATTING:
   ✅ CORRECT: "$x^{2} + 5x - 3$"
   ✅ CORRECT: "$CH_{4}$"
   ✅ CORRECT: "$100\\text{°C}$"
   ❌ WRONG: "$x^{2}$x2" (duplication)
   ❌ WRONG: "CH₄" (unicode subscript)
   ❌ WRONG: "100ext°C" (broken \\text)

3. DISTINCT ANSWER CHOICES:
   - Each choice (A, B, C, D) must be COMPLETELY different
   - NO two choices can have the same numeric value
   - NO two choices can mean the same thing
   - NO duplicated formulas or concepts

4. EXPLANATION MUST:
   - Explain WHY the answer is correct
   - Show step-by-step reasoning
   - Reference the specific choice letter

Return JSON with:
{
  "question_text": "...",
  "choice_a": "...",
  "choice_b": "...",
  "choice_c": "...",
  "choice_d": "...",
  "correct_answer": "A" | "B" | "C" | "D",
  "explanation": "Step-by-step explanation showing why the answer is correct",
  "hint": "Optional hint"
}`;

    return await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          question_text: { type: 'string' },
          choice_a: { type: 'string' },
          choice_b: { type: 'string' },
          choice_c: { type: 'string' },
          choice_d: { type: 'string' },
          correct_answer: { type: 'string' },
          explanation: { type: 'string' },
          hint: { type: 'string' }
        },
        required: ['question_text', 'choice_a', 'choice_b', 'choice_c', 'choice_d', 'correct_answer', 'explanation']
      }
    });
  }
}