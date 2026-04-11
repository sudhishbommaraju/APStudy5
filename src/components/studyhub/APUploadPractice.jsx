import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, FileText, CheckCircle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

export default function APUploadPractice() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [questionType, setQuestionType] = useState('mixed');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(5);
  const [expanded, setExpanded] = useState({});
  const inputRef = useRef(null);

  async function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setQuestions([]);
  }

  async function generateFromFile() {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploading(false);
      setGenerating(true);

      const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'object',
          properties: { content: { type: 'string' } }
        }
      });

      const text = extracted?.output?.content || '';

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AP exam question generator. Based on the following content, generate ${count} AP-style practice questions.

Type: ${questionType === 'mixed' ? 'Mix of MCQ and FRQ' : questionType === 'mcq' ? 'Multiple Choice only' : 'Free Response only'}
Difficulty: ${difficulty}

Content:
"""
${text.substring(0, 4000)}
"""

For MCQ: provide question, 4 choices (A-D), correct answer, and explanation.
For FRQ: provide prompt, rubric criteria, and model answer.
Match AP College Board rigor. Include reasoning in explanations.`,
        response_json_schema: {
          type: 'object',
          properties: {
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

      setQuestions(result.questions || []);
      toast.success(`Generated ${result.questions?.length || 0} questions!`);
    } catch {
      toast.error('Failed to process file. Try again.');
    }
    setUploading(false);
    setGenerating(false);
  }

  const toggleExpand = (i) => setExpanded(prev => ({ ...prev, [i]: !prev[i] }));

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Upload Study Material</h2>

        {/* File Drop Zone */}
        <div
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
            file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
          }`}
        >
          <input ref={inputRef} type="file" accept=".pdf,.txt,.docx,.doc,.md" onChange={handleFile} className="hidden" />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="w-8 h-8 text-blue-500" />
              <p className="font-semibold text-blue-700">{file.name}</p>
              <p className="text-xs text-blue-500">{(file.size / 1024).toFixed(1)} KB — click to change</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-gray-400" />
              <p className="text-gray-600 font-medium">Drop a PDF, Word doc, or text file</p>
              <p className="text-xs text-gray-400">or click to browse</p>
            </div>
          )}
        </div>

        {/* Options */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Question Type</label>
            <select value={questionType} onChange={e => setQuestionType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="mixed">Mixed (MCQ + FRQ)</option>
              <option value="mcq">MCQ Only</option>
              <option value="frq">FRQ Only</option>
            </select>
          </div>
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
            onClick={generateFromFile}
            disabled={!file || uploading || generating}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg text-base font-medium shadow-sm"
          >
            {uploading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading file…</>
              : generating
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating questions…</>
              : <><Sparkles className="w-4 h-4 mr-2" /> Generate AP Practice Questions</>}
          </Button>
        </div>
      </div>

      {/* Questions Output */}
      {questions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">{questions.length} Practice Questions</h3>
          {questions.map((q, i) => (
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