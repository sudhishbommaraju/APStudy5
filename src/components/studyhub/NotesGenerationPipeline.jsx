import { base44 } from '@/api/base44Client';

// In-memory cache: subject+context → notes
const notesCache = new Map();

function cacheKey(context, text) {
  return context + '::' + text.slice(0, 100);
}

// Trim and deduplicate input to ~3000 chars for fast processing
function prepareInput(text, maxChars = 3000) {
  const seen = new Set();
  return text
    .split('\n')
    .map(l => l
      .replace(/\[\d+:\d+(?::\d+)?\]/g, '')
      .replace(/\b(um|uh|like|you know|basically|literally|gonna|wanna|so basically|right so)\b/gi, '')
      .trim()
    )
    .filter(l => l.length > 15 && !seen.has(l) && seen.add(l))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxChars);
}

const MATH_RULES =
  'MATH FORMATTING: All math must use valid LaTeX. Wrap inline math in $...$, block equations in $$...$$. ' +
  'Units must use \\text{}, e.g. $9.8 \\text{ m/s}^2$. Use \\frac{}{} for fractions. No commas inside math expressions.';

// Stage 1: fast topic + summary extraction
async function extractTopics(input, context) {
  return base44.integrations.Core.InvokeLLM({
    prompt:
      'You are an AP curriculum expert. From the text below, identify 5-6 key topics aligned with the 2025-2026 AP framework and write a 3-bullet summary.\n\n' +
      'Context: ' + context + '\n' +
      'Text: """\n' + input + '\n"""\n\n' +
      'Topics must align with official AP Big Ideas and Essential Knowledge. Be specific.',
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        topics: { type: 'array', items: { type: 'string' } },
        summary: { type: 'array', items: { type: 'string' } },
        title: { type: 'string' }
      }
    }
  });
}

// Stage 2a: structured notes from topics
async function generateNotes(topics, input, context) {
  return base44.integrations.Core.InvokeLLM({
    prompt:
      'You are an AP master tutor writing structured study notes aligned with the 2025-2026 AP curriculum. Bullet points only.\n\n' +
      'Context: ' + context + '\n' +
      'Topics: ' + topics.join(', ') + '\n' +
      'Source: """\n' + input + '\n"""\n\n' +
      'Rules:\n' +
      '- 4-6 bullets per section, max 2 lines each\n' +
      '- Every bullet must be AP exam-relevant\n' +
      '- ' + MATH_RULES + '\n' +
      '- Include formulas and graphical models required by the 2026 framework',
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              bullets: { type: 'array', items: { type: 'string' } },
              hasGraph: { type: 'boolean' },
              graphType: { type: 'string' }
            }
          }
        },
        keyTerms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: { type: 'string' },
              definition: { type: 'string' }
            }
          }
        }
      }
    }
  });
}

export async function generateNotesPipeline(rawText, context, onProgress = () => {}) {
  const key = cacheKey(context, rawText);
  if (notesCache.has(key)) {
    onProgress('cache');
    return notesCache.get(key);
  }

  onProgress('normalizing');
  const input = prepareInput(rawText);
  if (input.length < 80) throw new Error('Text is too short to generate notes from.');

  // Stage 1: extract topics fast
  onProgress('extracting');
  const { topics = [], summary = [], title = context } = await extractTopics(input, context);
  if (!topics.length) throw new Error('Could not identify topics. Try a different source.');

  // Stage 2: generate notes (single parallel-friendly call)
  onProgress('expanding');
  const structured = await generateNotes(topics, input, context);
  onProgress('assembling');

  const notes = {
    title,
    summary,
    sections: structured?.sections || [],
    keyTerms: structured?.keyTerms || [],
    practiceQuestions: []
  };

  if (!notes.sections.length) throw new Error('Notes assembly failed. Please try again.');

  notesCache.set(key, notes);
  return notes;
}

export function clearNotesCache() {
  notesCache.clear();
}