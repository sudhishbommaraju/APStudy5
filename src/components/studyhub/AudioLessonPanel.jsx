import React, { useState, useRef, useEffect } from 'react';
import { Headphones, Play, Pause, Mic, CheckCircle, XCircle, Loader2, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AudioLessonPanel({ note }) {
  const [state, setState] = useState('idle'); // idle | loading | playing | checkpoint | result | done
  const [script, setScript] = useState(null);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [checkpoint, setCheckpoint] = useState(null);
  const [micState, setMicState] = useState('idle'); // idle | listening | processing
  const [attempts, setAttempts] = useState(0);
  const [checkpointResult, setCheckpointResult] = useState(null); // null | correct | incorrect
  const [textAnswer, setTextAnswer] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);

  const synthRef = useRef(null);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);

  const currentSegment = script?.segments?.[segmentIndex];
  const totalDuration = script?.segments?.reduce((acc, s) => acc + (s.duration || 10), 0) || 60;

  useEffect(() => {
    return () => {
      stopAll();
    };
  }, []);

  function stopAll() {
    if (synthRef.current) window.speechSynthesis?.cancel();
    clearInterval(timerRef.current);
    if (recognitionRef.current) recognitionRef.current.abort?.();
  }

  async function generateScript() {
    setState('loading');
    const nd = note.notes_data || {};
    const notesText = [
      note.title,
      ...(Array.isArray(nd.summary) ? nd.summary : [nd.summary || '']),
      ...(nd.sections || []).flatMap(s => [s.title, ...(s.bullets || []).slice(0, 3)]),
    ].join('\n').slice(0, 3000);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an engaging AP tutor. Create a short audio lesson script (3-4 segments) about:
"""
${notesText}
"""
Each segment should be 2-3 sentences of clear explanation. After segment 2, insert a checkpoint question to test understanding.

Return structured JSON with segments and a checkpoint.`,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          segments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                text: { type: 'string' },
                label: { type: 'string' },
                duration: { type: 'number' },
                hasCheckpoint: { type: 'boolean' }
              }
            }
          },
          checkpoint: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              correctAnswer: { type: 'string' },
              keywords: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    });

    setScript(result);
    setSegmentIndex(0);
    setElapsed(0);
    setProgress(0);
    setState('playing');
    setIsPlaying(true);
    speakSegment(result.segments[0], result);
  }

  function speakSegment(segment, scriptData) {
    if (!segment || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utt = new SpeechSynthesisUtterance(segment.text);
    utt.rate = 0.95;
    utt.pitch = 1;

    utt.onend = () => {
      const s = scriptData || script;
      if (segment.hasCheckpoint && s?.checkpoint) {
        setState('checkpoint');
        setCheckpoint(s.checkpoint);
        setAttempts(0);
        setCheckpointResult(null);
        setIsPlaying(false);
      } else {
        const nextIdx = (scriptData || script).segments.indexOf(segment) + 1;
        if (nextIdx < (scriptData || script).segments.length) {
          setSegmentIndex(nextIdx);
          speakSegment((scriptData || script).segments[nextIdx], scriptData || script);
        } else {
          setState('done');
          setIsPlaying(false);
          clearInterval(timerRef.current);
        }
      }
    };

    window.speechSynthesis.speak(utt);
    synthRef.current = utt;

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsed(e => {
        const next = e + 0.5;
        setProgress(Math.min((next / totalDuration) * 100, 100));
        return next;
      });
    }, 500);
  }

  function togglePlayPause() {
    if (isPlaying) {
      window.speechSynthesis?.pause();
      clearInterval(timerRef.current);
      setIsPlaying(false);
    } else {
      window.speechSynthesis?.resume();
      timerRef.current = setInterval(() => {
        setElapsed(e => {
          const next = e + 0.5;
          setProgress(Math.min((next / totalDuration) * 100, 100));
          return next;
        });
      }, 500);
      setIsPlaying(true);
    }
  }

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setShowTextInput(true);
      return;
    }

    setMicState('listening');
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setMicState('processing');
      evaluateAnswer(transcript);
    };

    recognition.onerror = () => {
      setMicState('idle');
      setShowTextInput(true);
    };

    recognition.onend = () => {
      if (micState === 'listening') setMicState('idle');
    };

    recognition.start();
  }

  async function evaluateAnswer(answer) {
    const keywords = checkpoint?.keywords || [];
    const answerLower = answer.toLowerCase();
    const correct = keywords.some(kw => answerLower.includes(kw.toLowerCase()));

    setMicState('idle');
    setCheckpointResult(correct ? 'correct' : 'incorrect');

    if (!correct && attempts < 1) {
      setAttempts(a => a + 1);
      setTimeout(() => {
        setCheckpointResult(null);
        setShowTextInput(false);
      }, 2000);
    }
  }

  function continueLesson() {
    setState('playing');
    setCheckpoint(null);
    setCheckpointResult(null);
    setShowTextInput(false);
    setIsPlaying(true);
    const nextIdx = segmentIndex + 1;
    if (nextIdx < script.segments.length) {
      setSegmentIndex(nextIdx);
      speakSegment(script.segments[nextIdx]);
    } else {
      setState('done');
      setIsPlaying(false);
    }
  }

  function restart() {
    stopAll();
    setState('idle');
    setScript(null);
    setSegmentIndex(0);
    setProgress(0);
    setElapsed(0);
    setAttempts(0);
    setCheckpointResult(null);
    setShowTextInput(false);
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  // ── IDLE ──
  if (state === 'idle') return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
          <Headphones className="w-4 h-4 text-indigo-600" />
        </div>
        <h3 className="text-sm font-semibold text-gray-800">Audio Lesson</h3>
      </div>
      <p className="text-xs text-gray-500 mb-4">Learn this topic with guided audio and checkpoints</p>
      <button
        onClick={generateScript}
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
      >
        Start Lesson
      </button>
    </div>
  );

  // ── LOADING ──
  if (state === 'loading') return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
          <Headphones className="w-4 h-4 text-indigo-600" />
        </div>
        <h3 className="text-sm font-semibold text-gray-800">Audio Lesson</h3>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
        Generating your lesson…
      </div>
    </div>
  );

  // ── CHECKPOINT ──
  if (state === 'checkpoint') return (
    <div className="bg-white border border-indigo-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-yellow-100 rounded-lg flex items-center justify-center">
          <span className="text-sm">🎯</span>
        </div>
        <h3 className="text-sm font-semibold text-gray-800">Checkpoint</h3>
        <span className="ml-auto text-xs text-gray-400">{attempts}/2 attempts</span>
      </div>

      <p className="text-xs text-gray-700 mb-4 leading-relaxed">{checkpoint?.question}</p>

      {checkpointResult === 'correct' && (
        <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg mb-3">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-xs font-medium text-green-700">Correct! Great job.</span>
        </div>
      )}

      {checkpointResult === 'incorrect' && attempts >= 2 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg mb-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs font-medium text-red-700">Not quite.</span>
          </div>
          <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
            <span className="font-semibold text-gray-700">Answer: </span>{checkpoint?.correctAnswer}
          </p>
        </div>
      )}

      {checkpointResult === null && (
        <>
          {micState === 'listening' ? (
            <div className="flex flex-col items-center gap-2 py-3">
              <div className="flex items-end gap-0.5 h-6">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-1 bg-indigo-400 rounded-full animate-pulse"
                    style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <span className="text-xs text-indigo-600 font-medium">Listening…</span>
            </div>
          ) : micState === 'processing' ? (
            <div className="flex items-center justify-center gap-2 py-3 text-xs text-gray-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing…
            </div>
          ) : (
            <div className="space-y-2">
              {!showTextInput ? (
                <button
                  onClick={startListening}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <Mic className="w-3.5 h-3.5" /> Answer
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={textAnswer}
                    onChange={e => setTextAnswer(e.target.value)}
                    placeholder="Type your answer…"
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    onKeyDown={e => e.key === 'Enter' && evaluateAnswer(textAnswer)}
                  />
                  <button
                    onClick={() => evaluateAnswer(textAnswer)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg"
                  >
                    Submit
                  </button>
                </div>
              )}
              <button onClick={() => setShowTextInput(!showTextInput)} className="w-full text-xs text-gray-400 hover:text-gray-600 py-1">
                {showTextInput ? '🎤 Use microphone' : 'Type instead'}
              </button>
            </div>
          )}
        </>
      )}

      {(checkpointResult === 'correct' || (checkpointResult === 'incorrect' && attempts >= 2)) && (
        <button
          onClick={continueLesson}
          className="w-full mt-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          Continue Lesson →
        </button>
      )}
    </div>
  );

  // ── DONE ──
  if (state === 'done') return (
    <div className="bg-white border border-green-200 rounded-xl p-4 shadow-sm text-center">
      <div className="text-2xl mb-2">🎉</div>
      <h3 className="text-sm font-semibold text-gray-800 mb-1">Lesson Complete!</h3>
      <p className="text-xs text-gray-500 mb-4">{script?.title || note.title}</p>
      <button onClick={restart} className="w-full flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50">
        <RotateCcw className="w-3 h-3" /> Replay
      </button>
    </div>
  );

  // ── PLAYING ──
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
          <Headphones className="w-4 h-4 text-indigo-600" />
        </div>
        <h3 className="text-sm font-semibold text-gray-800">Audio Lesson</h3>
      </div>

      {currentSegment && (
        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
          <span className="font-medium text-gray-700">Now: </span>
          {currentSegment.label || `Part ${segmentIndex + 1}`}
        </p>
      )}

      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{formatTime(elapsed)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={togglePlayPause}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          {isPlaying ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Resume</>}
        </button>
        <button onClick={restart} className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}