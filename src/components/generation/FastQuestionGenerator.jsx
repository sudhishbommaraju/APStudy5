import { base44 } from '@/api/base44Client';

/**
 * OPTIMIZED QUESTION GENERATOR
 * - Single API call for all questions
 * - No explanations initially (lazy loaded)
 * - Minimal tokens
 * - Under 2 second generation
 */

export async function generateQuestionsOptimized({
  examType = 'AP',
  subjectId,
  unitId,
  difficulty = 'mixed',
  count = 5
}) {
  const prompt = `Generate ${count} ${examType} ${difficulty} questions for this unit.

STRICT JSON FORMAT (no markdown, no explanations):
{
  "questions": [
    {
      "stimulus": "1-2 sentence context",
      "question": "1 sentence question",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0
    }
  ]
}

RULES:
- Stimulus: MAX 2 sentences
- Question: MAX 1 sentence
- Options: concise, 3-8 words each
- NO explanation field
- JSON only`;

  const result = await base44.integrations.Core.InvokeLLM({
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

  return result.questions.map((q, idx) => ({
    id: `q_${Date.now()}_${idx}`,
    question_text: q.question,
    stimulus: q.stimulus,
    choice_a: q.options[0],
    choice_b: q.options[1],
    choice_c: q.options[2],
    choice_d: q.options[3],
    correct_answer: ['A', 'B', 'C', 'D'][q.correctIndex],
    explanation: null, // Lazy loaded
    difficulty,
    subject_id: subjectId,
    unit_id: unitId
  }));
}

/**
 * LAZY LOAD EXPLANATION
 * Called when user clicks "Show Explanation" or after submission
 */
export async function generateExplanation({
  stimulus,
  question,
  options,
  selectedAnswer,
  correctAnswer
}) {
  const prompt = `Question: ${stimulus} ${question}

Options:
A) ${options[0]}
B) ${options[1]}
C) ${options[2]}
D) ${options[3]}

Selected: ${selectedAnswer}
Correct: ${correctAnswer}

Provide a concise 2-3 sentence explanation of why ${correctAnswer} is correct.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        explanation: { type: "string" }
      }
    }
  });

  return result.explanation;
}