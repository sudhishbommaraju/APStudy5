import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Mic, MicOff, Send, ChevronRight, CheckCircle, XCircle,
  Eye, RotateCcw, X, Brain, TrendingUp, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const PHASE = { intro: 'intro', recall: 'recall', evaluating: 'evaluating', feedback: 'feedback', retest: 'retest', retesting: 'retesting', retestfeedback: 'retestfeedback', complete: 'complete' };

function ScoreBadge({ score }) {
  const color = score >= 8 ? 'bg-green-100 text-green-700' : score >= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600';
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${color}`}>{score}/10</span>;
}

export default function ActiveRecallMode({ note, onClose }) {
  const nd = note.notes_data || {};
  const sections = nd.sections || [];

  const [sectionIndex, setSectionIndex] = useState(0);
  const [phase, setPhase] = useState(PHASE.intro);
  const [userInput, setUserInput] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [retestQ, setRetestQ] = useState('');
  const [retestInput, setRetestInput] = useState('');
  const [retestEval, setRetestEval] = useState(null);
  const [progress, setProgress] = useState([]); // [{sectionTitle, score, weakAreas}]
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  const currentSection = sections[sectionIndex];
  const totalSections = sections.length;

  useEffect(() => {
    if (phase === PHASE.recall && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [phase, sectionIndex]);

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      setUserInput(transcript);
    };
    rec.onend = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  async function handleSubmitRecall() {
    if (!userInput.trim()) return;
    setPhase(PHASE.evaluating);

    const bullets = currentSection.bullets || currentSection.content || [];
    const correctNotes = bullets.join('\n');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an AP tutor evaluating a student's active recall attempt.

Section Title: "${currentSection.title}"
Correct Notes:
"""
${correctNotes}
"""

Student's Response:
"""
${userInput}
"""

Evaluate the student's response and return:
- score: integer 0-10 based on how well they covered the key concepts
- strengths: array of strings (what they got right, max 3)
- missing: array of strings (key concepts they missed, max 5)
- correction: a 1-2 sentence explanation of the most important missing ideas`,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          score: { type: 'number' },
          strengths: { type: 'array', items: { type: 'string' } },
          missing: { type: 'array', items: { type: 'string' } },
          correction: { type: 'string' }
        }
      }
    });

    setEvaluation(result);
    setProgress(prev => [...prev, {
      sectionTitle: currentSection.title,
      score: result.score,
      weakAreas: result.missing || []
    }]);
    setPhase(PHASE.feedback);
  }

  async function handleRequestRetest() {
    setPhase(PHASE.retest);
    const weakAreas = evaluation?.missing?.join(', ') || '';
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate 1 targeted follow-up question to test the student on what they missed.
Section: "${currentSection.title}"
Weak areas: ${weakAreas}
Return a single clear question string.`,
      model: 'gemini_3_flash',
      response_json_schema: { type: 'object', properties: { question: { type: 'string' } } }
    });
    setRetestQ(result?.question || 'Can you explain the missing concepts in your own words?');
    setRetestInput('');
    setRetestEval(null);
  }

  async function handleSubmitRetest() {
    if (!retestInput.trim()) return;
    setPhase(PHASE.retesting);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Evaluate this follow-up answer:
Question: "${retestQ}"
Answer: "${retestInput}"
Correct context: "${(currentSection.bullets || []).join(' ')}"
Return: score (0-10), feedback (1-2 sentences).`,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: { score: { type: 'number' }, feedback: { type: 'string' } }
      }
    });
    setRetestEval(result);
    setPhase(PHASE.retestfeedback);
  }

  function handleNextSection() {
    if (sectionIndex + 1 >= totalSections) {
      setPhase(PHASE.complete);
    } else {
      setSectionIndex(i => i + 1);
      setUserInput('');
      setEvaluation(null);
      setRetestQ('');
      setRetestInput('');
      setRetestEval(null);
      setPhase(PHASE.recall);
    }
  }

  const avgScore = progress.length
    ? Math.round(progress.reduce((s, p) => s + p.score, 0) / progress.length)
    : 0;

  return (
    <div className="fixed inset-0 bg-[#f8fafc] z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <Brain className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Active Recall Mode</h2>
            <p className="text-xs text-gray-400">{note.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Progress pills */}
          <div className="hidden sm:flex items-center gap-1">
            {sections.map((_, i) => {
              const p = progress[i];
              return (
                <div key={i} className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                  i < progress.length
                    ? (p?.score >= 7 ? 'bg-green-500 text-white' : p?.score >= 5 ? 'bg-yellow-400 text-white' : 'bg-red-400 text-white')
                    : i === sectionIndex && phase !== PHASE.intro
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>{i + 1}</div>
              );
            })}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main area */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto">

            {/* INTRO */}
            {phase === PHASE.intro && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-10 h-10 text-purple-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-3">Active Recall Mode</h1>
                <p className="text-gray-500 mb-2 max-w-md mx-auto">
                  You'll be shown section titles and asked to recall the content from memory.
                  No peeking — the notes are hidden until after you respond.
                </p>
                <p className="text-sm text-purple-600 font-semibold mb-8">{totalSections} sections to cover</p>
                <Button onClick={() => { setPhase(PHASE.recall); setProgress([]); setSectionIndex(0); }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl text-base font-semibold gap-2">
                  <Brain className="w-5 h-5" /> Start Active Recall
                </Button>
              </div>
            )}

            {/* RECALL */}
            {phase === PHASE.recall && currentSection && (
              <div>
                <div className="mb-2 text-xs font-semibold text-purple-500 uppercase tracking-widest">
                  Section {sectionIndex + 1} of {totalSections}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentSection.title}</h2>
                <p className="text-gray-500 text-sm mb-6">Explain this concept in your own words. Don't worry about being perfect — just recall what you know.</p>

                <textarea
                  ref={textareaRef}
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  placeholder="Start typing your explanation..."
                  rows={6}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none mb-3"
                />

                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSubmitRecall}
                    disabled={!userInput.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                  >
                    <Send className="w-4 h-4" /> Submit
                  </Button>
                  <button
                    onClick={listening ? stopListening : startListening}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      listening ? 'border-red-300 bg-red-50 text-red-600 animate-pulse' : 'border-gray-300 text-gray-600 hover:border-purple-300'
                    }`}
                  >
                    {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    {listening ? 'Stop' : 'Voice Input'}
                  </button>
                </div>
              </div>
            )}

            {/* EVALUATING */}
            {phase === PHASE.evaluating && (
              <div className="text-center py-16">
                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Evaluating your recall…</p>
              </div>
            )}

            {/* FEEDBACK */}
            {phase === PHASE.feedback && evaluation && currentSection && (
              <div>
                <div className="mb-2 text-xs font-semibold text-purple-500 uppercase tracking-widest">
                  Feedback — {currentSection.title}
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Your Score</h2>
                  <ScoreBadge score={evaluation.score} />
                </div>

                {evaluation.strengths?.length > 0 && (
                  <div className="mb-5 p-4 bg-green-50 border border-green-100 rounded-xl">
                    <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Strengths
                    </p>
                    <ul className="space-y-1">
                      {evaluation.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-green-800 flex items-start gap-2">
                          <span className="text-green-400 mt-0.5">✓</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {evaluation.missing?.length > 0 && (
                  <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl">
                    <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Missing Concepts
                    </p>
                    <ul className="space-y-1">
                      {evaluation.missing.map((m, i) => (
                        <li key={i} className="text-sm text-red-800 flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">✗</span>{m}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {evaluation.correction && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">Correction</p>
                    <p className="text-sm text-blue-900">{evaluation.correction}</p>
                  </div>
                )}

                {/* Reveal actual notes */}
                <div className="mb-6">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> Actual Notes
                  </p>
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                    {(currentSection.bullets || currentSection.content || []).map((b, i) => {
                      const missed = evaluation.missing?.some(m =>
                        b.toLowerCase().includes(m.toLowerCase().slice(0, 20))
                      );
                      return (
                        <div key={i} className={`flex items-start gap-2 px-3 py-1.5 rounded-lg text-sm ${
                          missed ? 'bg-red-50 text-red-900' : 'text-gray-700'
                        }`}>
                          <span className={`shrink-0 mt-0.5 ${missed ? 'text-red-400' : 'text-blue-400'}`}>●</span>
                          {b}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3">
                  {evaluation.score < 8 && (
                    <Button onClick={handleRequestRetest} variant="outline" className="gap-2 border-orange-300 text-orange-600 hover:bg-orange-50">
                      <RotateCcw className="w-4 h-4" /> Retest Weak Areas
                    </Button>
                  )}
                  <Button onClick={handleNextSection} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
                    {sectionIndex + 1 >= totalSections ? 'See Results' : 'Next Section'} <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* RETEST loading */}
            {phase === PHASE.retest && (
              <div className="text-center py-16">
                <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Generating follow-up question…</p>
              </div>
            )}

            {/* RETEST question */}
            {(phase === PHASE.retestfeedback === false && retestQ && phase !== PHASE.retest && phase !== PHASE.retesting && phase !== PHASE.feedback && phase !== PHASE.evaluating && phase !== PHASE.complete && phase !== PHASE.intro && phase !== PHASE.recall) && null}

            {retestQ && phase !== PHASE.retest && phase !== PHASE.retesting && phase !== PHASE.retestfeedback && phase !== PHASE.complete && phase !== PHASE.feedback && phase !== PHASE.intro && phase !== PHASE.recall && phase !== PHASE.evaluating && (
              <div>
                <div className="mb-2 text-xs font-semibold text-orange-500 uppercase tracking-widest">Follow-up Question</div>
                <p className="text-lg font-semibold text-gray-900 mb-4">{retestQ}</p>
                <textarea
                  value={retestInput}
                  onChange={e => setRetestInput(e.target.value)}
                  placeholder="Your answer..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none mb-3"
                />
                <Button onClick={handleSubmitRetest} disabled={!retestInput.trim()} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
                  <Send className="w-4 h-4" /> Submit
                </Button>
              </div>
            )}

            {/* Show retest question input when phase is a special "retestQuestion" — simplified: use inline check */}
            {retestQ && phase === 'retestQuestion' && (
              <div>
                <p className="text-lg font-semibold text-gray-900 mb-4">{retestQ}</p>
                <textarea value={retestInput} onChange={e => setRetestInput(e.target.value)} rows={4}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none mb-3" />
                <Button onClick={handleSubmitRetest} disabled={!retestInput.trim()} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
                  <Send className="w-4 h-4" /> Submit
                </Button>
              </div>
            )}

            {/* RETESTING */}
            {phase === PHASE.retesting && (
              <div className="text-center py-16">
                <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Evaluating your answer…</p>
              </div>
            )}

            {/* RETEST FEEDBACK */}
            {phase === PHASE.retestfeedback && retestEval && (
              <div>
                <div className="mb-2 text-xs font-semibold text-orange-500 uppercase tracking-widest">Retest Result</div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Follow-up Score</h2>
                  <ScoreBadge score={retestEval.score} />
                </div>
                {retestEval.feedback && (
                  <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-xl">
                    <p className="text-sm text-orange-900">{retestEval.feedback}</p>
                  </div>
                )}
                <Button onClick={handleNextSection} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
                  {sectionIndex + 1 >= totalSections ? 'See Results' : 'Next Section'} <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* COMPLETE */}
            {phase === PHASE.complete && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-10 h-10 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Complete!</h2>
                <p className="text-gray-500 mb-6">You recalled all {totalSections} sections</p>
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-purple-50 border border-purple-200 rounded-xl mb-8">
                  <span className="text-sm text-purple-700 font-medium">Average Score</span>
                  <ScoreBadge score={avgScore} />
                </div>
                <div className="space-y-3 mb-8 text-left max-w-md mx-auto">
                  {progress.map((p, i) => (
                    <div key={i} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
                      <span className="text-sm text-gray-700 font-medium truncate flex-1 mr-3">{p.sectionTitle}</span>
                      <ScoreBadge score={p.score} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => { setPhase(PHASE.intro); setProgress([]); setSectionIndex(0); setUserInput(''); setEvaluation(null); }} className="gap-2">
                    <RotateCcw className="w-4 h-4" /> Retry
                  </Button>
                  <Button onClick={onClose} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: progress */}
        {phase !== PHASE.intro && phase !== PHASE.complete && (
          <div className="hidden lg:flex w-64 border-l border-gray-200 bg-white flex-col p-4 shrink-0">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Progress</p>
            <div className="space-y-2">
              {sections.map((sec, i) => {
                const p = progress[i];
                const isActive = i === sectionIndex;
                const isDone = i < progress.length;
                return (
                  <div key={i} className={`px-3 py-2.5 rounded-lg border transition-all ${
                    isActive ? 'border-purple-300 bg-purple-50' :
                    isDone ? 'border-gray-100 bg-gray-50' : 'border-transparent'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium truncate flex-1 mr-2 ${isActive ? 'text-purple-700' : isDone ? 'text-gray-600' : 'text-gray-400'}`}>
                        {sec.title}
                      </span>
                      {isDone && <ScoreBadge score={p.score} />}
                      {isActive && !isDone && <span className="text-xs text-purple-500 font-semibold shrink-0">Active</span>}
                    </div>
                    {isDone && p.weakAreas?.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {p.weakAreas.slice(0, 2).map((w, j) => (
                          <span key={j} className="text-xs bg-red-50 text-red-500 px-1.5 py-0.5 rounded truncate max-w-full">{w.slice(0, 25)}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {progress.length > 0 && (
              <div className="mt-auto pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Avg Score</span>
                  <span className="text-sm font-bold text-gray-800">{avgScore}/10</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${avgScore >= 7 ? 'bg-green-500' : avgScore >= 5 ? 'bg-yellow-400' : 'bg-red-400'}`}
                    style={{ width: `${(avgScore / 10) * 100}%` }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}