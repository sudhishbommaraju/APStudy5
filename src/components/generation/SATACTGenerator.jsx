/**
 * SAT/ACT QUESTION GENERATOR
 * Generates authentic test-style questions with notes and flashcards
 */

import { base44 } from '@/api/base44Client';

export class SATACTGenerator {
  
  static async generateSATQuestionBatch({ section, count = 5, nonce = Date.now() }) {
    const categories_rw = ['Information & Ideas', 'Craft & Structure', 'Expression of Ideas', 'Standard English Conventions'];
    const topics_math = ['Advanced Algebra & Functions', 'Problem Solving & Data Analysis', 'Geometry & Trigonometry', 'Systems of Equations'];

    const prompts = {
      'reading_writing': `You are an expert SAT prep tutor generating HARD digital SAT Reading & Writing questions targeting 1400-1600 scorers.
Batch ID (use for uniqueness, do NOT repeat): ${nonce}_${Math.random().toString(36).slice(2)}

Generate ${count} DIFFERENT high-difficulty questions. Each must:
- Have a unique passage (150-200 words) at 12th-grade+ reading level — use dense academic, scientific, or literary prose
- Target one of: ${categories_rw.join(', ')}
- Require deep inference, rhetorical analysis, or nuanced grammar — NOT surface recall
- Have 4 answer choices where 2-3 are highly plausible traps
- The correct answer must be defensible with textual evidence
- Wrong answers must reflect real student mistakes (too broad, too narrow, contradicts passage, outside scope)

FORBIDDEN: easy vocabulary questions, literal recall, "what does the word mean" without context complexity

Return JSON array of ${count} questions:`,

      'math': `You are an expert SAT prep tutor generating HARD digital SAT Math questions targeting 1400-1600 scorers.
Batch ID (ensure uniqueness): ${nonce}_${Math.random().toString(36).slice(2)}

Generate ${count} DIFFERENT hard SAT math problems. Each must:
- Target one of: ${topics_math.join(', ')}
- Require 2-4 steps minimum — no single-operation problems
- Use realistic contexts (rate/ratio problems, quadratics, exponential models, data analysis with tables)
- Include LaTeX for all math: e.g. $$f(x) = 2x^2 - 3x + 1$$
- Have 4 answer choices where 3 are trap answers from common algebraic/arithmetic errors
- Be solvable in under 3 minutes with the right strategy

FORBIDDEN: basic arithmetic, one-step equations, simple area/perimeter without additional complexity

Return JSON array of ${count} questions:`
    };

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompts[section],
      response_json_schema: {
        type: 'object',
        properties: {
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                passage: { type: 'string' },
                question_text: { type: 'string' },
                choice_a: { type: 'string' },
                choice_b: { type: 'string' },
                choice_c: { type: 'string' },
                choice_d: { type: 'string' },
                correct_answer: { type: 'string' },
                explanation: { type: 'string' },
                category: { type: 'string' },
              }
            }
          }
        }
      }
    });

    return (response.questions || []).map((q, idx) => ({
      id: `sat_${section}_${nonce}_${idx}`,
      stimulus: q.passage || '',
      question_text: q.question_text || '',
      choice_a: q.choice_a,
      choice_b: q.choice_b,
      choice_c: q.choice_c,
      choice_d: q.choice_d,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      category: q.category,
      answer_choices: [q.choice_a, q.choice_b, q.choice_c, q.choice_d],
      subject_id: 'SAT',
      unit_id: section,
    }));
  }

  static async generateSATQuestion({ section, difficulty = 'medium' }) {
    const prompts = {
      'reading_writing': `Generate an original SAT Reading & Writing question.

Create a short passage (120-160 words) followed by a multiple-choice question.

Category: ${['Information & Ideas', 'Craft & Structure', 'Expression of Ideas', 'Standard English Conventions'][Math.floor(Math.random() * 4)]}

Return JSON: { passage, question_text, choice_a, choice_b, choice_c, choice_d, correct_answer, explanation, category, official_tip, flashcard_front, flashcard_back, study_note }`,

      'math': `Generate an original SAT Math question.

Topic: ${['Heart of Algebra', 'Problem Solving & Data Analysis', 'Passport to Advanced Math'][Math.floor(Math.random() * 3)]}
Difficulty: ${difficulty}

Return JSON: { question_text, choice_a, choice_b, choice_c, choice_d, correct_answer, explanation, topic, official_tip, flashcard_front, flashcard_back, study_note }`
    };

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompts[section] || prompts['reading_writing'],
      response_json_schema: {
        type: 'object',
        properties: {
          passage: { type: 'string' },
          question_text: { type: 'string' },
          choice_a: { type: 'string' },
          choice_b: { type: 'string' },
          choice_c: { type: 'string' },
          choice_d: { type: 'string' },
          correct_answer: { type: 'string' },
          explanation: { type: 'string' },
          category: { type: 'string' },
          topic: { type: 'string' },
          official_tip: { type: 'string' },
          flashcard_front: { type: 'string' },
          flashcard_back: { type: 'string' },
          study_note: { type: 'string' }
        }
      }
    });

    return response;
  }

  static async generateACTQuestion({ section, difficulty = 'medium' }) {
    const prompts = {
      'english': `Generate an original ACT English question.

Create a passage sentence with an underlined portion that may contain an error.

Requirements:
- Test grammar, usage, or rhetorical skills
- 4 answer choices including "NO CHANGE"
- Realistic errors students make

Return JSON with same structure as SAT plus passage context`,

      'math': `Generate an original ACT Math question.

Topics: Arithmetic, Algebra, Geometry, Trigonometry, Probability
Difficulty: ${difficulty}

Requirements:
- 5 answer choices (A-E)
- Include distractors from common mistakes
- Show clear path to solution

Return JSON with 5 choices`,

      'reading': `Generate an original ACT Reading question.

Create a passage (150-200 words) with question testing:
- Main idea
- Detail
- Inference
- Vocabulary in context

Return JSON with passage and question`,

      'science': `Generate an original ACT Science question.

Create a data table or graph with question testing:
- Data representation
- Interpretation
- Scientific reasoning

Return JSON with data and question`
    };

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompts[section] || prompts['english'],
      response_json_schema: {
        type: 'object',
        properties: {
          passage: { type: 'string' },
          question_text: { type: 'string' },
          choice_a: { type: 'string' },
          choice_b: { type: 'string' },
          choice_c: { type: 'string' },
          choice_d: { type: 'string' },
          choice_e: { type: 'string' },
          correct_answer: { type: 'string' },
          explanation: { type: 'string' },
          category: { type: 'string' },
          official_tip: { type: 'string' },
          flashcard_front: { type: 'string' },
          flashcard_back: { type: 'string' },
          study_note: { type: 'string' }
        }
      }
    });

    return response;
  }

  static async batchGenerate({ test, sections, questionsPerSection = 10 }) {
    const allQuestions = [];
    const allFlashcards = [];
    const allNotes = [];

    for (const section of sections) {
      console.log(`Generating ${questionsPerSection} ${test} ${section} questions...`);

      for (let i = 0; i < questionsPerSection; i++) {
        try {
          const data = test === 'SAT' 
            ? await this.generateSATQuestion({ section })
            : await this.generateACTQuestion({ section });

          // Save question
          const question = await base44.entities.Question.create({
            subject_id: test.toLowerCase(),
            unit_id: '',
            skill_id: '',
            unit_name: section,
            skill_name: data.category || data.topic || 'General',
            difficulty: 'medium',
            question_text: data.passage ? `${data.passage}\n\n${data.question_text}` : data.question_text,
            choice_a: data.choice_a,
            choice_b: data.choice_b,
            choice_c: data.choice_c,
            choice_d: data.choice_d,
            correct_answer: data.correct_answer,
            explanation: data.explanation,
            hint: data.official_tip || '',
            table_data: data.data_table || '',
            is_ai_generated: true
          });
          allQuestions.push(question);

          // Save flashcard
          if (data.flashcard_front) {
            const flashcard = await base44.entities.Flashcard.create({
              exam_type: test,
              unit_name: section,
              front: data.flashcard_front,
              back: data.flashcard_back,
              topic: data.category || data.topic,
              difficulty: 'medium',
              is_ai_generated: true
            });
            allFlashcards.push(flashcard);
          }

          // Save note
          if (data.study_note) {
            const note = await base44.entities.Note.create({
              exam_type: test,
              unit_name: section,
              title: data.category || data.topic || 'Concept',
              content: data.study_note,
              topics_covered: [data.category || data.topic],
              is_ai_generated: true
            });
            allNotes.push(note);
          }

        } catch (e) {
          console.error(`Failed to generate ${test} ${section} question ${i}:`, e);
        }
      }
    }

    return { allQuestions, allFlashcards, allNotes };
  }
}