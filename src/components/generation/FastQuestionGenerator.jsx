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

  const prompt = examType === 'AP' 
    ? `Generate ${count} College Board AP-level practice questions. Format:\n{"questions":[{"stimulus":"Brief context/passage (1-2 sentences)","question":"Clear question prompt","options":["A","B","C","D"],"correctIndex":0}]}\n\nMake questions rigorous, curriculum-aligned, and realistic.`
    : examType === 'SAT'
    ? `Generate ${count} College Board SAT questions. Format:\n{"questions":[{"stimulus":"Context if needed","question":"Question text","options":["A","B","C","D"],"correctIndex":0}]}\n\nSAT-level difficulty, clear and concise.`
    : `Generate ${count} ACT practice questions. Format:\n{"questions":[{"stimulus":"Passage/context","question":"Question","options":["A","B","C","D"],"correctIndex":0}]}\n\nACT-level rigor.`;

  const requestPromise = base44.integrations.Core.InvokeLLM({
    prompt,
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
  const apFallbacks = [
    {
      stimulus: "A cell biologist observes that a particular organelle contains enzymes that break down macromolecules into their component parts.",
      question: "Which organelle is most likely being observed?",
      choice_a: "Lysosome",
      choice_b: "Ribosome",
      choice_c: "Smooth endoplasmic reticulum",
      choice_d: "Golgi apparatus",
      correct_answer: "A"
    },
    {
      stimulus: "In a laboratory experiment, researchers measured the rate of photosynthesis in plant cells under varying light intensities.",
      question: "Which of the following would most likely increase as light intensity increases, up to a certain point?",
      choice_a: "ATP production in the chloroplast",
      choice_b: "Oxygen consumption by mitochondria",
      choice_c: "Carbon dioxide release",
      choice_d: "Water absorption by roots",
      correct_answer: "A"
    },
    {
      stimulus: "During the 1920s, the United States experienced significant economic growth and cultural change.",
      question: "Which of the following best describes the social impact of mass production during this period?",
      choice_a: "Increased access to consumer goods for the middle class",
      choice_b: "Decreased urbanization",
      choice_c: "Reduced immigration from Europe",
      choice_d: "Expansion of agricultural employment",
      correct_answer: "A"
    }
  ];

  const satFallbacks = [
    {
      stimulus: "If 3x + 5 = 20, what is the value of x?",
      question: "Solve for x.",
      choice_a: "5",
      choice_b: "8",
      choice_c: "10",
      choice_d: "15",
      correct_answer: "A"
    },
    {
      stimulus: "The scientist's findings were _____ by multiple independent studies.",
      question: "Which word best completes the sentence?",
      choice_a: "corroborated",
      choice_b: "contradicted",
      choice_c: "fabricated",
      choice_d: "dismissed",
      correct_answer: "A"
    }
  ];

  const actFallbacks = [
    {
      stimulus: "A rectangle has a length of 12 and a width of 5.",
      question: "What is the area of the rectangle?",
      choice_a: "60",
      choice_b: "17",
      choice_c: "34",
      choice_d: "72",
      correct_answer: "A"
    }
  ];

  const fallbackBank = examType === 'AP' ? apFallbacks : examType === 'SAT' ? satFallbacks : actFallbacks;
  
  return Array.from({ length: count }, (_, idx) => {
    const template = fallbackBank[idx % fallbackBank.length];
    return {
      id: `fallback_${Date.now()}_${idx}`,
      question_text: template.question,
      stimulus: template.stimulus,
      choice_a: template.choice_a,
      choice_b: template.choice_b,
      choice_c: template.choice_c,
      choice_d: template.choice_d,
      correct_answer: template.correct_answer,
      explanation: null,
      difficulty,
      subject_id: subjectId,
      unit_id: unitId,
      isFallback: true
    };
  });
}

/**
 * Clear cache (for testing or memory management)
 */
export function clearCache() {
  cache.questions.clear();
  cache.explanations.clear();
  cache.tutor.clear();
}