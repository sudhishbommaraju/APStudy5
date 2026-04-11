import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Youtube, Loader2, Sparkles, ChevronDown, ChevronUp, Link } from 'lucide-react';
import { toast } from 'sonner';

function extractVideoId(url) {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function APYoutubePractice() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(5);
  const [expanded, setExpanded] = useState({});

  const videoId = extractVideoId(url);

  async function generateFromYoutube() {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `A student provided a YouTube video URL: ${url}

Based on this educational video, do the following:
1. Identify the subject and topic being taught
2. Generate a brief summary of likely key concepts (since we cannot access the transcript directly, use the URL and common AP curriculum knowledge)
3. Generate ${count} AP-style practice questions at ${difficulty} difficulty level

For MCQ: question, 4 choices (A-D), correct answer letter, explanation.
For FRQ: prompt, rubric points, model answer.

Generate a mix of question types appropriate for AP exams. Make them rigorous and curriculum-aligned.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            detected_subject: { type: 'string' },
            detected_topic: { type: 'string' },
            summary: { type: 'string' },
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  question: { type: 'string' },
                  choices: { type: 'array', items: { type: 'string' } },
                  correct_answer: { type: 'string' },
                  explanation: { type: 'string' },
                  rubric: { type: 'array', items: { type: 'string' } },
                  model_answer: { type: 'string' },
                }
              }
            }
          }
        }
      });
      setResult(res);
      toast.success(`Generated ${res.questions?.length || 0} questions from video!`);
    } catch {
      toast.error('Failed to process video. Try again.');
    }
    setLoading(false);
  }

  const toggleExpand = (i) => setExpanded(prev => ({ ...prev, [i]: !prev[i] }));

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">YouTube → Practice Questions</h2>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">YouTube Video URL</label>
          <p className="text-xs text-gray-400 mb-3">Paste any AP-related YouTube lesson or lecture</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Thumbnail preview */}
        {videoId && (
          <div className="mt-4 flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <img
              src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
              alt="Video thumbnail"
              className="w-24 h-16 rounded-lg object-cover"
            />
            <div>
              <p className="text-xs text-gray-500 font-medium">Video detected</p>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">{videoId}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Difficulty</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Number of Questions</label>
            <select value={count} onChange={e => setCount(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {[3, 5, 8, 10].map(n => <option key={n} value={n}>{n} questions</option>)}
            </select>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 mt-6">
          <Button
            onClick={generateFromYoutube}
            disabled={!url.trim() || loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg text-base font-medium shadow-sm"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating from video…</>
              : <><Sparkles className="w-4 h-4 mr-2" /> Generate Practice Questions</>}
          </Button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Topic detection */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-6 py-4">
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-1">Detected Topic</p>
            <p className="text-sm font-semibold text-blue-800">{result.detected_subject} — {result.detected_topic}</p>
            {result.summary && <p className="text-xs text-blue-600 mt-2 leading-relaxed">{result.summary}</p>}
          </div>

          <h3 className="text-lg font-semibold text-gray-800">{result.questions?.length} Practice Questions</h3>
          {result.questions?.map((q, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => toggleExpand(i)}
                className="w-full flex items-start justify-between gap-4 px-6 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className={`shrink-0 mt-0.5 text-xs font-bold px-2 py-0.5 rounded ${
                    q.type === 'FRQ' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>{q.type || 'MCQ'}</span>
                  <span className="text-sm text-gray-800 font-medium leading-relaxed">{q.question}</span>
                </div>
                {expanded[i] ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-1" />}
              </button>

              {expanded[i] && (
                <div className="px-6 pb-5 border-t border-gray-100">
                  {q.choices?.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {q.choices.map((choice, ci) => {
                        const letter = String.fromCharCode(65 + ci);
                        const isCorrect = q.correct_answer?.startsWith(letter);
                        return (
                          <div key={ci} className={`px-4 py-2 rounded-lg text-sm ${isCorrect ? 'bg-green-50 border border-green-200 text-green-800 font-medium' : 'bg-gray-50 text-gray-700'}`}>
                            <span className="font-semibold mr-2">{letter}.</span>{choice}
                            {isCorrect && <span className="ml-2 text-green-600">✓ Correct</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {q.explanation && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                      <p className="text-xs font-semibold text-blue-600 mb-1">Explanation</p>
                      <p className="text-sm text-blue-800 leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                  {q.rubric?.length > 0 && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                      <p className="text-xs font-semibold text-amber-600 mb-2">Rubric</p>
                      <ul className="space-y-1">
                        {q.rubric.map((r, ri) => <li key={ri} className="text-sm text-amber-800">• {r}</li>)}
                      </ul>
                    </div>
                  )}
                  {q.model_answer && (
                    <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      <p className="text-xs font-semibold text-gray-500 mb-1">Model Answer</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{q.model_answer}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}