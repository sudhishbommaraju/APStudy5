/**
 * Fallback practice questions - guaranteed to work when generation fails
 */

export function getFallbackPractice(subjectId = 'general') {
  console.log('[Fallback Practice] Loading deterministic practice for:', subjectId);
  
  return [
    {
      id: 'fallback-1',
      subject_id: subjectId,
      unit_id: 'fallback',
      skill_id: 'fallback',
      unit_name: 'General Practice',
      skill_name: 'Problem Solving',
      difficulty: 'medium',
      question_text: 'If $x + 5 = 12$, what is the value of $x$?',
      choice_a: '5',
      choice_b: '7',
      choice_c: '12',
      choice_d: '17',
      correct_answer: 'B',
      explanation: 'To solve for $x$, subtract 5 from both sides: $x = 12 - 5 = 7$',
      hint: 'Isolate the variable by performing the same operation on both sides',
      is_ai_generated: false
    },
    {
      id: 'fallback-2',
      subject_id: subjectId,
      unit_id: 'fallback',
      skill_id: 'fallback',
      unit_name: 'General Practice',
      skill_name: 'Algebra',
      difficulty: 'medium',
      question_text: 'What is $2 \\times (3 + 4)$?',
      choice_a: '10',
      choice_b: '11',
      choice_c: '14',
      choice_d: '24',
      correct_answer: 'C',
      explanation: 'First solve inside parentheses: $3 + 4 = 7$. Then multiply: $2 \\times 7 = 14$',
      hint: 'Remember order of operations: parentheses first',
      is_ai_generated: false
    },
    {
      id: 'fallback-3',
      subject_id: subjectId,
      unit_id: 'fallback',
      skill_id: 'fallback',
      unit_name: 'General Practice',
      skill_name: 'Fractions',
      difficulty: 'medium',
      question_text: 'What is $\\frac{1}{2} + \\frac{1}{4}$?',
      choice_a: '$\\frac{1}{6}$',
      choice_b: '$\\frac{2}{6}$',
      choice_c: '$\\frac{3}{4}$',
      choice_d: '$\\frac{2}{4}$',
      correct_answer: 'C',
      explanation: 'Find common denominator: $\\frac{2}{4} + \\frac{1}{4} = \\frac{3}{4}$',
      hint: 'Convert to common denominator before adding',
      is_ai_generated: false
    },
    {
      id: 'fallback-4',
      subject_id: subjectId,
      unit_id: 'fallback',
      skill_id: 'fallback',
      unit_name: 'General Practice',
      skill_name: 'Percentages',
      difficulty: 'medium',
      question_text: 'What is 25% of 80?',
      choice_a: '15',
      choice_b: '20',
      choice_c: '25',
      choice_d: '30',
      correct_answer: 'B',
      explanation: '25% = $\\frac{1}{4}$, so $\\frac{1}{4} \\times 80 = 20$',
      hint: '25% means one quarter',
      is_ai_generated: false
    },
    {
      id: 'fallback-5',
      subject_id: subjectId,
      unit_id: 'fallback',
      skill_id: 'fallback',
      unit_name: 'General Practice',
      skill_name: 'Exponents',
      difficulty: 'medium',
      question_text: 'What is $2^3$?',
      choice_a: '6',
      choice_b: '8',
      choice_c: '9',
      choice_d: '16',
      correct_answer: 'B',
      explanation: '$2^3 = 2 \\times 2 \\times 2 = 8$',
      hint: 'Exponent means repeated multiplication',
      is_ai_generated: false
    }
  ];
}