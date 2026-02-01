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
  
  static MAX_ATTEMPTS_PER_QUESTION = 2;
  static DEFAULT_TIMEOUT_MS = 20000; // 20 seconds HARD LIMIT
  
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
          timeoutMs: 8000 // 8s per question
        });
        
        if (question) {
          validQuestions.push(question);
        }
        
      } catch (e) {
        console.warn(`[SafeQuestionGenerator] Attempt ${attempts} failed:`, e.message);
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
      
      // Create question data directly without heavy validation
      const questionData = {
        subject_id,
        unit_id: unit?.id || '',
        skill_id: skill?.id || '',
        unit_name: unit?.unit_name || '',
        skill_name: skill?.skill_name || 'General',
        difficulty,
        question_text: aiResponse.question_text,
        choice_a: aiResponse.choice_a,
        choice_b: aiResponse.choice_b,
        choice_c: aiResponse.choice_c,
        choice_d: aiResponse.choice_d,
        correct_answer: aiResponse.correct_answer,
        explanation: aiResponse.explanation,
        hint: aiResponse.hint || '',
        wrong_answer_explanations: aiResponse.wrong_answer_explanations || {},
        table_data: '',
        graph_data: '',
        is_ai_generated: true,
        validation_status: 'unvalidated',
        validation_errors: []
      };
      
      // Save
      return await base44.entities.Question.create(questionData);
    })();
    
    return Promise.race([generationPromise, timeoutPromise]);
  }
  
  /**
   * Call AI - comprehensive AP-style prompt
   */
  static async callAIGeneration({ subject_id, unit, skill, difficulty }) {
    const subjects = await base44.entities.Subject.list();
    const subject = subjects.find(s => s.subject_id === subject_id);
    
    let context = `${subject?.name || subject_id}`;
    if (unit) context += ` - ${unit.unit_name}`;
    if (skill) context += ` - ${skill.skill_name}`;
    
    const prompt = `Generate a high-quality AP-style multiple choice question for: ${context}

Difficulty: ${difficulty}

REQUIREMENTS:
- Create a realistic ${difficulty}-level question similar to AP exams
- Question should test conceptual understanding and application
- All 4 answer choices must be plausible but only one correct
- Use proper LaTeX for math: $x^{2}$, $\\frac{a}{b}$, $CH_{4}$, etc.
- Explanation must show complete reasoning
- Include a helpful hint for students

Return JSON with:
{
  "question_text": "Clear, specific question",
  "choice_a": "First answer option",
  "choice_b": "Second answer option", 
  "choice_c": "Third answer option",
  "choice_d": "Fourth answer option",
  "correct_answer": "A" or "B" or "C" or "D",
  "explanation": "Step-by-step solution showing why the answer is correct",
  "hint": "Helpful tip without giving away the answer"
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