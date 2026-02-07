/**
 * Fallback practice questions - guaranteed valid questions when generation fails
 * NEVER return empty - always provide at least 5 questions
 */

const FALLBACK_BANK = {
  // Math fallbacks
  math: [
    {
      id: 'fb-math-1',
      question_text: 'If $x + 5 = 12$, what is the value of $x$?',
      choice_a: '5',
      choice_b: '7',
      choice_c: '12',
      choice_d: '17',
      correct_answer: 'B',
      explanation: 'To solve for $x$, subtract 5 from both sides: $x = 12 - 5 = 7$',
      hint: 'Isolate the variable by performing the same operation on both sides'
    },
    {
      id: 'fb-math-2',
      question_text: 'What is $2 \\times (3 + 4)$?',
      choice_a: '10',
      choice_b: '11',
      choice_c: '14',
      choice_d: '24',
      correct_answer: 'C',
      explanation: 'First solve inside parentheses: $3 + 4 = 7$. Then multiply: $2 \\times 7 = 14$',
      hint: 'Remember order of operations: parentheses first'
    },
    {
      id: 'fb-math-3',
      question_text: 'What is $\\frac{1}{2} + \\frac{1}{4}$?',
      choice_a: '$\\frac{1}{6}$',
      choice_b: '$\\frac{2}{6}$',
      choice_c: '$\\frac{3}{4}$',
      choice_d: '$\\frac{2}{4}$',
      correct_answer: 'C',
      explanation: 'Find common denominator: $\\frac{2}{4} + \\frac{1}{4} = \\frac{3}{4}$',
      hint: 'Convert to common denominator before adding'
    },
    {
      id: 'fb-math-4',
      question_text: 'What is 25% of 80?',
      choice_a: '15',
      choice_b: '20',
      choice_c: '25',
      choice_d: '30',
      correct_answer: 'B',
      explanation: '25% = $\\frac{1}{4}$, so $\\frac{1}{4} \\times 80 = 20$',
      hint: '25% means one quarter'
    },
    {
      id: 'fb-math-5',
      question_text: 'What is $2^3$?',
      choice_a: '6',
      choice_b: '8',
      choice_c: '9',
      choice_d: '16',
      correct_answer: 'B',
      explanation: '$2^3 = 2 \\times 2 \\times 2 = 8$',
      hint: 'Exponent means repeated multiplication'
    }
  ],

  // Science fallbacks
  science: [
    {
      id: 'fb-sci-1',
      question_text: 'Which of the following is a chemical change?',
      choice_a: 'Ice melting into water',
      choice_b: 'Wood burning to ash',
      choice_c: 'Sugar dissolving in water',
      choice_d: 'Glass breaking into pieces',
      correct_answer: 'B',
      explanation: 'Burning wood is a chemical change because new substances (ash, gases) are formed. Melting, dissolving, and breaking are physical changes.',
      hint: 'Chemical changes form new substances with different properties'
    },
    {
      id: 'fb-sci-2',
      question_text: 'What is the powerhouse of the cell?',
      choice_a: 'Nucleus',
      choice_b: 'Ribosome',
      choice_c: 'Mitochondria',
      choice_d: 'Chloroplast',
      correct_answer: 'C',
      explanation: 'Mitochondria produce ATP through cellular respiration, providing energy for the cell.',
      hint: 'This organelle generates ATP for cellular energy'
    },
    {
      id: 'fb-sci-3',
      question_text: 'Which law states that for every action, there is an equal and opposite reaction?',
      choice_a: 'Newton\'s First Law',
      choice_b: 'Newton\'s Second Law',
      choice_c: 'Newton\'s Third Law',
      choice_d: 'Law of Universal Gravitation',
      correct_answer: 'C',
      explanation: 'Newton\'s Third Law states that forces always come in pairs - action and reaction forces that are equal in magnitude and opposite in direction.',
      hint: 'This is the third of Newton\'s fundamental laws of motion'
    },
    {
      id: 'fb-sci-4',
      question_text: 'What is the chemical formula for water?',
      choice_a: '$H_2O$',
      choice_b: '$CO_2$',
      choice_c: '$O_2$',
      choice_d: '$H_2SO_4$',
      correct_answer: 'A',
      explanation: 'Water is composed of 2 hydrogen atoms and 1 oxygen atom, giving it the formula $H_2O$.',
      hint: 'Think of "H to O" - hydrogen to oxygen'
    },
    {
      id: 'fb-sci-5',
      question_text: 'Which planet is known as the Red Planet?',
      choice_a: 'Venus',
      choice_b: 'Mars',
      choice_c: 'Jupiter',
      choice_d: 'Saturn',
      correct_answer: 'B',
      explanation: 'Mars appears red because its surface contains iron oxide (rust), giving it a reddish appearance.',
      hint: 'This planet is the fourth from the Sun'
    }
  ],

  // Reading & Writing fallbacks
  reading_writing: [
    {
      id: 'fb-eng-1',
      question_text: 'Which sentence is grammatically correct?',
      choice_a: 'The students is going to the library.',
      choice_b: 'The students are going to the library.',
      choice_c: 'The students be going to the library.',
      choice_d: 'The students goes to the library.',
      correct_answer: 'B',
      explanation: '"Students" is plural, so it requires the plural verb "are," not the singular "is" or "goes."',
      hint: 'Match the verb form to the plural subject'
    },
    {
      id: 'fb-eng-2',
      question_text: 'What is the main purpose of a thesis statement?',
      choice_a: 'To provide background information',
      choice_b: 'To state the main argument of an essay',
      choice_c: 'To conclude the essay',
      choice_d: 'To introduce a quote',
      correct_answer: 'B',
      explanation: 'A thesis statement clearly presents the central argument or claim that the essay will support.',
      hint: 'This statement guides the entire essay\'s direction'
    },
    {
      id: 'fb-eng-3',
      question_text: 'Which literary device uses "like" or "as" to make a comparison?',
      choice_a: 'Metaphor',
      choice_b: 'Simile',
      choice_c: 'Personification',
      choice_d: 'Hyperbole',
      correct_answer: 'B',
      explanation: 'A simile makes a comparison using "like" or "as" (e.g., "brave as a lion"). Metaphors make direct comparisons without these words.',
      hint: 'This device explicitly uses comparison words'
    },
    {
      id: 'fb-eng-4',
      question_text: 'What is the correct form: "Their going to the store" or "They\'re going to the store"?',
      choice_a: 'Their going to the store',
      choice_b: 'They\'re going to the store',
      choice_c: 'There going to the store',
      choice_d: 'Both A and B are correct',
      correct_answer: 'B',
      explanation: '"They\'re" is the contraction of "they are." "Their" shows possession, and "there" indicates location.',
      hint: 'Contract "they are" into one word'
    },
    {
      id: 'fb-eng-5',
      question_text: 'In the sentence "The dog barked loudly," what part of speech is "loudly"?',
      choice_a: 'Noun',
      choice_b: 'Verb',
      choice_c: 'Adjective',
      choice_d: 'Adverb',
      correct_answer: 'D',
      explanation: '"Loudly" is an adverb that modifies the verb "barked," describing how the dog barked.',
      hint: 'This word describes how the action was performed'
    }
  ]
};

/**
 * Get subject-appropriate fallback questions
 * GUARANTEE: Always returns 5 valid questions
 */
export function getFallbackPractice(subjectId = 'math') {
  console.log('[Fallback Practice] Loading guaranteed valid questions for:', subjectId);
  
  // Map subject to fallback category
  let category = 'math'; // default
  const lower = subjectId.toLowerCase();
  
  if (lower.includes('calc') || lower.includes('stat') || lower.includes('math')) {
    category = 'math';
  } else if (lower.includes('bio') || lower.includes('chem') || lower.includes('phys') || lower.includes('science') || lower.includes('environmental')) {
    category = 'science';
  } else if (lower.includes('english') || lower.includes('reading') || lower.includes('writing')) {
    category = 'reading_writing';
  }
  
  const questions = FALLBACK_BANK[category] || FALLBACK_BANK.math;
  
  // Add required fields
  return questions.map(q => ({
    ...q,
    subject_id: subjectId,
    unit_id: 'fallback',
    skill_id: 'fallback',
    unit_name: 'Practice Questions',
    skill_name: 'Core Concepts',
    difficulty: 'medium',
    is_ai_generated: false
  }));
}