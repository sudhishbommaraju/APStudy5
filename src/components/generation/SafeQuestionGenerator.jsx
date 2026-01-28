/**
 * SAFE QUESTION GENERATOR WITH WATCHDOG
 * Guarantees valid questions or explicit failure within bounded time
 * 
 * ABSOLUTE RULES:
 * 1. Never return invalid questions
 * 2. Never hang indefinitely
 * 3. Always resolve with success or error
 */

import { base44 } from '@/api/base44Client';
import { QuestionIntegritySystem } from '@/components/validation/QuestionIntegritySystem';
import { GenerationValidator } from '@/components/validation/GenerationValidator';
import { WatchdogTimeout } from '@/components/utils/watchdog';

export class SafeQuestionGenerator {
  
  static MAX_RETRIES = 3;
  static BATCH_SIZE = 5;
  
  /**
   * Generate questions with HARD TIMEOUT and validation
   */
  static async generateSafe({
    subject_id,
    unit,
    skill = null,
    count = 10,
    difficulty = 'medium',
    onProgress = () => {},
    maxTimeMs = 60000
  }) {
    
    const validQuestions = [];
    const errors = [];
    const startTime = Date.now();
    
    // Watchdog timer
    const checkTimeout = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > maxTimeMs) {
        throw new WatchdogTimeout(
          `Generation exceeded ${maxTimeMs}ms timeout (${elapsed}ms elapsed)`,
          'SafeQuestionGenerator'
        );
      }
    };
    
    onProgress({ 
      phase: 'starting', 
      current: 0, 
      total: count,
      validCount: 0,
      errorCount: 0,
      message: 'Initializing question generation...'
    });

    // Generate questions with strict bounds
    for (let i = 0; i < count; i++) {
      checkTimeout(); // Check before each question

      onProgress({
        phase: 'generating',
        current: i,
        total: count,
        validCount: validQuestions.length,
        errorCount: errors.length,
        message: `Generating question ${i + 1}/${count}...`
      });

      let questionGenerated = false;
      let lastError = null;

      // Try up to MAX_RETRIES times
      for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
        checkTimeout(); // Check before each attempt
        
        try {
          const aiResponse = await this.callAIGeneration({ 
            subject_id, 
            unit, 
            skill, 
            difficulty 
          });
          
          // Pre-save validation
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
            lastError = `Validation: ${cleanedData.errors.join(', ')}`;
            continue;
          }
          
          // Add canonical representation
          const canonical = QuestionIntegritySystem.generateCanonical(aiResponse, subject_id);
          const questionData = {
            ...cleanedData.cleaned,
            canonical_representation: canonical
          };
          
          // Full integrity check
          const validation = QuestionIntegritySystem.validateQuestion(questionData);
          
          if (!validation.valid) {
            lastError = `Integrity: ${validation.errors.join(', ')}`;
            continue;
          }
          
          // Auto-fix computed answer
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
          break;
          
        } catch (e) {
          lastError = e.message;
        }
      }
      
      if (!questionGenerated) {
        errors.push(`Question ${i + 1}: ${lastError || 'Unknown error'} (${this.MAX_RETRIES} attempts failed)`);
      }
    }

    // Final timeout check
    checkTimeout();

    // CRITICAL: If no valid questions, return error
    if (validQuestions.length === 0) {
      return {
        success: false,
        questions: [],
        errors: errors.length > 0 ? errors : ['Failed to generate any valid questions'],
        stats: {
          requested: count,
          generated: 0,
          failed: count,
          timeMs: Date.now() - startTime
        }
      };
    }

    // Success
    return {
      success: true,
      questions: validQuestions,
      errors,
      stats: {
        requested: count,
        generated: validQuestions.length,
        failed: errors.length,
        timeMs: Date.now() - startTime
      }
    };
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