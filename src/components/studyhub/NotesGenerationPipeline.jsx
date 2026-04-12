import { base44 } from '@/api/base44Client';

const notesCache = new Map();

function cacheKey(context, text) {
  return context + '::' + text.slice(0, 150);
}

function prepareInput(text, maxChars = 2500) {
  const lines = text.split('\n');
  const seen = new Set();
  const cleaned = lines
    .map(l => l
      .replace(/\[\d+:\d+(?::\d+)?\]/g, '')
      .replace(/\b(um|uh|like|you know|basically|literally|gonna|wanna|so basically|right so)\b/gi, '')
      .trim()
    )
    .filter(l => l.length > 15 && !seen.has(l) && seen.add(l));
  return cleaned.join(' ').replace(/\s+/g, ' ').trim().slice(0, maxChars);
}

const EXTRACT_PROMPT = (context, input) =>
  'You are an AP curriculum expert specializing in the 2025-2026 College Board AP frameworks. ' +
  'From the text below, identify the 5-6 most important topics aligned with the 2026 AP curriculum and write a 3-bullet summary.\n\n' +
  'Context: ' + context + '\n' +
  'Text: """\n' + input + '\n"""\n\n' +
  'Topics must align with official 2025-2026 AP course frameworks (Big Ideas, Enduring Understandings, Essential Knowledge). Be specific, not vague.';

const NOTES_PROMPT = (context, topicList, input) =>
  'You are an AP master tutor writing structured study notes strictly aligned with the 2025-2026 College Board AP curriculum frameworks. Use ONLY bullet points, no paragraphs.\n\n' +
  'Context: ' + context + '\n' +
  'Key Topics: ' + topicList + '\n' +
  'Source: """\n' + input + '\n"""\n\n' +
  'Rules:\n' +
  '- sections: one section per topic, 4-6 bullets each (max 2 lines per bullet)\n' +
  '- keyTerms: 6-10 terms with 1-sentence definitions aligned to 2026 AP vocabulary\n' +
  '- All bullets must reflect 2025-2026 AP exam expectations (Big Ideas, Science Practices, Historical Thinking Skills, etc.)\n' +
  '- Include any formulas, graphical models, or quantitative frameworks required by the 2026 framework\n' +
  '- NO filler, NO vague statements - every bullet must be exam-relevant';

async function extractTopicsAndSummary(input, context) {
  return await base44.integrations.Core.InvokeLLM({
    prompt: EXTRACT_PROMPT(context, input),
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

async function generateStructuredNotes(topics, input, context) {
  const topicList = topics.join(', ');
  return await base44.integrations.Core.InvokeLLM({
    prompt: NOTES_PROMPT(context, topicList, input),
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

  onProgress('extracting');
  const { topics = [], summary = [], title = context } = await extractTopicsAndSummary(input, context);
  if (!topics.length) throw new Error('Could not identify topics. Try a different source.');

  onProgress('expanding');
  onProgress('assembling');
  const structured = await generateStructuredNotes(topics, input, context);

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