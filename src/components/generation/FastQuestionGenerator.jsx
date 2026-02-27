import { base44 } from '@/api/base44Client';

// ─── Caches ───────────────────────────────────────────────────────────────────
const cache = {
  explanations: new Map(),
  tutor: new Map()
};

// ─── Answer distribution (practice only) ─────────────────────────────────────
const sessionAnswerCounts = { A: 0, B: 0, C: 0, D: 0 };
const sessionAnswerHistory = [];

export function resetAnswerDistribution() {
  Object.keys(sessionAnswerCounts).forEach(k => (sessionAnswerCounts[k] = 0));
  sessionAnswerHistory.length = 0;
}

// ─── Shared utilities ─────────────────────────────────────────────────────────
function shuffleOptions(options, correctIndex) {
  const correctAnswer = options[correctIndex];
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return { shuffled, newCorrectIndex: shuffled.indexOf(correctAnswer) };
}

function enforceDistribution(options, correctIndex) {
  const letters = ['A', 'B', 'C', 'D'];
  let { shuffled, newCorrectIndex } = shuffleOptions(options, correctIndex);

  for (let attempts = 0; attempts < 10; attempts++) {
    const letter = letters[newCorrectIndex];
    const total = Object.values(sessionAnswerCounts).reduce((a, b) => a + b, 0);
    const last2 = sessionAnswerHistory.slice(-2);
    const streak = last2.length === 2 && last2[0] === letter && last2[1] === letter;
    const overFreq = total >= 4 && (sessionAnswerCounts[letter] + 1) / (total + 1) > 0.4;
    if (!streak && !overFreq) break;
    ({ shuffled, newCorrectIndex } = shuffleOptions(options, correctIndex));
  }

  const letter = letters[newCorrectIndex];
  sessionAnswerCounts[letter]++;
  sessionAnswerHistory.push(letter);
  return { shuffled, newCorrectIndex };
}

// PHASE 5: Require all three params
function requireParams(subjectId, unitId, mode) {
  if (!subjectId) throw new Error('subject is required');
  if (!unitId)    throw new Error('unit is required');
  if (!mode)      throw new Error('mode is required ("practice" or "flashcard")');
  if (mode !== 'practice' && mode !== 'flashcard') throw new Error(`Invalid mode: "${mode}"`);
}

// ═════════════════════════════════════════════════════════════════════════════
// PHASE 1 & 2 — NEW PRACTICE ENGINE (promoted from flashcard base)
// Subject-scoped, MCQ, scenario-based, no definition recall.
// ═════════════════════════════════════════════════════════════════════════════
export async function generateQuestionsOptimized({
  examType = 'AP',
  subjectId,
  unitId,
  difficulty = 'mixed',
  count = 5,
  mode = 'practice'
}) {
  // PHASE 4: Hard routing — only practice engine handles practice
  requireParams(subjectId, unitId, mode);
  if (mode !== 'practice') throw new Error('generateQuestionsOptimized handles mode="practice" only.');

  const {
    validateGenerationParams,
    validateUnitMatch,
    getUsedQuestions,
    addUsedQuestion,
    addToQuestionHistory,
    isDuplicateAcrossPractices,
    hashQuestion
  } = await import('./SubjectBanks');

  const { bank, unitData, bankKey } = validateGenerationParams(subjectId, unitId);
  console.log(`[PRACTICE ENGINE] subject="${subjectId}" → bank="${bankKey}" unit="${unitData.name}"`);

  const nonce = Date.now();

  // PHASE 2: Scenario-based MCQ prompt (NOT definition-style)
  const prompt = `You are generating AP-level ${bank.name} practice questions for Unit ${unitData.id}: ${unitData.name}.

PRACTICE ENGINE RULES — MANDATORY:
- Every question MUST open with a 2-4 sentence stimulus (scenario, data, experiment, or primary source)
- Question stem must require application or analysis — NOT definition recall
- Question stem minimum 12 words
- 4 plausible distractors based on common student misconceptions
- correctIndex = 0-3 index of correct option in the options array
- Topics to draw from: ${unitData.keywords.join(', ')}

ABSOLUTELY FORBIDDEN:
- "What is the definition of..."
- "Which term means..."
- "What is the function of..."
- Any question without a stimulus
- Content from subjects other than ${bank.name}

College Board AP exam rigor required.
Generation ID: ${nonce}_${Math.random().toString(36)}

Return ${count} questions as JSON:`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stimulus:     { type: 'string' },
              question:     { type: 'string' },
              options:      { type: 'array', items: { type: 'string' } },
              correctIndex: { type: 'number' }
            }
          }
        }
      }
    }
  });

  const usedInSession = getUsedQuestions(subjectId, unitData.id);
  const validQuestions = [];

  for (const q of (result.questions || [])) {
    // Structure check
    const wordCount = (q.question || '').trim().split(/\s+/).length;
    if (wordCount < 12 || !q.stimulus || q.stimulus.trim().length < 20) {
      console.warn('[PRACTICE ENGINE] Rejected — short/no stimulus');
      continue;
    }
    const lower = (q.question || '').toLowerCase();
    const isDefinition = ['what is the definition','which term means','what is the function of','define the term'].some(p => lower.includes(p));
    if (isDefinition) {
      console.warn('[PRACTICE ENGINE] Rejected — definition-style question');
      continue;
    }

    // Subject/unit validation
    if (!validateUnitMatch(q, unitData, bankKey)) continue;

    // Deduplication
    const hash = hashQuestion(q.question);
    if (usedInSession.has(hash) || isDuplicateAcrossPractices(subjectId, unitData.id, hash)) {
      console.warn('[PRACTICE ENGINE] Rejected — duplicate');
      continue;
    }

    validQuestions.push(q);
  }

  if (validQuestions.length === 0) {
    throw new Error(`Practice engine returned 0 valid questions for ${bank.name} Unit ${unitData.name}`);
  }

  return validQuestions.map((q, idx) => {
    const hash = hashQuestion(q.question);
    addUsedQuestion(subjectId, unitData.id, hash);
    addToQuestionHistory(subjectId, unitData.id, hash);

    // PHASE 2: Shuffle + enforce answer distribution
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
}

// ═════════════════════════════════════════════════════════════════════════════
// PHASE 3 — SIMPLIFIED FLASHCARD ENGINE (demoted from old practice engine)
// Returns: [{ term, explanation, example }] — no MCQ, no stimulus.
// ═════════════════════════════════════════════════════════════════════════════
export async function generateFlashcardsForSubject({
  subjectId,
  unitId,
  count = 10,
  mode = 'flashcard'
}) {
  // PHASE 4: Hard routing — only flashcard engine handles flashcards
  requireParams(subjectId, unitId, mode);
  if (mode !== 'flashcard') throw new Error('generateFlashcardsForSubject handles mode="flashcard" only.');

  const { validateGenerationParams } = await import('./SubjectBanks');
  const { bank, unitData } = validateGenerationParams(subjectId, unitId);

  console.log(`[FLASHCARD ENGINE] subject="${subjectId}" unit="${unitData.name}"`);

  // PHASE 3: Simple term/explanation/example prompt — no MCQ
  const prompt = `You are generating AP ${bank.name} study flashcards for Unit ${unitData.id}: ${unitData.name}.

FLASHCARD ENGINE RULES:
- Each card: a key TERM, a clear EXPLANATION (1-2 sentences), and an optional EXAMPLE
- Definition recall is the goal — keep it simple and direct
- No multiple choice. No stimulus passages. No distractors.
- Topics: ${unitData.keywords.join(', ')}

Generate ${count} flashcards as JSON:`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: 'object',
      properties: {
        flashcards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term:        { type: 'string' },
              explanation: { type: 'string' },
              example:     { type: 'string' }
            }
          }
        }
      }
    }
  });

  return (result.flashcards || []).map((fc, idx) => ({
    id: `fc_${subjectId}_${unitData.id}_${Date.now()}_${idx}`,
    term: fc.term,
    explanation: fc.explanation,
    example: fc.example || null,
    subject_id: subjectId,
    unit_id: unitData.id,
    mode: 'flashcard'
  }));
}

