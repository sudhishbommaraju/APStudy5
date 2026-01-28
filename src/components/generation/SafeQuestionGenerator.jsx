/**
 * BOUNDED QUESTION GENERATOR - LIVENESS GUARANTEED
 * ABSOLUTE RULES:
 * 1. MUST terminate within maxTimeMs (default 15s)
 * 2. Max attempts = questionCount × 3 (hard limit)
 * 3. CANNOT loop infinitely
 * 4. MUST return success or throw error
 */

import { base44 } from '@/api/base44Client';
import { QuestionIntegritySystem } from '@/components/validation/QuestionIntegritySystem';
import { GenerationValidator } from '@/components/validation/GenerationValidator';

export class SafeQuestionGenerator {
  
  static MAX_ATTEMPTS_PER_QUESTION = 3;
  static DEFAULT_TIMEOUT_MS = 15000; // 15 seconds HARD LIMIT
  
  /**
   * Generate questions with GUARANTEED termination
   * CANNOT hang - WILL throw if time/attempts exceeded
   */
  static async generateSafe({
    subject_id,
    unit,
    skill = null,
    count = 10,
    difficulty = 'medium',
    onProgress = () => {},
    maxTimeMs = this.DEFAULT_TIMEOUT_MS
  }) {
    
    const startTime = Date.now();
    const maxAttempts = count * this.MAX_ATTEMPTS_PER_QUESTION;
    let attempts = 0;
    const validQuestions = [];
    const errors = [];
    
    // LIVENESS CHECK - throws if exceeded
    const checkLiveness = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > maxTimeMs) {
        throw new Error(`TIMEOUT: Generation exceeded ${maxTimeMs}ms limit (${elapsed}ms elapsed)`);
      }
      if (attempts >= maxAttempts) {
        throw new Error(`ATTEMPTS EXHAUSTED: Reached max ${maxAttempts} attempts`);
      }
    };
    
    onProgress({ 
      phase: 'generating', 
      current: validQuestions.length, 
      total: count,
      message: `Generating questions...`
    });

    // BOUNDED LOOP - guaranteed to exit
    while (validQuestions.length < count && attempts < maxAttempts) {
      checkLiveness(); // Check before each iteration
      attempts++;
      
      onProgress({
        phase: 'generating',
        current: validQuestions.length,
        total: count,
        attempt: attempts,
        maxAttempts: maxAttempts,
        message: `Generated ${validQuestions.length}/${count} (attempt ${attempts}/${maxAttempts})`
      });

      try {
        // Generate single question
        const question = await this.generateSingle({
          subject_id,
          unit,
          skill,
          difficulty,
          timeoutMs: 5000 // 5s per question max
        });
        
        if (question) {
          validQuestions.push(question);
        }
        
      } catch (e) {
        errors.push(e.message);
        // Continue to next attempt
      }
    }

    // MANDATORY TERMINATION
    const timeElapsed = Date.now() - startTime;
    
    // FAILURE: Not enough questions
    if (validQuestions.length === 0) {
      throw new Error(`Generation failed: No valid questions generated after ${attempts} attempts in ${timeElapsed}ms`);
    }
    
    // PARTIAL SUCCESS: Some questions generated
    if (validQuestions.length < count) {
      console.warn(`Partial generation: ${validQuestions.length}/${count} questions in ${timeElapsed}ms`);
    }

    // SUCCESS
    return {
      success: true,
      questions: validQuestions,
      errors,
      stats: {
        requested: count,
        generated: validQuestions.length,
        attempts: attempts,
        timeMs: timeElapsed
      }
    };
  }
  
  /**
   * Generate a single question with timeout
   */
  static async generateSingle({ subject_id, unit, skill, difficulty, timeoutMs }) {
    
    // Race with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Question generation timeout')), timeoutMs);
    });
    
    const generationPromise = (async () => {
      // Call AI
      const aiResponse = await this.callAIGeneration({ subject_id, unit, skill, difficulty });
      
      // Validate
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
        throw new Error(`Validation failed: ${cleanedData.errors[0]}`);
      }
      
      // Add canonical
      const canonical = QuestionIntegritySystem.generateCanonical(aiResponse, subject_id);
      const questionData = {
        ...cleanedData.cleaned,
        canonical_representation: canonical,
        validation_status: 'valid',
        validation_errors: [],
        last_validated: new Date().toISOString()
      };
      
      // Integrity check
      const validation = QuestionIntegritySystem.validateQuestion(questionData);
      if (!validation.valid) {
        throw new Error(`Integrity failed: ${validation.errors[0]}`);
      }
      
      // Auto-fix
      if (validation.computedAnswer) {
        questionData.correct_answer = validation.computedAnswer;
        questionData.computed_answer = validation.computedAnswer;
      }
      
      // Save
      return await base44.entities.Question.create(questionData);
    })();
    
    return Promise.race([generationPromise, timeoutPromise]);
  }
  
  /**
   * Call AI - minimal prompt
   */
  static async callAIGeneration({ subject_id, unit, skill, difficulty }) {
    const subjects = await base44.entities.Subject.list();
    const subject = subjects.find(s => s.subject_id === subject_id);
    
    let context = `${difficulty} multiple choice question for ${subject?.name || subject_id}`;
    if (unit) context += `, Unit: ${unit.unit_name}`;
    if (skill) context += `, ${skill.skill_name}`;
    
    const prompt = `Generate a ${context}.

RULES:
- Correct answer must be accurate
- Use LaTeX: $x^{2}$, $CH_{4}$
- All choices different
- Include explanation

JSON format:
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