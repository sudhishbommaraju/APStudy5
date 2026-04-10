import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Sparkles, BookOpen, FileQuestion, CreditCard, RotateCcw, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardNavbar from '@/components/layout/DashboardNavbar';

export default function StudyMaterialsGenerator() {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [flippedCards, setFlippedCards] = useState({});
  const [expandedQuestions, setExpandedQuestions] = useState({});

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;

  const handleGenerate = async () => {
    if (wordCount < 30) {
      toast.error('Please enter at least 30 words of study material.');
      return;
    }
    setLoading(true);
    setResults(null);
    setFlippedCards({});
    setExpandedQuestions({});

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert tutor. A student has provided the following study material. Generate:
1. A concise summary (3-5 sentences)
2. 5 practice questions with multiple choice answers (A-D) and the correct answer
3. 6 flashcards (term/definition pairs)

Study Material:
---
${inputText}
---

Return structured JSON.`,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question: { type: 'string' },
                choices: { type: 'array', items: { type: 'string' } },
                correct_index: { type: 'number' },
                explanation: { type: 'string' }
              }
            }
          },
          flashcards: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                term: { type: 'string' },
                definition: { type: 'string' }
              }
            }
          }
        }
      }
    });

    setResults(result);
    setLoading(false);
    toast.success('Study materials generated!');
  };

  const toggleCard = (i) => setFlippedCards(prev => ({ ...prev, [i]: !prev[i] }));
  const toggleQuestion = (i) => setExpandedQuestions(prev => ({ ...prev, [i]: !prev[i] }));

  return (
    <ProtectedRoute>
      <DashboardNavbar />
      <div className="min-h-screen bg-[#0C0C0C] py-12 px-6">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-6 h-6 text-[#D6B98C]" />
              <h1 className="text-3xl font-light text-white">Study Materials Generator</h1>
            </div>
            <p className="text-neutral-400 text-sm">
              Paste your notes, textbook excerpts, or any study material and instantly get a summary, practice questions, and flashcards.
            </p>
          </div>

          {/* Input */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-6">
            <label className="block text-sm font-medium text-neutral-300 mb-3">
              Your Study Material
            </label>
            <Textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Paste your notes, textbook passage, lecture content, or any text you want to study from..."
              className="min-h-[220px] bg-neutral-800 border-neutral-700 text-neutral-100 placeholder:text-neutral-600 resize-y text-sm leading-relaxed"
            />
            <div className="flex items-center justify-between mt-4">
              <span className={`text-xs ${wordCount < 30 ? 'text-neutral-600' : 'text-neutral-400'}`}>
                {wordCount} word{wordCount !== 1 ? 's' : ''} {wordCount < 30 ? `· ${30 - wordCount} more needed` : '· ready'}
              </span>
              <div className="flex gap-3">
                {inputText && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setInputText(''); setResults(null); }}
                    className="text-neutral-500 hover:text-white"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" /> Clear
                  </Button>
                )}
                <Button
                  onClick={handleGenerate}
                  disabled={loading || wordCount < 30}
                  className="bg-[#D6B98C] text-black hover:bg-[#C9A96A] font-medium px-6"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Generate</>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center">
              <Loader2 className="w-8 h-8 text-[#D6B98C] animate-spin mx-auto mb-4" />
              <p className="text-neutral-400 text-sm">Analyzing your material and generating study content…</p>
            </div>
          )}

          {/* Results */}
          {results && !loading && (
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="bg-neutral-900 border border-neutral-800 w-full mb-6">
                <TabsTrigger value="summary" className="flex-1 data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-neutral-400">
                  <BookOpen className="w-4 h-4 mr-2" /> Summary
                </TabsTrigger>
                <TabsTrigger value="questions" className="flex-1 data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-neutral-400">
                  <FileQuestion className="w-4 h-4 mr-2" /> Questions
                </TabsTrigger>
                <TabsTrigger value="flashcards" className="flex-1 data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-neutral-400">
                  <CreditCard className="w-4 h-4 mr-2" /> Flashcards
                </TabsTrigger>
              </TabsList>

              {/* Summary Tab */}
              <TabsContent value="summary">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
                  <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#D6B98C]" /> Summary
                  </h2>
                  <p className="text-neutral-300 text-sm leading-relaxed">{results.summary}</p>
                </div>
              </TabsContent>

              {/* Questions Tab */}
              <TabsContent value="questions">
                <div className="space-y-4">
                  {(results.questions || []).map((q, i) => (
                    <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                      <div
                        className="flex items-start justify-between gap-4 cursor-pointer"
                        onClick={() => toggleQuestion(i)}
                      >
                        <div className="flex gap-3">
                          <span className="text-[#D6B98C] font-semibold text-sm shrink-0 mt-0.5">Q{i + 1}.</span>
                          <p className="text-white text-sm leading-relaxed">{q.question}</p>
                        </div>
                        {expandedQuestions[i]
                          ? <ChevronUp className="w-4 h-4 text-neutral-500 shrink-0 mt-1" />
                          : <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0 mt-1" />
                        }
                      </div>
                      {expandedQuestions[i] && (
                        <div className="mt-4 space-y-2 pl-6">
                          {(q.choices || []).map((choice, ci) => (
                            <div
                              key={ci}
                              className={`flex items-center gap-3 p-3 rounded-lg text-sm ${
                                ci === q.correct_index
                                  ? 'bg-green-900/20 border border-green-800/50 text-green-300'
                                  : 'bg-neutral-800 text-neutral-400'
                              }`}
                            >
                              {ci === q.correct_index && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                              <span className="font-medium mr-1">{['A', 'B', 'C', 'D'][ci]}.</span>
                              {choice}
                            </div>
                          ))}
                          {q.explanation && (
                            <p className="text-neutral-500 text-xs mt-3 leading-relaxed border-t border-neutral-800 pt-3">
                              <span className="text-neutral-400 font-medium">Explanation: </span>{q.explanation}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Flashcards Tab */}
              <TabsContent value="flashcards">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(results.flashcards || []).map((card, i) => (
                    <div
                      key={i}
                      onClick={() => toggleCard(i)}
                      className={`cursor-pointer rounded-2xl border p-6 min-h-[140px] flex flex-col justify-center transition-all duration-200 ${
                        flippedCards[i]
                          ? 'bg-[#D6B98C]/10 border-[#D6B98C]/40'
                          : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {!flippedCards[i] ? (
                        <>
                          <span className="text-xs text-neutral-600 uppercase tracking-wider mb-2">Term</span>
                          <p className="text-white font-medium text-sm leading-relaxed">{card.term}</p>
                          <span className="text-xs text-neutral-600 mt-3">Click to reveal definition</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-[#D6B98C]/70 uppercase tracking-wider mb-2">Definition</span>
                          <p className="text-neutral-300 text-sm leading-relaxed">{card.definition}</p>
                          <span className="text-xs text-neutral-600 mt-3">Click to flip back</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}