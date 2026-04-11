import { base44 } from '@/api/base44Client';

// Simple in-memory cache: key -> notes
const notesCache = new Map();

function cacheKey(context, text) {
  return `${context}::${text.slice(0, 200)}`;
}

const LATEX_RULES = `STRICT MATH/LATEX RULES:
- Wrap all equations in $$ $$
- Fractions: \\frac{a}{b}
- Superscripts: t^2, subscripts: v_i
- Units inside \\text{}: e.g. 100 \\text{ m}, 5 \\text{ s}
- NEVER use commas inside math expressions
- Show substitutions step by step`;

// Chunk text into ~1000 token pieces at sentence boundaries
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

// Clean filler words, timestamps, repeated lines
function normalizeText(text) {
  const lines = text.split('\n');
  const seen = new Set();
  const cleaned = lines
    .map(l => l
      .replace(/\[\d+:\d+(?::\d+)?\]/g, '') // timestamps
      .replace(/\b(um|uh|like|you know|basically|literally|gonna|wanna)\b/gi, '')
      .trim()
    )
    .filter(l => l.length > 20 && !seen.has(l) && seen.add(l));
  return cleaned.join(' ').replace(/\s+/g, ' ').trim();
}

// PASS 1: Extract key topics from chunks
async function extractTopics(chunks, context) {
  const combinedSample = chunks.slice(0, 3).join('\n\n').slice(0, 6000);
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an AP curriculum expert. Extract the key topics and concepts from this study material.

Context: ${context}

Text:
"""
${combinedSample}
"""

Return 5-10 distinct, non-overlapping AP-level topics. Be concise and specific.`,
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
  return result;
}

// PASS 2: Expand each topic into structured content
async function expandTopic(topic, context, subjectHint) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an expert AP tutor. Explain this concept for an AP-level student.

Subject context: ${subjectHint}
Topic: "${topic}"

${LATEX_RULES}

Provide:
- Definition (1-2 sentences)
- Detailed explanation (3-5 bullet points)
- Worked example with full step-by-step solution
- Formula in LaTeX if applicable
- When/how it appears on AP exams

Use bullet points only, no dense paragraphs.`,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        bullets: { type: 'array', items: { type: 'string' } },
        hasFormula: { type: 'boolean' },
        hasGraph: { type: 'boolean' },
        graphType: { type: 'string' }
      }
    }
  });
  return result;
}

// PASS 3: Assemble final notes + practice questions
async function assembleNotes(topicExpansions, context, subject) {
  const topicSummary = topicExpansions
    .map(t => `## ${t.title}\n${t.bullets?.join('\n')}`)
    .join('\n\n');

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an expert AP curriculum designer. Assemble these expanded topics into polished, structured AP study notes.

Subject: ${subject}
Context: ${context}

${LATEX_RULES}

Expanded topics:
"""
${topicSummary.slice(0, 8000)}
"""

Create a final structured notes document. Follow this JSON schema exactly.
- 4-7 sections, each with 4-8 bullet points
- keyTerms: 10-15 vocabulary terms
- 3-4 MCQ practice questions with answers
- 1-2 FRQ practice questions with step-by-step LaTeX solutions
- summary: 2-3 sentences`,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        summary: { type: 'string' },
        keyTerms: { type: 'array', items: { type: 'string' } },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'array', items: { type: 'string' } },
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
  return result;
}

/**
 * Main pipeline entry point.
 * @param {string} rawText - Raw input text (transcript, extracted doc, etc.)
 * @param {string} context - e.g. "AP Physics 1 - Kinematics"
 * @param {function} onProgress - callback(step: string)
 * @returns {Promise<object>} structured notes
 */
export async function generateNotesPipeline(rawText, context, onProgress = () => {}) {
  const key = cacheKey(context, rawText);
  if (notesCache.has(key)) {
    onProgress('cache');
    return notesCache.get(key);
  }

  // Step 1: Normalize
  onProgress('normalizing');
  const cleanText = normalizeText(rawText);
  if (cleanText.length < 100) throw new Error('Text is too short to generate notes from.');

  // Step 2: Chunk
  onProgress('chunking');
  const chunks = chunkText(cleanText);

  // Step 3: Extract topics (Pass 1)
  onProgress('extracting');
  const { topics = [], subject = context, unit = '' } = await extractTopics(chunks, context);
  if (!topics.length) throw new Error('Could not identify topics. Try a different source.');

  // Step 4: Expand topics in parallel (Pass 2)
  onProgress('expanding');
  const expansions = await Promise.all(
    topics.slice(0, 7).map(t => expandTopic(t, context, subject))
  );

  // Step 5: Assemble (Pass 3)
  onProgress('assembling');
  const notes = await assembleNotes(expansions, context, subject);

  if (!notes?.title || !notes?.sections?.length) {
    throw new Error('Notes assembly failed. Please try again.');
  }

  notesCache.set(key, notes);
  return notes;
}

export function clearNotesCache() {
  notesCache.clear();
}