import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Loader2, Zap, BookOpen } from 'lucide-react';

export default function AIExplanation({ 
  question, 
  userAnswer, 
  correctAnswer, 
  isCorrect,
  isSubmitted 
}) {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSubmitted && !isCorrect && !explanation) {
      generateExplanation();
    }
  }, [isSubmitted, isCorrect]);

  const generateExplanation = async () => {
    setLoading(true);
    try {
      const prompt = `A student answered incorrectly on this question:

Question: ${question.stem}

Answer Choices:
${question.answer_choices.map((choice, idx) => `${idx}: ${choice}`).join('\n')}

Student's Answer: ${question.answer_choices[userAnswer] || 'No answer'}
Correct Answer: ${question.answer_choices[correctAnswer]}

Provide a concise, clear explanation (2-3 sentences max) that:
1. Explains why the correct answer is right
2. Clarifies the misconception in their answer
3. Provides a memorable takeaway or learning point

Keep it encouraging and educational.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      setExplanation(response);
    } catch (error) {
      console.error('Failed to generate explanation:', error);
      setExplanation('Unable to generate explanation. Please review the correct answer.');
    } finally {
      setLoading(false);
    }
  };

  if (!isSubmitted || isCorrect) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mt-4"
    >
      <div className="flex items-start gap-3">
        <Zap className="w-5 h-5 text-amber-500 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold text-amber-300 mb-2">Let's Learn From This</h4>
          {loading ? (
            <div className="flex items-center gap-2 text-neutral-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Generating explanation...</span>
            </div>
          ) : explanation ? (
            <p className="text-sm text-amber-100 leading-relaxed">{explanation}</p>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}