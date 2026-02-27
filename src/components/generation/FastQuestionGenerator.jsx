import { base44 } from '@/api/base44Client';

// In-memory cache for AI responses
const cache = {
  questions: new Map(),
  explanations: new Map(),
  tutor: new Map()
};

// Active request tracker to prevent duplicates
let activeRequest = null;

// PHASE 2: Session-level answer distribution tracker
const sessionAnswerCounts = { A: 0, B: 0, C: 0, D: 0 };
const sessionAnswerHistory = [];

export function resetAnswerDistribution() {
  sessionAnswerCounts.A = 0;
  sessionAnswerCounts.B = 0;
  sessionAnswerCounts.C = 0;
  sessionAnswerCounts.D = 0;
  sessionAnswerHistory.length = 0;
}

/**
 * PHASE 1: Fisher-Yates shuffle of options, returns new correct index
 */
function shuffleOptions(options, correctIndex) {
  const correctAnswer = options[correctIndex];
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const newCorrectIndex = shuffled.indexOf(correctAnswer);
  return { shuffled, newCorrectIndex };
}

/**
 * PHASE 2: Enforce controlled answer distribution
 * - No 3 identical letters in a row
 * - No letter exceeds 40% frequency
 */
function enforceDistribution(options, correctIndex) {
  const letters = ['A', 'B', 'C', 'D'];
  let { shuffled, newCorrectIndex } = shuffleOptions(options, correctIndex);
  let attempts = 0;

  while (attempts < 10) {
    const letter = letters[newCorrectIndex];
    const total = Object.values(sessionAnswerCounts).reduce((a, b) => a + b, 0);
    const last2 = sessionAnswerHistory.slice(-2);
    const lastTwoSame = last2.length === 2 && last2[0] === letter && last2[1] === letter;
    const exceedsFreq = total >= 4 && (sessionAnswerCounts[letter] + 1) / (total + 1) > 0.4;

    if (!lastTwoSame && !exceedsFreq) break;

    const reshuffled = shuffleOptions(options, correctIndex);
    shuffled = reshuffled.shuffled;
    newCorrectIndex = reshuffled.newCorrectIndex;
    attempts++;
  }

  const letter = letters[newCorrectIndex];
  sessionAnswerCounts[letter]++;
  sessionAnswerHistory.push(letter);

  return { shuffled, newCorrectIndex };
}

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
  // Import subject bank system
  const { 
    validateGenerationParams, 
    validateUnitMatch,
    getUsedQuestions,
    addUsedQuestion,
    getQuestionHistory,
    addToQuestionHistory,
    isDuplicateAcrossPractices,
    hashQuestion,
    SUBJECT_BANKS
  } = await import('./SubjectBanks');

  // PHASE 1 & 2: REQUIRE SUBJECT + UNIT, resolve via switch-style map
  if (!subjectId) throw new Error('Subject missing from request');
  if (!unitId)    throw new Error('Unit missing from request');

  const { bank, unitData, bankKey } = validateGenerationParams(subjectId, unitId);

  // PHASE 2: Log every generation
  console.log(`[GENERATION] Subject ID: "${subjectId}" → Bank: "${bankKey}", Unit ${unitData.id}: "${unitData.name}"`);

  // PHASE 6: Subject-scoped cache key
  const nonce = Date.now();
  const cacheKey = `${subjectId}_${unitId}_${difficulty}_${nonce}`;
  
  // NEVER reuse cached questions across sessions
  // Each generation must be fresh

  // Cancel previous request if still pending
  if (activeRequest) {
    activeRequest = null;
  }

  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('TIMEOUT')), 3000)
  );

  // PHASE 3: USE SUBJECT-SPECIFIC SYSTEM PROMPT
  const prompt = bank.systemPrompt(unitData, count);
  
  // PHASE 6: ADD GENERATION ID FOR VARIATION
  const generationSeed = `\n\nGeneration ID: ${nonce}_${Math.random().toString(36)}`;

  // PHASE 6: INCREASE TEMPERATURE FOR MAXIMUM VARIATION
  const requestPromise = base44.integrations.Core.InvokeLLM({
    prompt: prompt + generationSeed,
    temperature: 0.85,
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
    
    // PHASE 5: GET SUBJECT/UNIT-SPECIFIC MEMORY
    const usedInSession = getUsedQuestions(subjectId, unitData.id);
    
    let validQuestions = [];
    let retryCount = 0;
    const MAX_RETRIES = 2;
    
    for (const q of result.questions) {
      // PHASE 4: HARD UNIT + CROSS-SUBJECT VALIDATION
      if (!validateUnitMatch(q, unitData, bankKey)) {
        console.warn(`[UNIT VALIDATION] Question rejected - no Unit ${unitData.id} keywords found`);
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`[REGENERATION] Attempting regeneration ${retryCount}/${MAX_RETRIES}`);
          continue;
        }
      }
      
      // PHASE 5: Check for duplicate in current session (subject/unit scoped)
      const questionHash = hashQuestion(q.question);
      if (usedInSession.has(questionHash)) {
        console.warn(`[DUPLICATE] Question repeated in ${subjectId} Unit ${unitData.id} session, skipping`);
        continue;
      }
      
      // PHASE 6: Check for duplicate across previous practices (subject/unit scoped)
      if (isDuplicateAcrossPractices(subjectId, unitData.id, questionHash)) {
        console.warn(`[DUPLICATE] Question used in previous ${subjectId} Unit ${unitData.id} practice, skipping`);
        continue;
      }
      
      validQuestions.push(q);
    }

    // PHASE 7: If not enough valid questions, throw error
    if (validQuestions.length < Math.floor(count * 0.7)) {
      throw new Error(`Unit validation failed for ${bank.name} Unit ${unitData.id}: generated ${validQuestions.length} valid questions, expected ${count}`);
    }

    const questions = validQuestions.map((q, idx) => {
      const questionHash = hashQuestion(q.question);
      
      // PHASE 5: Add to subject/unit-scoped session memory
      addUsedQuestion(subjectId, unitData.id, questionHash);
      
      // PHASE 6: Add to subject/unit-scoped cross-practice history
      addToQuestionHistory(subjectId, unitData.id, questionHash);

      // PHASE 1 & 2: Shuffle options and enforce distribution
      const { shuffled, newCorrectIndex } = enforceDistribution(q.options, q.correctIndex ?? 0);
      
      return {
        id: `q_${subjectId}_${unitData.id}_${nonce}_${idx}`,
        question_text: q.question,
        stimulus: q.stimulus,
        choice_a: shuffled[0],
        choice_b: shuffled[1],
        choice_c: shuffled[2],
        choice_d: shuffled[3],
        correct_answer: ['A', 'B', 'C', 'D'][newCorrectIndex],
        explanation: null,
        difficulty,
        subject_id: subjectId,
        unit_id: unitData.id
      };
    });

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
 * STAGE 2: DETAILED AI EXPLANATION (lazy-loaded after submission)
 */
