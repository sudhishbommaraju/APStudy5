import { base44 } from '@/api/base44Client';

const notesCache = new Map();

function cacheKey(context, text) {
  return `${context}::${text.slice(0, 200)}`;
}

function chunkText(text, maxChars = 4000) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = '';
  for (const s of sentences) {
    if ((current + s).length > maxChars && current) {
      chunks.push(current.trim());
      current = s;
    } else {
      current += ' ' + s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function normalizeText(text) {
  const lines = text.split('\n');
  const seen = new Set();
  const cleaned = lines
    .map(l => l
      .replace(/\[\d+:\d+(?::\d+)?\]/g, '')
      .replace(/\b(um|uh|like|you know|basically|literally|gonna|wanna)\b/gi, '')
      .trim()
    )
    .filter(l => l.length > 20 && !seen.has(l) && seen.add(l));
  return cleaned.join(' ').replace(/\s+/g, ' ').trim();
}

const STRICT_FORMAT_RULES = `
STRICT OUTPUT RULES — YOU MUST FOLLOW THESE EXACTLY:
- NO long paragraphs. Every idea must be a bullet point.
- MAX 2 lines per bullet point.
- Use ## for section headers, # for the title.
- Always leave a blank line between sections.
- Key Terms section: "**term**: definition" format, one per bullet.
- Practice Questions: numbered list with "Answer: ..." on next line.
- NEVER write walls of text. If you feel like writing a paragraph, write bullets instead.
`;

async function extractTopics(chunks, context) {
  const sample = chunks.slice(0, 3).join('\n\n').slice(0, 6000);
  return await base44.integrations.Core.InvokeLLM({
    prompt: `You are an AP curriculum expert. Extract 5-8 distinct topics from this material.\nContext: ${context}\n\nText:\n"""\n${sample}\n"""\n\nReturn specific, non-overlapping AP-level topics.`,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        topics: { type: 'array', items: { type: 'string' } },
        subject: { type: 'string' },
        unit: { type: 'string' }
      }
    }
  });
}

async function expandTopic(topic, context) {
  return await base44.integrations.Core.InvokeLLM({
    prompt: `You are an AP tutor. Explain this topic for an AP student using ONLY bullet points.

Topic: "${topic}"
Context: ${context}

${STRICT_FORMAT_RULES}

Return:
- title: short section title
- bullets: array of 4-6 bullet strings (max 2 lines each, no markdown inside)
- hasGraph: true if a graph/diagram would help
- graphType: one of "kinematics", "calculus", "chemistry", "population", "vonThunen", "agriculture" or ""`,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        bullets: { type: 'array', items: { type: 'string' } },
        hasGraph: { type: 'boolean' },
        graphType: { type: 'string' }
      }
    }
  });
}

async function assembleNotes(topicExpansions, context, subject) {
  const topicSummary = topicExpansions
    .map(t => `## ${t.title}\n${(t.bullets || []).map(b => `- ${b}`).join('\n')}`)
    .join('\n\n');

  return await base44.integrations.Core.InvokeLLM({
    prompt: `You are an AP curriculum designer assembling clean, structured study notes.

Subject: ${subject}
Context: ${context}

${STRICT_FORMAT_RULES}

Source material:
"""
${topicSummary.slice(0, 8000)}
"""

Create final structured notes. Every section must use BULLET POINTS only — no paragraphs.
- summary: 3-5 bullet strings describing the overall topic
- keyTerms: array of objects with "term" and "definition" (keep definitions to 1 sentence)
- sections: 4-7 sections, each with a title and 4-7 bullet points (strings, no markdown inside)
- practiceQuestions: 3-4 questions (mix MCQ and FRQ), each with type, question, answer, and options array for MCQ`,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        summary: { type: 'array', items: { type: 'string' } },
        keyTerms: {
          type: 'array',
          items: {
            type: 'object',
            properties: { term: { type: 'string' }, definition: { type: 'string' } }
          }
        },
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
        practiceQuestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              question: { type: 'string' },
              answer: { type: 'string' },
              options: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    }
  });
}

export async function generateNotesPipeline(rawText, context, onProgress = () => {}) {
  const key = cacheKey(context, rawText);
  if (notesCache.has(key)) { onProgress('cache'); return notesCache.get(key); }

  onProgress('normalizing');
  const cleanText = normalizeText(rawText);
  if (cleanText.length < 100) throw new Error('Text is too short to generate notes from.');

  onProgress('chunking');
  const chunks = chunkText(cleanText);

  onProgress('extracting');
  const { topics = [], subject = context } = await extractTopics(chunks, context);
  if (!topics.length) throw new Error('Could not identify topics. Try a different source.');

  onProgress('expanding');
  const expansions = await Promise.all(topics.slice(0, 7).map(t => expandTopic(t, context)));

  onProgress('assembling');
  const notes = await assembleNotes(expansions, context, subject);

  if (!notes?.title || !notes?.sections?.length) throw new Error('Notes assembly failed. Please try again.');

  notesCache.set(key, notes);
  return notes;
}

export function clearNotesCache() {
  notesCache.clear();
}