import { base44 } from '@/api/base44Client';

const MAX_RETRIES = 2;
const RETRY_DELAYS = [500, 1500];

export async function generateNotesWithRetry({
  examType,
  subjectId = null,
  unitId = null,
  title,
  sourceType,
  sourceUrl = null,
  rawText = null,
  synthesisType = 'summary',
  depth = 'medium',
  keywords = []
}) {
  const user = await base44.auth.me();
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Log attempt
      const logEntry = await base44.entities.GenerationLog.create({
        user_email: user.email,
        type: 'NOTES',
        status: attempt > 0 ? 'RETRY' : 'SUCCESS',
        attempt_number: attempt + 1,
        request_data: {
          examType,
          subjectId,
          title,
          sourceType,
          synthesisType
        }
      });

      // Build context from source
      let context = rawText || '';
      if (sourceType === 'YOUTUBE' && sourceUrl) {
        context = `YouTube URL: ${sourceUrl}\n\nNote: Extract transcript and summarize key concepts.`;
      } else if (sourceType === 'UPLOAD' && !rawText) {
        throw new Error('VALIDATION_ERROR: Raw text required for upload source');
      }

      const prompt = buildNotesPrompt({
        examType,
        subjectId,
        unitId,
        title,
        context,
        synthesisType,
        depth,
        keywords
      });

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: sourceType === 'YOUTUBE'
      });

      if (!response?.trim()) {
        throw new Error('MODEL_OUTPUT_INVALID: Empty response from AI');
      }

      // Extract key concepts
      const keyConcepts = extractKeyConcepts(response);

      // Persist to database
      const note = await base44.entities.StudyNote.create({
        user_email: user.email,
        exam_type: examType,
        subject_id: subjectId,
        unit_id: unitId,
        title: title,
        content: response,
        key_concepts: keyConcepts,
        practice_questions: []
      });

      // Update log with success
      await base44.entities.GenerationLog.update(logEntry.id, {
        status: 'SUCCESS',
        result_ids: [note.id]
      });

      return {
        success: true,
        note: note
      };

    } catch (error) {
      lastError = error;
      
      // Log failure
      await base44.entities.GenerationLog.create({
        user_email: user.email,
        type: 'NOTES',
        status: 'FAIL',
        error_code: error.message?.includes('VALIDATION_ERROR') ? 'VALIDATION_ERROR' : 'GENERATION_ERROR',
        error_message: error.message || 'Unknown error',
        attempt_number: attempt + 1,
        request_data: {
          examType,
          subjectId,
          title,
          sourceType
        }
      });

      // Retry with delay if not last attempt
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
        continue;
      }
    }
  }

  // All retries failed
  return {
    success: false,
    error: lastError?.message || 'Notes generation failed after retries',
    errorCode: lastError?.message?.includes('VALIDATION_ERROR') ? 'VALIDATION_ERROR' : 'GENERATION_ERROR'
  };
}

function buildNotesPrompt({ examType, subjectId, unitId, title, context, synthesisType, depth, keywords }) {
  const keywordText = keywords?.length > 0 ? `\nFocus on: ${keywords.join(', ')}` : '';
  
  const synthesisInstructions = {
    summary: 'Create a comprehensive summary with key points organized into digestible bullet points. Use clear headings and concise explanations.',
    flashcards: `Extract 15-25 key terms, concepts, and questions. Format each as:

**Front:** [Question/Term]
**Back:** [Answer/Definition with brief explanation]

Prioritize high-yield concepts for ${examType} exam preparation.`,
    detailed: 'Provide an in-depth analysis with detailed explanations, examples, and connections between concepts. Include formulas, diagrams descriptions, and practice tips.'
  };

  return `Generate ${examType} study notes for: ${title}

${subjectId ? `Subject: ${subjectId}` : ''}
${unitId ? `Unit: ${unitId}` : ''}
Detail Level: ${depth}
Format: ${synthesisType}${keywordText}

Source Material:
${context}

Instructions:
${synthesisInstructions[synthesisType] || synthesisInstructions.summary}

Requirements:
- Comprehensive coverage of main concepts
- Clear structure with headings
- Examples where helpful
- Emphasis on exam-relevant material
- Use markdown formatting
- Use LaTeX for math: inline with $...$, block with $$...$$

Generate well-structured, study-ready notes.`;
}

function extractKeyConcepts(content) {
  // Simple extraction of bolded terms and headings
  const concepts = [];
  const boldPattern = /\*\*([^*]+)\*\*/g;
  const headingPattern = /^#+\s+(.+)$/gm;
  
  let match;
  while ((match = boldPattern.exec(content)) !== null) {
    concepts.push(match[1]);
  }
  
  while ((match = headingPattern.exec(content)) !== null) {
    concepts.push(match[1]);
  }
  
  return [...new Set(concepts)].slice(0, 10);
}