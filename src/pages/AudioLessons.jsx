import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import { Button } from '@/components/ui/button';
import { Play, Pause, Mic, MicOff, CheckCircle2, XCircle, Loader2, Headphones, ChevronRight, RotateCcw, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

const LESSONS = [
  { id: 'sat_math', label: 'SAT Math', subject: 'SAT Math', emoji: '📐', topic: 'algebra, functions, and data analysis' },
  { id: 'sat_reading', label: 'SAT Reading', subject: 'SAT Reading & Writing', emoji: '📖', topic: 'reading comprehension, evidence-based analysis, and grammar' },
  { id: 'ap_bio', label: 'AP Biology', subject: 'AP Biology', emoji: '🧬', topic: 'cell structure, genetics, and evolution' },
  { id: 'ap_hug', label: 'AP Human Geography', subject: 'AP Human Geography', emoji: '🗺️', topic: 'population, migration, and cultural patterns' },
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

// ── Waveform animation component ──────────────────────────────────────────────
function Waveform({ active }) {
  return (
    <div className="flex items-center gap-[3px] h-8">
      {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all ${active ? 'bg-blue-500' : 'bg-gray-300'}`}
          style={{
            height: active ? `${h * 6 + Math.random() * 8}px` : `${h * 3}px`,
            animation: active ? `wave ${0.6 + i * 0.1}s ease-in-out infinite alternate` : 'none',
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          from { transform: scaleY(0.4); }
          to { transform: scaleY(1.4); }
        }
      `}</style>
    </div>
  );
}

export default function AudioLessons() {
  const navigate = useNavigate();

  // Lesson selection
  const [selectedLesson, setSelectedLesson] = useState(LESSONS[0]);
  const [difficulty, setDifficulty] = useState('Medium');

  // Lesson state
  const [phase, setPhase] = useState('idle'); // idle | generating | playing | checkpoint | evaluating | complete
  const [segments, setSegments] = useState([]);
  const [currentSegIdx, setCurrentSegIdx] = useState(0);

  // Audio (TTS)
  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const progressTimerRef = useRef(null);
  const segStartRef = useRef(Date.now());

  // Checkpoint state
  const [checkpoint, setCheckpoint] = useState(null); // { question, answerKey }
  const [voiceInput, setVoiceInput] = useState('');
  const [micState, setMicState] = useState('idle'); // idle | listening | processing
  const [evalResult, setEvalResult] = useState(null); // { correct, confidence, feedback, hint }
  const [attempts, setAttempts] = useState(0);
  const [textFallback, setTextFallback] = useState(false);
  const [fallbackText, setFallbackText] = useState('');
  const recognitionRef = useRef(null);

  // Progress tracking
  const [checkpointsTotal, setCheckpointsTotal] = useState(0);
  const [checkpointsDone, setCheckpointsDone] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (phase !== 'idle' && phase !== 'generating') {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, startTime]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ── Generate lesson ────────────────────────────────────────────────────────
  const generateLesson = async () => {
    setPhase('generating');
    setSegments([]);
    setCurrentSegIdx(0);
    setCheckpointsDone(0);
    setCorrectCount(0);
    setAudioProgress(0);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert AP/SAT tutor creating an engaging 5-minute audio lesson.
Subject: ${selectedLesson.subject}
Difficulty: ${difficulty}
Topic focus: ${selectedLesson.topic}

Generate a lesson with exactly 6 segments. Segments alternate: 2 teaching → 1 checkpoint → 2 teaching → 1 checkpoint → 2 teaching → 1 checkpoint.
Each teaching segment: 3-5 engaging sentences explaining a concept. Use conversational, clear language.
Each checkpoint: a question a student should be able to answer from the previous teaching.

Return JSON:`,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          segments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' }, // "teach" or "checkpoint"
                text: { type: 'string' },
                question: { type: 'string' },
                answerKey: { type: 'string' },
                hint: { type: 'string' },
              }
            }
          }
        }
      }
    });

    const segs = result.segments || [];
    const checkpoints = segs.filter(s => s.type === 'checkpoint');
    setCheckpointsTotal(checkpoints.length);
    setSegments(segs);
    setPhase('playing');
    playSegment(segs, 0);
  };

  // ── TTS playback ───────────────────────────────────────────────────────────
  const playSegment = useCallback((segs, idx) => {
    if (idx >= segs.length) {
      setPhase('complete');
      setIsPlaying(false);
      return;
    }

    const seg = segs[idx];
    setCurrentSegIdx(idx);

    if (seg.type === 'checkpoint') {
      setPhase('checkpoint');
      setCheckpoint({ question: seg.question, answerKey: seg.answerKey, hint: seg.hint });
      setAttempts(0);
      setEvalResult(null);
      setVoiceInput('');
      setFallbackText('');
      setIsPlaying(false);
      return;
    }

    // Teach segment — use TTS
    synthRef.current.cancel();
    const utter = new SpeechSynthesisUtterance(seg.text);
    utter.rate = 0.95;
    utter.pitch = 1.0;
    utteranceRef.current = utter;
    setIsPlaying(true);
    setAudioProgress(0);
    segStartRef.current = Date.now();

    const estimatedMs = seg.text.length * 65; // rough estimate
    clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - segStartRef.current) / estimatedMs) * 100);
      setAudioProgress(pct);
      if (pct >= 100) clearInterval(progressTimerRef.current);
    }, 200);

    utter.onend = () => {
      clearInterval(progressTimerRef.current);
      setAudioProgress(100);
      setIsPlaying(false);
      setTimeout(() => playSegment(segs, idx + 1), 600);
    };

    utter.onerror = () => {
      setIsPlaying(false);
      playSegment(segs, idx + 1);
    };

    synthRef.current.speak(utter);
  }, []);

  const togglePlayPause = () => {
    if (synthRef.current.paused) {
      synthRef.current.resume();
      setIsPlaying(true);
    } else if (synthRef.current.speaking) {
      synthRef.current.pause();
      setIsPlaying(false);
    }
  };

  // ── Speech recognition ─────────────────────────────────────────────────────
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setTextFallback(true);
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.continuous = false;
    rec.interimResults = false;
    recognitionRef.current = rec;
    setMicState('listening');
    setVoiceInput('');

    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setVoiceInput(transcript);
      setMicState('processing');
      evaluateAnswer(transcript);
    };

    rec.onerror = () => {
      setMicState('idle');
      setTextFallback(true);
      toast.error('Microphone error. Using text input instead.');
    };

    rec.onend = () => {
      if (micState === 'listening') setMicState('idle');
    };

    rec.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setMicState('idle');
  };

  // ── Evaluate answer ────────────────────────────────────────────────────────
  const evaluateAnswer = async (userAnswer) => {
    setMicState('processing');
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an AP/SAT tutor evaluating a student's spoken answer.
Question: ${checkpoint.question}
Expected answer key: ${checkpoint.answerKey}
Student's answer: "${userAnswer}"

Evaluate if the student demonstrated understanding of the core concept. Be lenient with exact wording.
Return JSON:`,
      response_json_schema: {
        type: 'object',
        properties: {
          correct: { type: 'boolean' },
          confidence: { type: 'number' },
          feedback: { type: 'string' },
        }
      }
    });

    setEvalResult(result);
    setMicState('idle');
    if (result.correct) {
      setCorrectCount(c => c + 1);
    }
  };

  const handleRetry = () => {
    setEvalResult(null);
    setVoiceInput('');
    setFallbackText('');
    setAttempts(a => a + 1);
  };

  const handleContinue = () => {
    setCheckpointsDone(d => d + 1);
    setCheckpoint(null);
    setEvalResult(null);
    setVoiceInput('');
    setPhase('playing');
    playSegment(segments, currentSegIdx + 1);
  };

  const handleSubmitText = () => {
    if (!fallbackText.trim()) return;
    setVoiceInput(fallbackText);
    setMicState('processing');
    evaluateAnswer(fallbackText);
  };

  const progressPct = segments.length > 0
    ? Math.round(((currentSegIdx) / segments.length) * 100)
    : 0;
  const accuracyPct = checkpointsDone > 0
    ? Math.round((correctCount / checkpointsDone) * 100)
    : 0;

  const currentSeg = segments[currentSegIdx];
  const currentTeachIdx = segments.slice(0, currentSegIdx + 1).filter(s => s.type === 'teach').length;

  return (
    <ProtectedRoute>
      <DashboardNavbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <button onClick={() => navigate('/Dashboard')} className="hover:text-gray-600">Dashboard</button>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-700 font-medium">Audio Lessons</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Audio Lessons</h1>
            <p className="text-gray-500 mt-1">Learn concepts through guided audio with interactive checkpoints</p>
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT: Player + Lesson */}
            <div className="lg:col-span-2 space-y-4">

              {/* Lesson Selector — shown when idle */}
              {phase === 'idle' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h2 className="text-base font-semibold text-gray-800 mb-4">Select a Lesson</h2>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {LESSONS.map(l => (
                      <button
                        key={l.id}
                        onClick={() => setSelectedLesson(l)}
                        className={`border rounded-xl p-4 text-left transition-all ${
                          selectedLesson.id === l.id
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-blue-300'
                        }`}
                      >
                        <div className="text-2xl mb-2">{l.emoji}</div>
                        <div className={`text-sm font-semibold ${selectedLesson.id === l.id ? 'text-blue-700' : 'text-gray-800'}`}>{l.label}</div>
                      </button>
                    ))}
                  </div>

                  <div className="mb-6">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Difficulty</label>
                    <div className="flex gap-2">
                      {DIFFICULTIES.map(d => (
                        <button
                          key={d}
                          onClick={() => setDifficulty(d)}
                          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                            difficulty === d ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >{d}</button>
                      ))}
                    </div>
                  </div>

                  <Button onClick={generateLesson} className="bg-blue-500 hover:bg-blue-600 w-full" size="lg">
                    <Headphones className="w-4 h-4 mr-2" /> Start Lesson
                  </Button>
                </div>
              )}

              {/* Generating */}
              {phase === 'generating' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <p className="text-gray-700 font-medium">Preparing your lesson…</p>
                  <p className="text-gray-400 text-sm">Generating {selectedLesson.label} content</p>
                </div>
              )}

              {/* Audio Player — shown during playing/checkpoint */}
              {(phase === 'playing' || phase === 'checkpoint') && segments.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-blue-500 font-semibold uppercase tracking-wider">{selectedLesson.label}</p>
                      <h3 className="text-gray-900 font-semibold text-lg mt-0.5">
                        {phase === 'checkpoint' ? '🎯 Checkpoint' : `Segment ${currentTeachIdx}`}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400">{difficulty}</span>
                    </div>
                  </div>

                  {/* Current segment text */}
                  {currentSeg && currentSeg.type === 'teach' && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4 text-gray-700 text-sm leading-relaxed border border-gray-100">
                      {currentSeg.text}
                    </div>
                  )}

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Segment progress</span>
                      <span>{Math.round(audioProgress)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${audioProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Controls */}
                  {phase === 'playing' && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={togglePlayPause}
                        className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>
                      <Waveform active={isPlaying} />
                    </div>
                  )}
                </div>
              )}

              {/* Checkpoint Card */}
              {phase === 'checkpoint' && checkpoint && (
                <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-bold">?</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-700">Checkpoint Question</span>
                  </div>

                  <p className="text-gray-900 font-medium text-base mb-6 leading-relaxed">{checkpoint.question}</p>

                  {/* Show hint after 1st failed attempt */}
                  {attempts >= 1 && !evalResult?.correct && checkpoint.hint && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-amber-800 text-sm">
                      💡 Hint: {checkpoint.hint}
                    </div>
                  )}

                  {/* Eval result */}
                  {evalResult && (
                    <div className={`rounded-lg p-4 mb-4 ${evalResult.correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {evalResult.correct
                          ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                          : <XCircle className="w-4 h-4 text-red-500" />}
                        <span className={`text-sm font-semibold ${evalResult.correct ? 'text-green-700' : 'text-red-700'}`}>
                          {evalResult.correct ? 'Nice! Let\'s continue.' : attempts >= 2 ? 'Moving on…' : 'Try again'}
                        </span>
                      </div>
                      <p className={`text-sm ${evalResult.correct ? 'text-green-700' : 'text-red-700'}`}>{evalResult.feedback}</p>
                      {voiceInput && (
                        <p className="text-xs text-gray-400 mt-2">You said: "{voiceInput}"</p>
                      )}
                    </div>
                  )}

                  {/* After 2nd failure: show correct answer */}
                  {!evalResult?.correct && attempts >= 2 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-blue-800 text-sm">
                      <strong>Correct answer:</strong> {checkpoint.answerKey}
                    </div>
                  )}

                  {/* Voice input or text fallback */}
                  {micState === 'idle' && !evalResult?.correct && attempts < 2 && (
                    <div>
                      {!textFallback ? (
                        <button
                          onClick={startListening}
                          className="w-full py-4 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 transition-colors flex flex-col items-center gap-2"
                        >
                          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                            <Mic className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-blue-600 font-semibold text-sm">Tap to Answer</span>
                          <span className="text-blue-400 text-xs">Speak your answer clearly</span>
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <textarea
                            value={fallbackText}
                            onChange={e => setFallbackText(e.target.value)}
                            placeholder="Type your answer here…"
                            className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                            rows={3}
                          />
                          <Button onClick={handleSubmitText} className="bg-blue-500 hover:bg-blue-600 w-full">
                            Submit Answer
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Listening state */}
                  {micState === 'listening' && (
                    <div className="flex flex-col items-center gap-3 py-6">
                      <div className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-200 animate-pulse">
                        <Mic className="w-6 h-6 text-white" />
                      </div>
                      <Waveform active={true} />
                      <p className="text-gray-600 text-sm font-medium">Listening…</p>
                      <button onClick={stopListening} className="text-xs text-gray-400 hover:text-gray-600 underline">Stop</button>
                    </div>
                  )}

                  {/* Processing */}
                  {micState === 'processing' && (
                    <div className="flex flex-col items-center gap-3 py-6">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                      <p className="text-gray-600 text-sm">Analyzing your answer…</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3 mt-4">
                    {evalResult?.correct && (
                      <Button onClick={handleContinue} className="bg-green-500 hover:bg-green-600 flex-1">
                        Continue Lesson →
                      </Button>
                    )}
                    {evalResult && !evalResult.correct && attempts < 2 && (
                      <Button onClick={handleRetry} variant="outline" className="flex-1">
                        <RotateCcw className="w-4 h-4 mr-1" /> Try Again
                      </Button>
                    )}
                    {(attempts >= 2 || (evalResult && !evalResult.correct && attempts >= 1)) && !evalResult?.correct && attempts >= 2 && (
                      <Button onClick={handleContinue} className="bg-blue-500 hover:bg-blue-600 flex-1">
                        Continue Anyway →
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Complete */}
              {phase === 'complete' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
                  <div className="text-5xl mb-4">🎉</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Lesson Complete!</h2>
                  <p className="text-gray-500 mb-6">{selectedLesson.label} · {difficulty}</p>
                  <div className="flex gap-6 justify-center mb-8">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-500">{accuracyPct}%</p>
                      <p className="text-xs text-gray-500">Accuracy</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-500">{correctCount}/{checkpointsTotal}</p>
                      <p className="text-xs text-gray-500">Checkpoints</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-700">{formatTime(elapsed)}</p>
                      <p className="text-xs text-gray-500">Time Spent</p>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => setPhase('idle')}>
                      Try Another Lesson
                    </Button>
                    <Button className="bg-blue-500 hover:bg-blue-600" onClick={generateLesson}>
                      Repeat Lesson
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Progress panel */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sticky top-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Lesson Progress</h3>

                <div className="space-y-4">
                  {/* Overall progress */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Overall</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <StatRow label="Checkpoints" value={`${checkpointsDone} / ${checkpointsTotal || '—'}`} color="text-blue-600" />
                    <StatRow label="Accuracy" value={checkpointsDone > 0 ? `${accuracyPct}%` : '—'} color={accuracyPct >= 70 ? 'text-green-600' : 'text-red-500'} />
                    <StatRow label="Time Spent" value={phase !== 'idle' ? formatTime(elapsed) : '—'} color="text-gray-700" />
                    <StatRow label="Difficulty" value={difficulty} color="text-gray-700" />
                  </div>

                  {/* Checkpoint list */}
                  {segments.filter(s => s.type === 'checkpoint').length > 0 && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Checkpoints</p>
                      {segments.filter(s => s.type === 'checkpoint').map((seg, i) => {
                        const globalIdx = segments.indexOf(seg);
                        const done = currentSegIdx > globalIdx;
                        const active = currentSegIdx === globalIdx && phase === 'checkpoint';
                        return (
                          <div key={i} className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs mb-1 ${active ? 'bg-blue-50' : ''}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-green-100 text-green-600' : active ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                              {done ? '✓' : i + 1}
                            </div>
                            <span className={done ? 'text-green-700' : active ? 'text-blue-700 font-semibold' : 'text-gray-500'}>
                              Checkpoint {i + 1}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {phase === 'idle' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 text-center text-gray-400 text-xs">
                    Select a lesson to begin
                  </div>
                )}
              </div>

              {/* Tip card */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-700 mb-1">💡 How it works</p>
                <p className="text-xs text-blue-600 leading-relaxed">
                  Listen to the audio lesson. At each checkpoint, speak or type your answer. The AI will evaluate your response and give personalized feedback.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
    </div>
  );
}