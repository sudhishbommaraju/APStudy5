import { base44 } from '@/api/base44Client';

// In-memory cache for AI responses
const cache = {
  questions: new Map(),
  explanations: new Map(),
  tutor: new Map()
};

// Active request tracker to prevent duplicates
let activeRequest = null;

/**
 * STAGE 1: ULTRA-FAST QUESTION GENERATION
 * - Single API call
 * - Minimal tokens
 * - No explanations
 * - <2s target
 */
export async function generateQuestionsOptimized({
  examType = 'AP',
  subjectId,
  unitId,
  difficulty = 'mixed',
  count = 5
}) {
  const cacheKey = `${examType}_${subjectId}_${unitId}_${difficulty}_${count}`;
  
  // Check cache first
  if (cache.questions.has(cacheKey)) {
    return cache.questions.get(cacheKey);
  }

  // Cancel previous request if still pending
  if (activeRequest) {
    activeRequest = null;
  }

  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('TIMEOUT')), 3000)
  );

  const requestPromise = base44.integrations.Core.InvokeLLM({
    prompt: `${count} ${examType} ${difficulty} Q's. JSON:\n{"questions":[{"stimulus":"2 sent max","question":"1 sent","options":["A","B","C","D"],"correctIndex":0}]}`,
    response_json_schema: {
      type: "object",
      properties: {
        questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              stimulus: { type: "string" },
              question: { type: "string" },
              options: { type: "array", items: { type: "string" } },
              correctIndex: { type: "number" }
            }
          }
        }
      }
    }
  });

  activeRequest = requestPromise;

  try {
    const result = await Promise.race([requestPromise, timeoutPromise]);
    const questions = result.questions.map((q, idx) => ({
      id: `q_${Date.now()}_${idx}`,
      question_text: q.question,
      stimulus: q.stimulus,
      choice_a: q.options[0],
      choice_b: q.options[1],
      choice_c: q.options[2],
      choice_d: q.options[3],
      correct_answer: ['A', 'B', 'C', 'D'][q.correctIndex],
      explanation: null,
      difficulty,
      subject_id: subjectId,
      unit_id: unitId
    }));

    cache.questions.set(cacheKey, questions);
    return questions;
  } catch (error) {
    if (error.message === 'TIMEOUT') {
      return getFallbackQuestions(count, examType, difficulty, subjectId, unitId);
    }
    throw error;
  } finally {
    activeRequest = null;
  }
}

/**
 * STAGE 2: LAZY LOAD EXPLANATION
 * Only called after user submits answer
 */
export async function generateExplanation({
  questionId,
  stimulus,
  question,
  options,
  selectedAnswer,
  correctAnswer
}) {
  // Check cache
  if (cache.explanations.has(questionId)) {
    return cache.explanations.get(questionId);
  }

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `${stimulus} ${question}\nA)${options[0]} B)${options[1]} C)${options[2]} D)${options[3]}\nWhy ${correctAnswer}? Max 3 sent.`,
    response_json_schema: {
      type: "object",
      properties: {
        explanation: { type: "string" }
      }
    }
  });

  cache.explanations.set(questionId, result.explanation);
  return result.explanation;
}

/**
 * LAZY LOAD AI TUTOR HINT
 */
export async function generateHint({ questionId, stimulus, question }) {
  const cacheKey = `hint_${questionId}`;
  if (cache.tutor.has(cacheKey)) {
    return cache.tutor.get(cacheKey);
  }

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Hint for: ${stimulus} ${question}\n2 sent max.`,
    response_json_schema: {
      type: "object",
      properties: { hint: { type: "string" } }
    }
  });

  cache.tutor.set(cacheKey, result.hint);
  return result.hint;
}

/**
 * LAZY LOAD AI TUTOR STRATEGY
 */
export async function generateStrategy({ questionId, question }) {
  const cacheKey = `strategy_${questionId}`;
  if (cache.tutor.has(cacheKey)) {
    return cache.tutor.get(cacheKey);
  }

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Strategy: ${question}\n3 sent max.`,
    response_json_schema: {
      type: "object",
      properties: { strategy: { type: "string" } }
    }
  });

  cache.tutor.set(cacheKey, result.strategy);
  return result.strategy;
}

/**
 * FALLBACK QUESTIONS (if AI fails or times out)
 */
function getFallbackQuestions(count, examType, difficulty, subjectId, unitId) {
  return Array.from({ length: count }, (_, idx) => ({
    id: `fallback_${Date.now()}_${idx}`,
    question_text: "Practice question (generated offline)",
    stimulus: "This is a sample practice question.",
    choice_a: "Option A",
    choice_b: "Option B",
    choice_c: "Option C",
    choice_d: "Option D",
    correct_answer: "A",
    explanation: null,
    difficulty,
    subject_id: subjectId,
    unit_id: unitId,
    isFallback: true
  }));
}

/**
 * Clear cache (for testing or memory management)
 */
export function clearCache() {
  cache.questions.clear();
  cache.explanations.clear();
  cache.tutor.clear();
}