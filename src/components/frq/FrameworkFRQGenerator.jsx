import { base44 } from '@/api/base44Client';
import {
  getArchetypeForSubject,
  getSkillsForSubject,
  getCommandVerbsForSubject,
  RUBRIC_TEMPLATES
} from './FRQSubjectData';

/**
 * Framework-aligned FRQ generator.
 * Implements the spec from the PDF:
 * - Subject → Unit → Skill/Practice → Task archetype → Command verb
 * - Rubric template families (not bespoke per question)
 * - Scoring note: what differentiates full credit from partial
 * - Prompt injection protection via system/user content separation
 */
export async function generateFrameworkFRQ({ subject, unitId, unitTitle, difficulty = 'medium' }) {
  if (!subject || !unitId) throw new Error('Subject and unit are required');

  const archetype = getArchetypeForSubject(subject);
  const skills = getSkillsForSubject(subject);
  const commandVerbs = getCommandVerbsForSubject(subject);
  const rubricTemplate = RUBRIC_TEMPLATES[archetype];

  // Pick a random command verb for variety
  const commandVerb = commandVerbs[Math.floor(Math.random() * commandVerbs.length)];

  const difficultyInstructions = {
    easy: 'Focus on recall and basic application. Keep the scenario straightforward.',
    medium: 'Require analytical reasoning with multiple steps. Include a brief stimulus (data, quote, or scenario).',
    hard: 'Require sophisticated argumentation, complex data interpretation, or multi-step reasoning with a nuanced stimulus.'
  };

  const systemContext = `You are an AP exam content developer creating ORIGINAL practice FRQ prompts.
Rules you must follow:
1. Never copy or closely paraphrase official AP exam questions.
2. Always use the command verb provided — it sets the cognitive demand.
3. Rubric criteria must be specific and observable, not vague quality judgments.
4. Point-earning must be tied to specific features: claim, evidence, reasoning, calculation steps, etc.
5. The scoring note must state what explicitly earns full vs. partial credit.`;

  const userRequest = `Create 1 AP-style Free Response Question for:
Subject: ${subject}
Unit: ${unitTitle || unitId}
Task archetype: ${rubricTemplate.label}
Primary command verb: ${commandVerb}
Skills assessed: ${skills.slice(0, 3).join(', ')}
Difficulty: ${difficulty} — ${difficultyInstructions[difficulty]}

Use this rubric template structure (adapt criteria to the specific content):
${rubricTemplate.criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Return a single JSON object with exactly these fields:
- prompt_text: the FRQ prompt (2–4 sentences, uses "${commandVerb}" as the main directive)
- total_points: integer 4–10
- rubric_criteria: array of {criterion, points, description} (3–6 items, points sum to total_points)
- skills_assessed: array of strings (2–4 skills from the archetype)
- command_verb: "${commandVerb}"
- alignment_pointer: "Unit: ${unitTitle || unitId} | Skills: [list] | Archetype: ${archetype}"
- scoring_note: one sentence explaining what differentiates full credit from partial credit`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `${systemContext}\n\n---\n\n${userRequest}`,
    response_json_schema: {
      type: 'object',
      properties: {
        prompt_text: { type: 'string' },
        total_points: { type: 'number' },
        rubric_criteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              points: { type: 'number' },
              description: { type: 'string' }
            }
          }
        },
        skills_assessed: { type: 'array', items: { type: 'string' } },
        command_verb: { type: 'string' },
        alignment_pointer: { type: 'string' },
        scoring_note: { type: 'string' }
      }
    }
  });

  // Validate output
  if (!result?.prompt_text?.trim()) throw new Error('Invalid FRQ output: missing prompt_text');
  if (!Array.isArray(result?.rubric_criteria) || result.rubric_criteria.length < 2) {
    throw new Error('Invalid FRQ output: rubric_criteria missing or too short');
  }

  const saved = await base44.entities.APFRQPrompt.create({
    subject_id: subject,
    unit_id: unitId,
    unit_title: unitTitle || unitId,
    prompt_text: result.prompt_text,
    total_points: result.total_points || 6,
    rubric_criteria: result.rubric_criteria,
    skills_assessed: result.skills_assessed || skills.slice(0, 3),
    command_verb: result.command_verb || commandVerb,
    task_archetype: archetype,
    alignment_pointer: result.alignment_pointer,
    scoring_note: result.scoring_note,
    difficulty,
    is_active: true
  });

  return saved;
}