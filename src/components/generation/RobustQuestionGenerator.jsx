import { base44 } from '@/api/base44Client';

const MAX_RETRIES = 2;
const RETRY_DELAYS = [500, 1500];

export async function generateQuestionsWithRetry({
  examType,
  subjectId = null,
  domainId = null,
  unitId = null,
  skillId = null,
  difficulty = 3,
  questionCount = 10,
  questionType = 'MCQ',
  topic = null,
  keywords = [],
  userEmail = null,
  adaptiveDifficulty = false
}) {
  // Adaptive difficulty adjustment
  if (adaptiveDifficulty && userEmail) {
    try {
      const skillPerf = await base44.entities.EngineUserSkillPerformance.filter({
        user_email: userEmail
      }, '-accuracy', 10);

      if (skillPerf.length > 0) {
        const avgAccuracy = skillPerf.reduce((sum, s) => sum + s.accuracy, 0) / skillPerf.length;
        
        if (avgAccuracy >= 85) difficulty = 5;
        else if (avgAccuracy >= 70) difficulty = 4;
        else if (avgAccuracy >= 55) difficulty = 3;
        else if (avgAccuracy >= 40) difficulty = 2;
        else difficulty = 1;
        
        console.log(`Adaptive difficulty: ${difficulty} (based on ${avgAccuracy.toFixed(1)}% accuracy)`);
      }
    } catch (error) {
      console.warn('Failed to calculate adaptive difficulty:', error);
    }
  }
  const user = await base44.auth.me();
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Log attempt
      const logEntry = await base44.entities.GenerationLog.create({
        user_email: user.email,
        type: 'QUESTIONS',
        status: attempt > 0 ? 'RETRY' : 'SUCCESS',
        attempt_number: attempt + 1,
        request_data: {
          examType,
          subjectId,
          domainId,
          unitId,
          difficulty,
          questionCount,
          questionType,
          topic
        }
      });

      const prompt = buildQuestionPrompt({
        examType,
        subjectId,
        topic,
        difficulty,
        questionCount,
        questionType,
        keywords
      });

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  stem: { type: 'string' },
                  choices: {
                    type: 'array',
                    items: { type: 'string' },
                    minItems: 4,
                    maxItems: 4
                  },
                  correctAnswerIndex: { 
                    type: 'number',
                    minimum: 0,
                    maximum: 3
                  },
                  explanation: { type: 'string' }
                },
                required: ['stem', 'choices', 'correctAnswerIndex', 'explanation']
              }
            }
          }
        }
      });

      // Validate response
      if (!response?.questions || !Array.isArray(response.questions)) {
        throw new Error('MODEL_OUTPUT_INVALID: No questions array returned');
      }

      const validatedQuestions = response.questions.filter(q => 
        q.stem?.trim() &&
        Array.isArray(q.choices) &&
        q.choices.length === 4 &&
        typeof q.correctAnswerIndex === 'number' &&
        q.correctAnswerIndex >= 0 &&
        q.correctAnswerIndex <= 3 &&
        q.explanation?.trim()
      );

      if (validatedQuestions.length === 0) {
        throw new Error('MODEL_OUTPUT_INVALID: No valid questions after validation');
      }

      // Persist to database
      const createdQuestions = [];
      for (const q of validatedQuestions) {
        const question = await base44.entities.ProoflyQuestion.create({
          stem: q.stem,
          answer_choices: q.choices,
          correct_answer: q.correctAnswerIndex,
          explanation: q.explanation,
          skill_id: skillId || subjectId || domainId || examType,
          difficulty: difficulty,
          is_active: true,
          generation_metadata: {
            exam_type: examType,
            subject_id: subjectId,
            domain_id: domainId,
            unit_id: unitId,
            topic,
            keywords,
            generated_by: user.email,
            generated_at: new Date().toISOString()
          }
        });
        createdQuestions.push(question);
      }

      // Update log with success
      await base44.entities.GenerationLog.update(logEntry.id, {
        status: 'SUCCESS',
        result_ids: createdQuestions.map(q => q.id)
      });

      return {
        success: true,
        questions: createdQuestions,
        count: createdQuestions.length
      };

    } catch (error) {
      lastError = error;
      
      // Log failure
      await base44.entities.GenerationLog.create({
        user_email: user.email,
        type: 'QUESTIONS',
        status: 'FAIL',
        error_code: error.message?.includes('MODEL_OUTPUT_INVALID') ? 'MODEL_OUTPUT_INVALID' : 'GENERATION_ERROR',
        error_message: error.message || 'Unknown error',
        attempt_number: attempt + 1,
        request_data: {
          examType,
          subjectId,
          difficulty,
          questionCount
        }
      });

      // Retry with delay if not last attempt
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
        continue;
      }
    }
  }

  // All retries failed
  return {
    success: false,
    error: lastError?.message || 'Generation failed after retries',
    errorCode: lastError?.message?.includes('MODEL_OUTPUT_INVALID') ? 'MODEL_OUTPUT_INVALID' : 'GENERATION_ERROR'
  };
}

function buildQuestionPrompt({ examType, subjectId, topic, difficulty, questionCount, questionType, keywords }) {
  const keywordText = keywords?.length > 0 ? `\nEmphasize: ${keywords.join(', ')}` : '';
  
  return `Generate ${questionCount} original ${examType} ${questionType} questions.

${topic ? `Topic: ${topic}` : ''}
${subjectId ? `Subject: ${subjectId}` : ''}
Difficulty: ${difficulty}/5${keywordText}

Requirements:
- Original content only (not from official materials)
- ${questionType === 'MCQ' ? 'Exactly 4 answer choices (A, B, C, D)' : 'Free response format'}
- One clear correct answer
- Realistic distractors based on common misconceptions
- Detailed explanation for correct answer
- Match ${examType} exam style and rigor

Return valid JSON with "questions" array. Each question must have:
- stem: question text (string, non-empty)
- choices: array of exactly 4 strings
- correctAnswerIndex: number 0-3
- explanation: string explaining the correct answer

Validate all fields before returning.`;
}