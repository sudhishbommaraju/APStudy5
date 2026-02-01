/**
 * SAT/ACT QUESTION GENERATOR
 * Generates authentic test-style questions with notes and flashcards
 */

import { base44 } from '@/api/base44Client';

export class SATACTGenerator {
  
  static async generateSATQuestion({ section, difficulty = 'medium' }) {
    const prompts = {
      'reading_writing': `Generate an original SAT Reading & Writing question.

Create a short passage (120-160 words) followed by a multiple-choice question.

Category: ${['Information & Ideas', 'Craft & Structure', 'Expression of Ideas', 'Standard English Conventions'][Math.floor(Math.random() * 4)]}

Passage Requirements:
- College-level reading complexity
- Clear main idea
- Natural transitions

Question Requirements:
- 4 answer choices (A-D)
- Test comprehension, grammar, or rhetorical skills
- Include College Board-style wrong answers (plausible distractors)

Return JSON:
{
  "passage": "Original passage text",
  "question_text": "Question about the passage",
  "choice_a": "First option",
  "choice_b": "Second option",
  "choice_c": "Third option",
  "choice_d": "Fourth option",
  "correct_answer": "A"|"B"|"C"|"D",
  "explanation": "Why correct answer is right and others are wrong",
  "category": "Category name",
  "official_tip": "College Board-style strategy tip",
  "flashcard_front": "Concept being tested",
  "flashcard_back": "Rule or strategy explanation",
  "study_note": "Key concept summary"
}`,

      'math': `Generate an original SAT Math question.

Topic: ${['Heart of Algebra', 'Problem Solving & Data Analysis', 'Passport to Advanced Math'][Math.floor(Math.random() * 3)]}
Difficulty: ${difficulty}

Requirements:
- Original problem (not from official tests)
- Use realistic numbers and scenarios
- 4 answer choices OR grid-in format
- Use LaTeX for math: $x^{2}$, $\\frac{a}{b}$

Return JSON:
{
  "question_text": "Math problem",
  "choice_a": "Option A",
  "choice_b": "Option B", 
  "choice_c": "Option C",
  "choice_d": "Option D",
  "correct_answer": "A"|"B"|"C"|"D",
  "explanation": "Step-by-step solution",
  "topic": "Math topic",
  "official_tip": "Strategy for solving",
  "flashcard_front": "Formula or concept",
  "flashcard_back": "When to use it",
  "study_note": "Key math concept"
}`
    };

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompts[section],
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
      prompt: prompts[section],
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