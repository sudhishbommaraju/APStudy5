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
  adaptiveDifficulty = true
}) {
  console.log('[GENERATOR] Starting generation with:', { examType, subjectId, unitId, difficulty, questionCount });
  
  const user = await base44.auth.me();

  // ALWAYS analyze user performance to generate adaptive questions
  if (userEmail || user?.email) {
    try {
      const email = userEmail || user.email;
      
      // Get user's skill performance history
      const skillPerf = await base44.entities.EngineUserSkillPerformance.filter({
        user_email: email
      }, '-accuracy', 20);

      if (skillPerf.length > 0) {
        // Calculate overall accuracy
        const avgAccuracy = skillPerf.reduce((sum, s) => sum + s.accuracy, 0) / skillPerf.length;
        
        // Find weak skills (accuracy < 60%)
        const weakSkills = skillPerf.filter(s => s.accuracy < 60 && s.attempts >= 3);
        
        // Adaptive difficulty based on overall performance
        if (avgAccuracy >= 85) difficulty = 5;
        else if (avgAccuracy >= 75) difficulty = 4;
        else if (avgAccuracy >= 60) difficulty = 3;
        else if (avgAccuracy >= 45) difficulty = 2;
        else difficulty = 1;
        
        console.log(`[ADAPTIVE] User accuracy: ${avgAccuracy.toFixed(1)}% → Difficulty: ${difficulty}/5`);
        console.log(`[ADAPTIVE] Weak skills (${weakSkills.length}):`, weakSkills.map(s => s.skill_id));
        
        // If user has weak skills in this subject, override to focus there
        if (weakSkills.length > 0 && subjectId) {
          const weakInSubject = weakSkills.find(s => s.skill_id === subjectId);
          if (weakInSubject) {
            console.log(`[ADAPTIVE] Focusing on weak area: ${weakInSubject.skill_id} (${weakInSubject.accuracy.toFixed(1)}%)`);
          }
        }
      } else {
        console.log('[ADAPTIVE] No performance history - using default difficulty');
      }
    } catch (error) {
      console.warn('[ADAPTIVE] Failed to load performance data:', error);
    }
  }
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

  // FALLBACK - Return mock questions if all retries fail
  console.warn('[GENERATOR] All retries failed, returning fallback questions');
  const fallbackQuestions = Array.from({ length: questionCount }, (_, i) => ({
    id: `fallback-${Date.now()}-${i}`,
    stem: `Practice Question ${i + 1}: This is a sample ${examType} question for ${subjectId || 'general'} practice.`,
    answer_choices: [
      'Option A - First possible answer',
      'Option B - Second possible answer',
      'Option C - Third possible answer',
      'Option D - Fourth possible answer'
    ],
    correct_answer: Math.floor(Math.random() * 4),
    explanation: 'This is a fallback question. Your AI generation temporarily failed, so we provided sample questions to keep you practicing.',
    skill_id: skillId || subjectId || examType,
    difficulty: difficulty,
    is_active: true,
    generation_metadata: {
      exam_type: examType,
      subject_id: subjectId,
      unit_id: unitId,
      source: 'fallback',
      generated_at: new Date().toISOString()
    }
  }));

  return {
    success: true,
    questions: fallbackQuestions,
    count: fallbackQuestions.length,
    isFallback: true
  };
}

function buildQuestionPrompt({ examType, subjectId, topic, difficulty, questionCount, questionType, keywords }) {
  const keywordText = keywords?.length > 0 ? `\nKey areas: ${keywords.join(', ')}` : '';
  
  // Exam-specific guidance
  const examGuidance = {
    'SAT': `Follow College Board SAT skill taxonomy:
- Reading & Writing: Craft & Structure, Information & Ideas, Standard English Conventions, Expression of Ideas
- Math: Algebra, Advanced Math, Problem-Solving & Data Analysis, Geometry & Trigonometry`,
    'ACT': `Follow ACT skill framework:
- English: Production of Writing, Knowledge of Language, Conventions of Standard English
- Math: Number & Quantity, Algebra, Functions, Geometry, Statistics & Probability
- Reading: Key Ideas & Details, Craft & Structure, Integration of Knowledge
- Science: Interpretation of Data, Scientific Investigation, Evaluation of Models`,
    'AP': `Follow College Board AP skill practices and unit frameworks.
Align with Course & Exam Description (CED) learning objectives.`
  };

  return `Generate ${questionCount} ORIGINAL ${examType} practice questions.

CRITICAL: These are Proofly-generated questions, NOT from official College Board materials.
Align with ${examType} skill taxonomy and exam format, but use entirely original content.

${topic ? `Topic: ${topic}` : ''}
${subjectId ? `Subject: ${subjectId}` : ''}
Difficulty: ${difficulty}/5 (1=beginner, 5=expert)${keywordText}

${examGuidance[examType] || ''}

Question Requirements:
- ${questionType === 'MCQ' ? 'Exactly 4 answer choices' : 'Free response format'}
- One definitively correct answer
- Realistic distractors based on common student misconceptions
- Clear, educational explanation
- Match ${examType} style, rigor, and cognitive demand

Return valid JSON:
{
  "questions": [
    {
      "stem": "question text (clear, complete)",
      "choices": ["A option", "B option", "C option", "D option"],
      "correctAnswerIndex": 0-3,
      "explanation": "why the correct answer is right and others are wrong"
    }
  ]
}

Validate all fields before returning. No placeholders or incomplete questions.`;
}