export async function generateExplanation({
  questionId,
  stimulus,
  question,
  options,
  correctAnswer
}) {
  if (cache.explanations.has(questionId)) {
    return cache.explanations.get(questionId);
  }

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an expert AP tutor. Analyze this question and provide a comprehensive explanation.

Stimulus: ${stimulus}
Question: ${question}
Options: A) ${options[0]}  B) ${options[1]}  C) ${options[2]}  D) ${options[3]}
Correct Answer: ${correctAnswer}

Write 3-5 sentences that:
1. Explain WHY the correct answer is right
2. Clarify the underlying concept being tested
3. Help a student understand the reasoning deeply

Be direct and educational. Do not repeat the question.`,
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
 * WRONG-ANSWER FEEDBACK: Personalized explanation for the specific wrong choice
 */
export async function generateWrongAnswerFeedback({
  questionId,
  stimulus,
  question,
  selectedOptionText,
  correctOptionText,
  correctAnswer
}) {
  const cacheKey = `wrong_${questionId}_${selectedOptionText?.substring(0, 10)}`;
  if (cache.explanations.has(cacheKey)) {
    return cache.explanations.get(cacheKey);
  }

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an expert AP tutor giving personalized feedback to a student who answered incorrectly.

Stimulus: ${stimulus}
Question: ${question}
Student chose: "${selectedOptionText}" (WRONG)
Correct answer: "${correctOptionText}" (${correctAnswer})

In 2-3 sentences:
1. Explain specifically why "${selectedOptionText}" is incorrect
2. Guide the student toward the correct concept
3. Be encouraging and clear, not condescending`,
    response_json_schema: {
      type: "object",
      properties: {
        feedback: { type: "string" }
      }
    }
  });

  cache.explanations.set(cacheKey, result.feedback);
  return result.feedback;
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
 * PHASE 4: RANDOMIZED FALLBACK QUESTIONS (prevent reuse)
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
    },
    {
      stimulus: "A researcher analyzes enzyme kinetics at different substrate concentrations.",
      question: "As substrate concentration increases beyond saturation, what happens to reaction velocity?",
      choice_a: "Remains constant at Vmax",
      choice_b: "Continues to increase linearly",
      choice_c: "Decreases due to product inhibition",
      choice_d: "Fluctuates unpredictably",
      correct_answer: "A"
    },
    {
      stimulus: "The New Deal programs of the 1930s aimed to address economic depression through government intervention.",
      question: "Which New Deal agency focused primarily on providing jobs through public works?",
      choice_a: "Works Progress Administration (WPA)",
      choice_b: "Securities and Exchange Commission (SEC)",
      choice_c: "Federal Deposit Insurance Corporation (FDIC)",
      choice_d: "National Labor Relations Board (NLRB)",
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
    },
    {
      stimulus: "A function f(x) = 2x² - 8x + 6 has a vertex at x = 2.",
      question: "What is the minimum value of the function?",
      choice_a: "-2",
      choice_b: "2",
      choice_c: "6",
      choice_d: "-6",
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
    },
    {
      stimulus: "In triangle ABC, angle A = 60° and angle B = 80°.",
      question: "What is the measure of angle C?",
      choice_a: "40°",
      choice_b: "50°",
      choice_c: "60°",
      choice_d: "70°",
      correct_answer: "A"
    }
  ];

  const fallbackBank = examType === 'AP' ? apFallbacks : examType === 'SAT' ? satFallbacks : actFallbacks;
  
  // RANDOMIZE fallback selection to prevent same questions every time
  const shuffled = [...fallbackBank].sort(() => Math.random() - 0.5);
  
  return Array.from({ length: count }, (_, idx) => {
    const template = shuffled[idx % shuffled.length];
    return {
      id: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
 * PHASE 5 & 6: FORCE FRESH GENERATION
 * Clear caches and import subject bank utilities for cleanup
 */
export async function clearCache() {
  cache.questions.clear();
  cache.explanations.clear();
  cache.tutor.clear();
  resetAnswerDistribution();
  console.log('[CACHE] All caches and answer distribution cleared for fresh generation');
}