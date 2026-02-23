import { base44 } from '@/api/base44Client';

/**
 * AI Question Generation Engine
 * Generates ORIGINAL questions only - never uses official copyrighted content
 * Compliance: College Board explicitly prohibits training AI on their content
 */

export async function generateQuestions({
  examType,
  subjectId,
  domainId,
  unitId,
  skillId,
  difficulty,
  questionCount
}) {
  
  // Fetch skill details for context
  const skill = await base44.entities.EngineSkill.list();
  const targetSkill = skill.find(s => s.id === skillId);
  
  if (!targetSkill) {
    throw new Error('Skill not found');
  }

  const prompt = buildGenerationPrompt({
    examType,
    skillName: targetSkill.name,
    skillDescription: targetSkill.description,
    difficulty,
    questionCount
  });

  // Generate questions using AI
  const response = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              stem: { type: "string" },
              choices: { 
                type: "array",
                items: { type: "string" },
                minItems: 4,
                maxItems: 4
              },
              correctAnswer: { type: "number", minimum: 0, maximum: 3 },
              explanation: { type: "string" },
              skillTag: { type: "string" }
            },
            required: ["stem", "choices", "correctAnswer", "explanation"]
          }
        }
      },
      required: ["questions"]
    }
  });

  // Store generated questions
  const createdQuestions = [];
  for (const q of response.questions) {
    const question = await base44.entities.ProoflyQuestion.create({
      stem: q.stem,
      answer_choices: q.choices,
      correct_answer: q.correctAnswer,
      explanation: q.explanation,
      skill_id: skillId,
      difficulty,
      is_active: true,
      generation_metadata: {
        generated_at: new Date().toISOString(),
        exam_type: examType,
        skill_name: targetSkill.name
      }
    });
    createdQuestions.push(question);
  }

  return createdQuestions;
}

function buildGenerationPrompt({ examType, skillName, skillDescription, difficulty, questionCount }) {
  return `You are an expert test prep content creator. Generate ${questionCount} COMPLETELY ORIGINAL practice questions.

CRITICAL COMPLIANCE RULES:
- Generate entirely new, original questions
- DO NOT replicate official College Board question wording
- DO NOT use distinctive phrasing patterns from official exams
- Use neutral academic tone
- These questions must be independently created

EXAM: ${examType}
SKILL: ${skillName}
DESCRIPTION: ${skillDescription}
DIFFICULTY: ${difficulty}/5

For each question:
1. Write a clear, original question stem
2. Provide exactly 4 answer choices
3. Mark the correct answer (index 0-3)
4. Provide a detailed explanation

Focus on testing the skill genuinely, not memorization.
Make questions realistic but completely original.

Return as JSON array with format:
{
  "questions": [
    {
      "stem": "question text",
      "choices": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "why this is correct",
      "skillTag": "${skillName}"
    }
  ]
}`;
}

export async function getQuestionsForPractice({ skillId, difficulty, count }) {
  // Try to get existing questions first
  const existing = await base44.entities.ProoflyQuestion.filter({
    skill_id: skillId,
    difficulty,
    is_active: true
  });

  if (existing.length >= count) {
    // Randomly select from existing
    const shuffled = existing.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // Generate more if needed
  const needed = count - existing.length;
  const skill = await base44.entities.EngineSkill.list();
  const targetSkill = skill.find(s => s.id === skillId);
  
  const newQuestions = await generateQuestions({
    examType: 'SAT', // TODO: get from skill context
    skillId,
    difficulty,
    questionCount: needed
  });

  return [...existing, ...newQuestions].slice(0, count);
}