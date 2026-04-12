import { base44 } from '@/api/base44Client';

// Cache: context+text fingerprint → structured notes
const notesCache = new Map();

function cacheKey(context, text) {
  return `${context}::${text.slice(0, 150)}`;
}

// Aggressively trim input to 2500 chars, remove filler
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

// CALL 1 (fast): extract topics + generate quick summary in one shot
async function extractTopicsAndSummary(input, context) {
  return await base44.integrations.Core.InvokeLLM({
    prompt: `You are an AP curriculum expert. From the text below, identify the 5-6 most important topics and write a 3-bullet summary.

Context: ${context}
Text: """${input}"""

Be concise. Topics should be specific AP-level concepts, not vague headings.`,
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

// CALL 2 (main): generate full structured notes from topics + input
async function generateStructuredNotes(topics, summary, input, context) {
  const topicList = topics.join(', ');
  return await base44.integrations.Core.InvokeLLM({
    prompt: `You are an AP tutor writing structured study notes. Use ONLY bullet points — no paragraphs.

Context: ${context}
Key Topics: ${topicList}
Source: """${input}"""

Rules:
- sections: one section per topic, 4-6 bullets each (max 2 lines per bullet)
- keyTerms: 6-10 terms with 1-sentence definitions
- All bullets must be factual, specific, AP-exam relevant
- NO filler, NO vague statements`,
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

  // CALL 1: Extract topics + summary (fast, ~3-5s)
  onProgress('extracting');
  const { topics = [], summary = [], title = context } = await extractTopicsAndSummary(input, context);
  if (!topics.length) throw new Error('Could not identify topics. Try a different source.');

  // Progressive: emit partial notes with just title + summary so UI can start rendering
  onProgress('expanding');
  const partial = { title, summary, sections: [], keyTerms: [] };
  // Allow callers to receive partial data
  if (typeof onProgress === 'function') onProgress('expanding', partial);

  // CALL 2: Full structured notes (main, ~5-8s)
  onProgress('assembling');
  const structured = await generateStructuredNotes(topics, summary, input, context);

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