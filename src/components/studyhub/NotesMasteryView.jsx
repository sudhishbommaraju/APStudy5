import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, X, ChevronLeft, ChevronRight, RotateCcw, Check, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function NotesMasteryView({ notes, title, onClose }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState([]); // 'know' | 'review'

  async function generateFlashcards() {
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert AP tutor. Based on the following study notes, generate 15 high-quality flashcards for active recall practice.

Each flashcard:
- front: a precise, testable question or key term (concise)
- back: the complete, accurate answer (2–4 sentences)

Focus on key definitions, concepts, formulas, and AP exam traps.

Notes:
"""
${notes.substring(0, 5000)}
"""`,
        response_json_schema: {
          type: 'object',
          properties: {
            flashcards: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  front: { type: 'string' },
                  back: { type: 'string' },
                },
                required: ['front', 'back']
              }
            }
          }
        }
      });
      const generated = res.flashcards || [];
      if (!generated.length) { toast.error('No cards generated.'); return; }
      setCards(generated);
      setStarted(true);
      setIdx(0);
      setFlipped(false);
      setResults([]);
      toast.success(`${generated.length} flashcards ready!`);
    } catch {
      toast.error('Failed to generate flashcards. Try again.');
    }
    setLoading(false);
  }

  function markCard(result) {
    setResults(prev => [...prev, result]);
    if (idx < cards.length - 1) {
      setIdx(i => i + 1);
      setFlipped(false);
    } else {
      setIdx(cards.length); // done
    }
  }

  function restart() {
    setIdx(0);
    setFlipped(false);
    setResults([]);
  }

  const isDone = idx >= cards.length && cards.length > 0;
  const knowCount = results.filter(r => r === 'know').length;
  const reviewCount = results.filter(r => r === 'review').length;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-gray-800 text-sm">{title || 'Mastery Session'}</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* Start Screen */}
          {!started && (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-6">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Ready to Master These Notes?</h2>
                <p className="text-gray-500 text-sm max-w-sm">We'll generate 15 flashcards from your notes for active recall practice.</p>
              </div>
              <Button
                onClick={generateFlashcards}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8"
                size="lg"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating flashcards…</>
                  : '⚡ Start Mastering'}
              </Button>
            </div>
          )}

          {/* Done Screen */}
          {isDone && (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-6">
              <div className="text-4xl">🎉</div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Session Complete!</h2>
                <p className="text-gray-500 text-sm">You went through all {cards.length} flashcards.</p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{knowCount}</p>
                  <p className="text-xs text-gray-500">Know It</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-500">{reviewCount}</p>
                  <p className="text-xs text-gray-500">Need Review</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={restart} className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Restart
                </Button>
                <Button onClick={onClose} className="bg-blue-500 hover:bg-blue-600 text-white">
                  Done
                </Button>
              </div>
            </div>
          )}

          {/* Flashcard */}
          {started && !isDone && cards[idx] && (
            <div className="space-y-6">
              {/* Progress */}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>{idx + 1} / {cards.length}</span>
                  <span>{Math.round(((idx) / cards.length) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(idx / cards.length) * 100}%` }} />
                </div>
              </div>

              {/* Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={idx + (flipped ? '-back' : '-front')}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => setFlipped(f => !f)}
                  className={`min-h-[200px] rounded-2xl border-2 cursor-pointer flex flex-col items-center justify-center p-8 text-center transition-all select-none ${
                    flipped
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <span className={`text-xs font-semibold uppercase tracking-wider mb-4 ${flipped ? 'text-blue-500' : 'text-gray-400'}`}>
                    {flipped ? 'Answer' : 'Question'}
                  </span>
                  <p className={`text-base leading-relaxed font-medium ${flipped ? 'text-blue-900' : 'text-gray-800'}`}>
                    {flipped ? cards[idx].back : cards[idx].front}
                  </p>
                  {!flipped && (
                    <p className="text-xs text-gray-400 mt-4">Tap to reveal answer</p>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Actions */}
              {flipped ? (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => markCard('review')}
                    className="flex-1 border-amber-300 text-amber-600 hover:bg-amber-50"
                  >
                    🔁 Need Review
                  </Button>
                  <Button
                    onClick={() => markCard('know')}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Check className="w-4 h-4 mr-1" /> Know It!
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setFlipped(true)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Reveal Answer
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}