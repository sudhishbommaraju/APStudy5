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
  // PHASE 1: ENFORCE SUBJECT LOCK
  if (!subjectId) {
    throw new Error('Subject ID is required for question generation');
  }

  // PHASE 2: ADD SUBJECT + NONCE TO CACHE KEY
  const nonce = Date.now();
  const cacheKey = `${examType}_${subjectId}_${unitId}_${difficulty}_${nonce}`;
  
  // NEVER reuse cached questions across sessions
  // Each generation must be fresh

  // Cancel previous request if still pending
  if (activeRequest) {
    activeRequest = null;
  }

  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('TIMEOUT')), 3000)
  );

  // PHASE 1: ENFORCE SUBJECT IN PROMPT
  const subjectContext = subjectId ? `\n\nCRITICAL SUBJECT LOCK: You are generating questions STRICTLY for the subject: ${subjectId}.\nYou must ONLY generate content from this subject.\nAll terminology, concepts, and examples MUST match ${subjectId} curriculum.\nDo NOT mix subjects. If subject is Biology, generate ONLY Biology questions.\nIf subject is US History, generate ONLY US History questions.` : '';

  // PHASE 3: ADD DYNAMIC NONCE FOR VARIATION
  const generationSeed = `\n\nGeneration seed: ${nonce}`;

  const prompt = examType === 'AP' 
    ? `Generate ${count} College Board AP-level practice questions. Format:\n{"questions":[{"stimulus":"Brief context/passage (1-2 sentences)","question":"Clear question prompt","options":["A","B","C","D"],"correctIndex":0}]}\n\nMake questions rigorous, curriculum-aligned, and realistic.${subjectContext}${generationSeed}`
    : examType === 'SAT'
    ? `Generate ${count} College Board SAT questions. Format:\n{"questions":[{"stimulus":"Context if needed","question":"Question text","options":["A","B","C","D"],"correctIndex":0}]}\n\nSAT-level difficulty, clear and concise.${subjectContext}${generationSeed}`
    : `Generate ${count} ACT practice questions. Format:\n{"questions":[{"stimulus":"Passage/context","question":"Question","options":["A","B","C","D"],"correctIndex":0}]}\n\nACT-level rigor.${subjectContext}${generationSeed}`;

  // PHASE 3: INCREASE TEMPERATURE FOR VARIATION
  const requestPromise = base44.integrations.Core.InvokeLLM({
    prompt,
    temperature: 0.8,
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
    
    // PHASE 1: VALIDATE SUBJECT MATCH
    const subjectKeywords = getSubjectKeywords(subjectId);
    
    const questions = result.questions
      .filter(q => {
        // Check if question contains subject-relevant keywords
        const text = `${q.stimulus} ${q.question}`.toLowerCase();
        const hasKeyword = subjectKeywords.some(kw => text.includes(kw.toLowerCase()));
        if (!hasKeyword) {
          console.warn(`[SUBJECT VALIDATION] Question rejected - no ${subjectId} keywords found`);
          return false;
        }
        return true;
      })
      .map((q, idx) => ({
        id: `q_${nonce}_${idx}`,
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

    // Don't cache to prevent reuse across sessions
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
 * PHASE 5: FORCE FRESH GENERATION - Clear all caches
 */
export function clearCache() {
  cache.questions.clear();
  cache.explanations.clear();
  cache.tutor.clear();
  console.log('[CACHE] All caches cleared for fresh generation');
}

/**
 * PHASE 1: Subject keyword validation
 */
function getSubjectKeywords(subjectId) {
  const keywords = {
    'Biology': ['cell', 'enzyme', 'DNA', 'protein', 'organism', 'photosynthesis', 'mitochondria', 'evolution', 'genetics'],
    'Chemistry': ['atom', 'molecule', 'reaction', 'chemical', 'element', 'compound', 'bond', 'equation', 'solution'],
    'Physics': ['force', 'energy', 'motion', 'velocity', 'acceleration', 'wave', 'mass', 'momentum', 'electric'],
    'US History': ['constitution', 'president', 'congress', 'war', 'amendment', 'treaty', 'revolution', 'civil', 'government'],
    'World History': ['civilization', 'empire', 'dynasty', 'culture', 'trade', 'religion', 'war', 'revolution', 'treaty'],
    'Calculus': ['derivative', 'integral', 'limit', 'function', 'slope', 'rate', 'continuous', 'differential'],
    'Statistics': ['mean', 'median', 'data', 'probability', 'sample', 'distribution', 'variance', 'correlation'],
    'English': ['passage', 'author', 'tone', 'theme', 'sentence', 'paragraph', 'grammar', 'rhetorical'],
    'Math': ['equation', 'solve', 'variable', 'graph', 'number', 'calculate', 'formula', 'expression']
  };
  
  return keywords[subjectId] || ['question', 'answer', 'problem'];
}