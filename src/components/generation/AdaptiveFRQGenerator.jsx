import { base44 } from '@/api/base44Client';

const MAX_RETRIES = 2;

export async function generateFRQWithRetry({
  examType,
  subjectId = null,
  unitId = null,
  difficulty = 3,
  questionCount = 5,
  topic = null,
  keywords = []
}) {
  const user = await base44.auth.me();
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const logEntry = await base44.entities.GenerationLog.create({
        user_email: user.email,
        type: 'QUESTIONS',
        status: attempt > 0 ? 'RETRY' : 'SUCCESS',
        attempt_number: attempt + 1,
        request_data: {
          examType,
          subjectId,
          type: 'FRQ',
          difficulty,
          questionCount
        }
      });

      const prompt = buildFRQPrompt({
        examType,
        subjectId,
        topic,
        difficulty,
        questionCount,
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
                  rubric: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        criterion: { type: 'string' },
                        points: { type: 'number' },
                        description: { type: 'string' }
                      }
                    }
                  },
                  totalPoints: { type: 'number' },
                  sampleAnswer: { type: 'string' }
                },
                required: ['stem', 'rubric', 'totalPoints', 'sampleAnswer']
              }
            }
          }
        }
      });

      if (!response?.questions || !Array.isArray(response.questions)) {
        throw new Error('MODEL_OUTPUT_INVALID: No questions array returned');
      }

      const validatedQuestions = response.questions.filter(q => 
        q.stem?.trim() &&
        Array.isArray(q.rubric) &&
        q.rubric.length > 0 &&
        typeof q.totalPoints === 'number' &&
        q.sampleAnswer?.trim()
      );

      if (validatedQuestions.length === 0) {
        throw new Error('MODEL_OUTPUT_INVALID: No valid FRQ questions after validation');
      }

      const createdQuestions = [];
      for (const q of validatedQuestions) {
        const question = await base44.entities.APFRQPrompt.create({
          subject_id: subjectId,
          unit_id: unitId,
          prompt_text: q.stem,
          rubric_criteria: q.rubric,
          total_points: q.totalPoints,
          difficulty: difficulty,
          is_active: true
        });
        createdQuestions.push(question);
      }

      await base44.entities.GenerationLog.update(logEntry.id, {
        status: 'SUCCESS',
        result_ids: createdQuestions.map(q => q.id)
      });

      return {
        success: true,
        questions: createdQuestions,
        count: createdQuestions.length,
        type: 'FRQ'
      };

    } catch (error) {
      lastError = error;
      await base44.entities.GenerationLog.create({
        user_email: user.email,
        type: 'QUESTIONS',
        status: 'FAIL',
        error_message: error.message
      });

      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
        continue;
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'FRQ generation failed',
    type: 'FRQ'
  };
}

function buildFRQPrompt({ examType, subjectId, topic, difficulty, questionCount, keywords }) {
  const keywordText = keywords?.length > 0 ? `Focus on: ${keywords.join(', ')}\n\n` : '';
  
  return `Generate ${questionCount} original ${examType} Free Response Questions (FRQs).

${topic ? `Topic: ${topic}\n` : ''}${keywordText}Difficulty: ${difficulty}/5

Requirements:
- Original content (not from official materials)
- Clear, concise prompts that elicit substantive responses
- Comprehensive rubric with 3-5 criteria
- Each criterion worth specific points
- Total points: 5-10 points per question
- Include sample answer demonstrating mastery

Return valid JSON with "questions" array. Each question must have:
- stem: the FRQ prompt (string, non-empty)
- rubric: array of {criterion, points, description}
- totalPoints: number (5-10)
- sampleAnswer: example response showing mastery

Validate all fields before returning.`;
}

export async function getAdaptiveDifficulty(userAccuracy, currentDifficulty) {
  // Increase difficulty if accuracy > 80%, decrease if < 60%
  if (userAccuracy > 80 && currentDifficulty < 5) {
    return Math.min(currentDifficulty + 1, 5);
  } else if (userAccuracy < 60 && currentDifficulty > 1) {
    return Math.max(currentDifficulty - 1, 1);
  }
  return currentDifficulty;
}