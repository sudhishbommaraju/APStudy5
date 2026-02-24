import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Lightbulb, MessageCircle, BookOpen, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LatexRenderer from '@/components/ui/LatexRenderer';

export default function AITutorPanel({ question, userAnswer, isCorrect, onClose }) {
  const [mode, setMode] = useState(null); // 'hint', 'explain', 'concept'
  const [loading, setLoading] = useState(false);
  const [tutorResponse, setTutorResponse] = useState('');

  async function getHint() {
    setMode('hint');
    setLoading(true);
    try {
      const prompt = `You are a patient, encouraging tutor. A student is working on this question:

Question: ${question.stem}

Choices:
${question.answer_choices.map((choice, idx) => `${String.fromCharCode(65 + idx)}) ${choice}`).join('\n')}

The student is stuck. Provide a helpful HINT (not the answer) that guides them toward the solution. Be encouraging and focus on helping them think through the problem.

Your hint should:
- NOT reveal the answer directly
- Guide their thinking process
- Be brief (2-3 sentences)
- Be encouraging and supportive`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      setTutorResponse(response);
    } catch (error) {
      setTutorResponse('Sorry, I had trouble generating a hint. Try thinking about what concept this question is testing!');
    } finally {
      setLoading(false);
    }
  }

  async function getExplanation() {
    setMode('explain');
    setLoading(true);
    try {
      const prompt = `You are an expert tutor explaining a practice question.

Question: ${question.stem}

Choices:
${question.answer_choices.map((choice, idx) => `${String.fromCharCode(65 + idx)}) ${choice}`).join('\n')}

Correct Answer: ${String.fromCharCode(65 + question.correct_answer)}
Student Selected: ${userAnswer !== null ? String.fromCharCode(65 + userAnswer) : 'No answer'}
Result: ${isCorrect ? 'Correct' : 'Incorrect'}

Provide a detailed, step-by-step explanation of:
1. Why the correct answer is right
2. ${!isCorrect && userAnswer !== null ? `Why answer ${String.fromCharCode(65 + userAnswer)} is incorrect` : ''}
3. The key concept being tested
4. Tips to avoid similar mistakes

Be clear, encouraging, and educational. Use simple language.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      setTutorResponse(response);
    } catch (error) {
      setTutorResponse('Sorry, I had trouble generating an explanation. The built-in explanation above should help!');
    } finally {
      setLoading(false);
    }
  }

  async function getConceptReview() {
    setMode('concept');
    setLoading(true);
    try {
      const prompt = `You are a tutor teaching a concept.

This question tests: ${question.skill_id || 'general knowledge'}

Question context: ${question.stem}

Provide a concise concept review covering:
1. What is this concept?
2. Why is it important?
3. Key points to remember
4. Common mistakes students make

Keep it brief (4-5 sentences) and practical.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      setTutorResponse(response);
    } catch (error) {
      setTutorResponse('Sorry, I had trouble reviewing this concept. Try reviewing your notes on this topic!');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-semibold text-white">AI Tutor</h3>
      </div>

      {!mode && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={getHint}
            variant="outline"
            className="flex flex-col items-center gap-3 h-auto py-6 border-blue-500/50 hover:bg-blue-500/10"
          >
            <Lightbulb className="w-8 h-8 text-yellow-400" />
            <div className="text-center">
              <div className="font-semibold text-white">Get a Hint</div>
              <div className="text-xs text-neutral-400 mt-1">Guidance without the answer</div>
            </div>
          </Button>

          <Button
            onClick={getExplanation}
            variant="outline"
            className="flex flex-col items-center gap-3 h-auto py-6 border-blue-500/50 hover:bg-blue-500/10"
          >
            <MessageCircle className="w-8 h-8 text-blue-400" />
            <div className="text-center">
              <div className="font-semibold text-white">Detailed Explanation</div>
              <div className="text-xs text-neutral-400 mt-1">Step-by-step walkthrough</div>
            </div>
          </Button>

          <Button
            onClick={getConceptReview}
            variant="outline"
            className="flex flex-col items-center gap-3 h-auto py-6 border-blue-500/50 hover:bg-blue-500/10"
          >
            <BookOpen className="w-8 h-8 text-green-400" />
            <div className="text-center">
              <div className="font-semibold text-white">Concept Review</div>
              <div className="text-xs text-neutral-400 mt-1">Understand the topic</div>
            </div>
          </Button>
        </div>
      )}

      <AnimatePresence>
        {mode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              </div>
            ) : (
              <div className="bg-neutral-900/50 border border-neutral-700 rounded-lg p-6">
                <div className="text-neutral-200 leading-relaxed whitespace-pre-wrap">
                  <LatexRenderer content={tutorResponse} />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setMode(null);
                  setTutorResponse('');
                }}
                variant="outline"
                size="sm"
              >
                Back to Options
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}