// ═════════════════════════════════════════════════════════════════════════════
// EXPLANATION & TUTOR HELPERS (practice mode only)
// ═════════════════════════════════════════════════════════════════════════════
export async function generateExplanation({ questionId, stimulus, question, options, correctAnswer }) {
  if (cache.explanations.has(questionId)) return cache.explanations.get(questionId);

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an expert AP tutor. Explain this question.

Stimulus: ${stimulus}
Question: ${question}
Options: A) ${options[0]}  B) ${options[1]}  C) ${options[2]}  D) ${options[3]}
Correct: ${correctAnswer}

Write 3-5 sentences: why the correct answer is right, the underlying concept, and how to reason through it.`,
    response_json_schema: { type: 'object', properties: { explanation: { type: 'string' } } }
  });

  cache.explanations.set(questionId, result.explanation);
  return result.explanation;
}

export async function generateWrongAnswerFeedback({ questionId, stimulus, question, selectedOptionText, correctOptionText, correctAnswer }) {
  const cacheKey = `wrong_${questionId}_${(selectedOptionText || '').substring(0, 10)}`;
  if (cache.explanations.has(cacheKey)) return cache.explanations.get(cacheKey);

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `AP tutor feedback for a wrong answer.

Stimulus: ${stimulus}
Question: ${question}
Student chose: "${selectedOptionText}" (WRONG)
Correct: "${correctOptionText}" (${correctAnswer})

In 2-3 sentences: explain why the chosen option is wrong, guide toward the correct concept. Be encouraging.`,
    response_json_schema: { type: 'object', properties: { feedback: { type: 'string' } } }
  });

  cache.explanations.set(cacheKey, result.feedback);
  return result.feedback;
}

export async function generateHint({ questionId, stimulus, question }) {
  const cacheKey = `hint_${questionId}`;
  if (cache.tutor.has(cacheKey)) return cache.tutor.get(cacheKey);
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Give a 2-sentence hint (no answer): ${stimulus} ${question}`,
    response_json_schema: { type: 'object', properties: { hint: { type: 'string' } } }
  });
  cache.tutor.set(cacheKey, result.hint);
  return result.hint;
}

export async function generateStrategy({ questionId, question }) {
  const cacheKey = `strategy_${questionId}`;
  if (cache.tutor.has(cacheKey)) return cache.tutor.get(cacheKey);
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `3-sentence test-taking strategy for: ${question}`,
    response_json_schema: { type: 'object', properties: { strategy: { type: 'string' } } }
  });
  cache.tutor.set(cacheKey, result.strategy);
  return result.strategy;
}

// ─── PHASE 6: Clear all state on mode switch ──────────────────────────────────
export async function clearCache() {
  cache.explanations.clear();
  cache.tutor.clear();
  resetAnswerDistribution();
  console.log('[CACHE] All caches cleared for fresh generation');
}