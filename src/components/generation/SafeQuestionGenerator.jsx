/**
 * FAST & SAFE QUESTION GENERATOR
 * Generates questions in parallel for speed, validates for safety
 */

import { base44 } from '@/api/base44Client';
import { QuestionIntegritySystem } from '@/components/validation/QuestionIntegritySystem';
import { GenerationValidator } from '@/components/validation/GenerationValidator';
import { WatchdogTimeout } from '@/components/utils/watchdog';

export class SafeQuestionGenerator {
  
  static MAX_RETRIES = 2; // Reduced for speed
  
  /**
   * Generate questions FAST with parallel generation
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
    
    const startTime = Date.now();
    
    // Watchdog
    const checkTimeout = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > maxTimeMs) {
        throw new WatchdogTimeout(`Generation timeout after ${elapsed}ms`, 'SafeQuestionGenerator');
      }
    };
    
    onProgress({ 
      phase: 'generating', 
      current: 0, 
      total: count,
      message: 'Generating questions in parallel...'
    });

    // GENERATE ALL IN PARALLEL FOR SPEED
    const promises = [];
    for (let i = 0; i < count; i++) {
      promises.push(
        this.generateSingleWithRetry({
          subject_id,
          unit,
          skill,
          difficulty,
          attempt: 1
        })
      );
    }

    try {
      checkTimeout();
      
      // Wait for all with individual error handling
      const results = await Promise.allSettled(promises);
      
      checkTimeout();
      
      // Filter successful questions
      const validQuestions = results
        .filter(r => r.status === 'fulfilled' && r.value)
        .map(r => r.value);
      
      const errors = results
        .filter(r => r.status === 'rejected')
        .map(r => r.reason?.message || 'Generation failed');

      onProgress({
        phase: 'complete',
        current: validQuestions.length,
        total: count,
        validCount: validQuestions.length,
        errorCount: errors.length,
        message: `Generated ${validQuestions.length}/${count} questions`
      });

      if (validQuestions.length === 0) {
        return {
          success: false,
          questions: [],
          errors: ['Failed to generate any valid questions'],
          stats: {
            requested: count,
            generated: 0,
            failed: count,
            timeMs: Date.now() - startTime
          }
        };
      }

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
      
    } catch (e) {
      throw e;
    }
  }
  
  /**
   * Generate a single question with retry
   */
  static async generateSingleWithRetry({ subject_id, unit, skill, difficulty, attempt = 1 }) {
    try {
      // Call AI
      const aiResponse = await this.callAIGeneration({ subject_id, unit, skill, difficulty });
      
      // Basic validation and cleaning
      const cleanedData = GenerationValidator.validateBeforeSave({
        subject_id,
        unit_id: unit?.id || '',
        skill_id: skill?.id || '',
        unit_name: unit?.unit_name || '',
        skill_name: skill?.skill_name || 'General',
        difficulty,
        ...aiResponse
      });
      
      if (!cleanedData.valid && attempt < this.MAX_RETRIES) {
        return this.generateSingleWithRetry({ subject_id, unit, skill, difficulty, attempt: attempt + 1 });
      }
      
      if (!cleanedData.valid) {
        throw new Error(`Validation failed: ${cleanedData.errors.join(', ')}`);
      }
      
      // Add canonical representation
      const canonical = QuestionIntegritySystem.generateCanonical(aiResponse, subject_id);
      const questionData = {
        ...cleanedData.cleaned,
        canonical_representation: canonical,
        validation_status: 'valid',
        validation_errors: [],
        last_validated: new Date().toISOString()
      };
      
      // Quick integrity check
      const validation = QuestionIntegritySystem.validateQuestion(questionData);
      
      if (!validation.valid && attempt < this.MAX_RETRIES) {
        return this.generateSingleWithRetry({ subject_id, unit, skill, difficulty, attempt: attempt + 1 });
      }
      
      if (!validation.valid) {
        throw new Error(`Integrity check failed: ${validation.errors.join(', ')}`);
      }
      
      // Auto-fix computed answer if needed
      if (validation.computedAnswer) {
        questionData.correct_answer = validation.computedAnswer;
        questionData.computed_answer = validation.computedAnswer;
      }
      
      // Save to database
      const created = await base44.entities.Question.create(questionData);
      return created;
      
    } catch (e) {
      if (attempt < this.MAX_RETRIES) {
        return this.generateSingleWithRetry({ subject_id, unit, skill, difficulty, attempt: attempt + 1 });
      }
      throw e;
    }
  }
  
  /**
   * Call AI - streamlined prompt
   */
  static async callAIGeneration({ subject_id, unit, skill, difficulty }) {
    const subjects = await base44.entities.Subject.list();
    const subject = subjects.find(s => s.subject_id === subject_id);
    
    let context = `Generate a ${difficulty} difficulty multiple choice question for ${subject?.name || subject_id}.`;
    if (unit) context += ` Unit: ${unit.unit_name}.`;
    if (skill) context += ` Focus: ${skill.skill_name}.`;
    
    const prompt = `${context}

RULES:
1. Correct answer must be accurate
2. Use LaTeX for math: $x^{2}$, $CH_{4}$, $100\\text{°C}$
3. All 4 choices must be different
4. Explanation must show why answer is correct

Return JSON:
{
  "question_text": "...",
  "choice_a": "...",
  "choice_b": "...",
  "choice_c": "...",
  "choice_d": "...",
  "correct_answer": "A"|"B"|"C"|"D",
  "explanation": "...",
  "hint": "..."
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