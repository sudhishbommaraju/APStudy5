import { base44 } from '@/api/base44Client';
import { validateTopicAlignment, getUnitTopics } from './APCurriculumMap';
import { detectTopicsFromQuestion, detectTopicsFromKeywords } from './TopicDetector';

// Generate questions with strict curriculum alignment
export async function generateCurriculumAlignedQuestions({
  subjectId,
  unitId,
  promptOverride = null,
  questionCount = 10,
  maxRetries = 3,
  examType = 'physics_1'
}) {
  const allowedTopics = getUnitTopics(subjectId, unitId);

  if (!allowedTopics || allowedTopics.length === 0) {
    throw new Error(`No curriculum data found for ${subjectId} unit ${unitId}`);
  }

  const systemPrompt = `You are an AP ${subjectId} question writer. CRITICAL CONSTRAINT: All questions MUST ONLY use concepts from this approved topic list:

${allowedTopics.map(t => `- ${t}`).join('\n')}

Do NOT include concepts from other units. Do NOT introduce future topics. Every question must strictly test ONLY these approved topics.`;

  let questions = [];
  let attempts = 0;

  while (questions.length < questionCount && attempts < maxRetries) {
    attempts++;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}

${promptOverride || `Generate ${questionCount - questions.length} AP-style multiple choice questions testing ONLY the approved topics above.`}

Return JSON with questions array. Each question must have: question_text, choice_a, choice_b, choice_c, choice_d, correct_answer (A-D), explanation.`,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question_text: { type: 'string' },
                  choice_a: { type: 'string' },
                  choice_b: { type: 'string' },
                  choice_c: { type: 'string' },
                  choice_d: { type: 'string' },
                  correct_answer: { type: 'string' },
                  explanation: { type: 'string' }
                }
              }
            }
          }
        }
      });

      // Validate each question for curriculum alignment
      for (const q of result?.questions || []) {
        // Fast keyword detection first
        const detectedTopics = detectTopicsFromKeywords(
          `${q.question_text} ${q.explanation}`,
          examType
        );

        // Validate alignment
        const validation = validateTopicAlignment(subjectId, unitId, detectedTopics);

        if (validation.isAligned) {
          // Add metadata
          questions.push({
            ...q,
            answer_choices: [q.choice_a, q.choice_b, q.choice_c, q.choice_d],
            detected_topics: detectedTopics,
            curriculum_aligned: true
          });
        } else {
          console.warn(
            `Question rejected: misaligned topics [${validation.misalignedTopics.join(', ')}]`
          );
          // Silently skip; will regenerate
        }

        if (questions.length >= questionCount) break;
      }
    } catch (e) {
      console.error(`Generation attempt ${attempts} failed:`, e);
    }
  }

  if (questions.length === 0) {
    throw new Error(
      `Failed to generate curriculum-aligned questions after ${maxRetries} attempts`
    );
  }

  console.log(
    `Generated ${questions.length}/${questionCount} curriculum-aligned questions (${attempts} attempt(s))`
  );

  return questions;
}

// Validate and fix existing questions for alignment
export async function validateQuestionAlignment(question, subjectId, unitId, examType = 'physics_1') {
  const detectedTopics = detectTopicsFromKeywords(
    `${question.question_text} ${question.explanation}`,
    examType
  );

  const validation = validateTopicAlignment(subjectId, unitId, detectedTopics);

  return {
    ...question,
    curriculum_check: {
      isAligned: validation.isAligned,
      detectedTopics,
      misalignedTopics: validation.misalignedTopics,
      allowedTopics: validation.allowedTopics
    }
  };
}