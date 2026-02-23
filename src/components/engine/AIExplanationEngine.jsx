import { base44 } from '@/api/base44Client';

/**
 * AI Explanation Engine (Phase 8)
 * Generates explanations for incorrect answers on Proofly-native questions
 */

export async function generateExplanation({
  question,
  selectedAnswer,
  correctAnswer,
  userEmail
}) {
  const prompt = `You are an expert tutor helping a student understand why they got a question wrong.

QUESTION: ${question.stem}

CHOICES:
${question.answer_choices.map((choice, idx) => `${String.fromCharCode(65 + idx)}. ${choice}`).join('\n')}

CORRECT ANSWER: ${String.fromCharCode(65 + correctAnswer)}
STUDENT SELECTED: ${String.fromCharCode(65 + selectedAnswer)}

Provide:
1. A clear concept explanation
2. Why the correct answer is right
3. Why the student's answer is wrong
4. Why other incorrect choices are wrong
5. A targeted practice recommendation

Return as JSON with this structure:
{
  "concept_explanation": "...",
  "correct_reasoning": "...",
  "student_error_analysis": "...",
  "other_errors": ["...", "..."],
  "practice_recommendation": "..."
}`;

  const response = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        concept_explanation: { type: "string" },
        correct_reasoning: { type: "string" },
        student_error_analysis: { type: "string" },
        other_errors: {
          type: "array",
          items: { type: "string" }
        },
        practice_recommendation: { type: "string" }
      },
      required: ["concept_explanation", "correct_reasoning", "student_error_analysis"]
    }
  });

  return response;
}

export async function generateFRQFeedback({ prompt, userResponse }) {
  const feedbackPrompt = `You are an AP exam grader. Evaluate this student's free-response answer.

PROMPT: ${prompt.prompt_text}

RUBRIC:
${prompt.rubric_criteria.map((r, i) => `${i + 1}. ${r.criterion} (${r.points} points): ${r.description}`).join('\n')}

STUDENT RESPONSE:
${userResponse}

Provide detailed feedback on:
1. Which rubric points were earned
2. Which were missed and why
3. How to improve the response
4. Estimated score

Return as JSON:
{
  "points_earned": [{"criterion": "...", "points": 2, "earned": true, "feedback": "..."}],
  "estimated_score": 8,
  "strengths": ["...", "..."],
  "areas_to_improve": ["...", "..."],
  "revision_suggestions": "..."
}`;

  const response = await base44.integrations.Core.InvokeLLM({
    prompt: feedbackPrompt,
    response_json_schema: {
      type: "object",
      properties: {
        points_earned: {
          type: "array",
          items: {
            type: "object",
            properties: {
              criterion: { type: "string" },
              points: { type: "number" },
              earned: { type: "boolean" },
              feedback: { type: "string" }
            }
          }
        },
        estimated_score: { type: "number" },
        strengths: { type: "array", items: { type: "string" } },
        areas_to_improve: { type: "array", items: { type: "string" } },
        revision_suggestions: { type: "string" }
      }
    }
  });

  return response;
}

export async function generateStudyNotes({
  examType,
  subjectId,
  domainId,
  unitId,
  topicName
}) {
  const prompt = `Generate comprehensive study notes for:
EXAM: ${examType}
TOPIC: ${topicName}

Create structured, clear notes covering:
1. Key concepts and definitions
2. Important formulas/patterns
3. Common mistakes to avoid
4. Practice strategies
5. Real-world applications

Return as JSON:
{
  "title": "...",
  "content": "... (markdown format)",
  "key_concepts": ["...", "..."],
  "formulas": ["...", "..."],
  "common_mistakes": ["...", "..."]
}`;

  const response = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        content: { type: "string" },
        key_concepts: { type: "array", items: { type: "string" } },
        formulas: { type: "array", items: { type: "string" } },
        common_mistakes: { type: "array", items: { type: "string" } }
      }
    }
  });

  const user = await base44.auth.me();
  const note = await base44.entities.StudyNote.create({
    user_email: user.email,
    exam_type: examType,
    subject_id: subjectId,
    domain_id: domainId,
    unit_id: unitId,
    title: response.title,
    content: response.content,
    key_concepts: response.key_concepts
  });

  return note;
}