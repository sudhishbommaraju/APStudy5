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
                  stimulus: { type: 'string' },
                  question: { type: 'string' },
                  options: {
                    type: 'array',
                    items: { type: 'string' },
                    minItems: 4,
                    maxItems: 4
                  },
                  correctIndex: { 
                    type: 'number',
                    minimum: 0,
                    maximum: 3
                  },
                  explanation: { type: 'string' }
                },
                required: ['stimulus', 'question', 'options', 'correctIndex', 'explanation']
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
        q.stimulus?.trim() &&
        q.question?.trim() &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        typeof q.correctIndex === 'number' &&
        q.correctIndex >= 0 &&
        q.correctIndex <= 3 &&
        q.explanation?.trim() &&
        q.explanation.split('.').length >= 3
      );

      if (validatedQuestions.length === 0) {
        throw new Error('MODEL_OUTPUT_INVALID: No valid questions after validation');
      }

      // Persist to database
      const createdQuestions = [];
      for (const q of validatedQuestions) {
        const fullStem = `**Stimulus:**\n${q.stimulus}\n\n**Question:**\n${q.question}`;
        const question = await base44.entities.ProoflyQuestion.create({
          stem: fullStem,
          answer_choices: q.options,
          correct_answer: q.correctIndex,
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
            generated_at: new Date().toISOString(),
            has_stimulus: true
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

  // FALLBACK - Return AP-style questions if all retries fail
  console.warn('[GENERATOR] All retries failed, returning fallback AP-style questions');
  const fallbackQuestions = Array.from({ length: questionCount }, (_, i) => {
    const stimulus = examType === 'AP' 
      ? `A student conducts an experiment where Variable X is manipulated across three conditions. Data shows that as X increases from 5 to 15 units, the measured outcome Y increases by 40%. Control variables are held constant throughout.`
      : `The graph below shows the relationship between two variables over a 10-year period. The trend line indicates a positive correlation with r = 0.78, suggesting a moderate to strong relationship between the variables.`;
    
    return {
      id: `fallback-${Date.now()}-${i}`,
      stem: `**Stimulus:**\n${stimulus}\n\n**Question:**\nBased on the information provided, which conclusion is most supported by the data?`,
      answer_choices: [
        'Variable X has a direct causal effect on outcome Y, as demonstrated by the controlled conditions',
        'The relationship between X and Y is purely correlational and cannot establish causation',
        'The 40% increase in Y is statistically insignificant given the sample size',
        'The control variables are the primary drivers of the observed change in Y'
      ],
      correct_answer: 1,
      explanation: 'While the experiment shows a correlation between X and Y, correlation does not prove causation. Even in controlled conditions, confounding variables or alternative explanations may exist. The question specifically asks what is "most supported," and claiming direct causation (A) oversteps the evidence. Choice C makes an unsupported claim about statistical significance, and choice D contradicts the statement that controls were held constant.',
      skill_id: skillId || subjectId || examType,
      difficulty: difficulty,
      is_active: true,
      generation_metadata: {
        exam_type: examType,
        subject_id: subjectId,
        unit_id: unitId,
        source: 'fallback',
        has_stimulus: true,
        generated_at: new Date().toISOString()
      }
    };
  });

  return {
    success: true,
    questions: fallbackQuestions,
    count: fallbackQuestions.length,
    isFallback: true
  };
}

function buildQuestionPrompt({ examType, subjectId, topic, difficulty, questionCount, questionType, keywords }) {
  const keywordText = keywords?.length > 0 ? `\nKey areas: ${keywords.join(', ')}` : '';
  
  const difficultyGuidance = {
    1: 'Single concept application with straightforward data',
    2: 'Single concept with moderate complexity',
    3: 'Cross-unit application or basic data interpretation',
    4: 'Multi-step reasoning or complex data interpretation',
    5: 'Advanced synthesis across multiple units with nuanced analysis'
  };

  const examGuidance = {
    'SAT': `SAT-style rigor - test analytical reading and mathematical reasoning`,
    'ACT': `ACT-style rigor - test interpretation and application skills`,
    'AP': `AP-level rigor - align with Course & Exam Description (CED) learning objectives`
  };

  return `Generate ${questionCount} RIGOROUS ${examType} practice questions with TRUE AP-LEVEL DEPTH.

${topic ? `Topic: ${topic}` : ''}
${subjectId ? `Subject: ${subjectId}` : ''}
Difficulty: ${difficulty}/5 - ${difficultyGuidance[difficulty]}${keywordText}

${examGuidance[examType]}

MANDATORY REQUIREMENTS - EVERY QUESTION MUST HAVE:

1. **STIMULUS (2-4 sentences OR data snippet):**
   - Real-world scenario, experimental data, passage excerpt, or graph/table
   - Provides context requiring analysis, not just recall
   - Example: "A researcher measured enzyme activity at various pH levels. At pH 7, activity was 85%. At pH 5, activity dropped to 40%. At pH 9, activity was 30%."

2. **APPLICATION-BASED QUESTION:**
   - Requires applying a concept to the stimulus
   - NOT pure definition recall
   - Must integrate stimulus information
   - Example: "Based on this data, what conclusion about enzyme optimal pH is most supported?"

3. **FOUR ANSWER CHOICES with PLAUSIBLE DISTRACTORS:**
   - ONE correct answer
   - THREE distractors that are:
     * Conceptually related to the topic
     * Based on common student misconceptions
     * Not obviously wrong
     * Could seem correct to students who partially understand
   
4. **DETAILED EXPLANATION (3-5 sentences):**
   - Why the correct answer is right
   - Why each distractor is wrong
   - Clarify the underlying concept

STRICT JSON FORMAT:
{
  "questions": [
    {
      "stimulus": "2-4 sentence scenario or data description",
      "question": "Application-based question stem",
      "options": ["Choice A", "Choice B", "Choice C", "Choice D"],
      "correctIndex": 0,
      "explanation": "3-5 sentence detailed explanation covering why the answer is correct and distractors are wrong"
    }
  ]
}

FORBIDDEN:
- Pure vocabulary definitions ("What is X?")
- Questions answerable without the stimulus
- Obviously wrong distractors
- Explanations under 3 sentences

VALIDATE: Every question must have all 5 required fields with proper content before returning.`;
}