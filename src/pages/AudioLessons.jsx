import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import { Button } from '@/components/ui/button';
import { Play, Pause, Mic, Loader2, Headphones, ChevronRight, RotateCcw, CheckCircle2, XCircle, SkipBack, SkipForward, Settings, Volume2, Captions } from 'lucide-react';
import { toast } from 'sonner';

// ── AP Subjects (all) ──────────────────────────────────────────────────────────
const AP_SUBJECTS = [
  { id: 'biology', name: 'AP Biology', emoji: '🧬', topic: 'cell structure, genetics, evolution, ecology' },
  { id: 'chemistry', name: 'AP Chemistry', emoji: '⚗️', topic: 'atomic structure, bonding, thermodynamics, equilibrium' },
  { id: 'physics_1', name: 'AP Physics 1', emoji: '⚡', topic: 'kinematics, Newton\'s laws, energy, momentum, waves' },
  { id: 'physics_2', name: 'AP Physics 2', emoji: '🔬', topic: 'fluids, thermodynamics, electricity, optics, quantum' },
  { id: 'physics_c_mech', name: 'AP Physics C: Mech', emoji: '🚀', topic: 'calculus-based mechanics, rotation, gravitation' },
  { id: 'environmental_science', name: 'AP Env. Science', emoji: '🌍', topic: 'ecosystems, pollution, energy, global change' },
  { id: 'calc_ab', name: 'AP Calculus AB', emoji: '∫', topic: 'limits, derivatives, integrals, differential equations' },
  { id: 'calc_bc', name: 'AP Calculus BC', emoji: '∑', topic: 'series, parametric, polar, advanced integration' },
  { id: 'statistics', name: 'AP Statistics', emoji: '📊', topic: 'data analysis, probability, inference, regression' },
  { id: 'computer_science_a', name: 'AP CS A', emoji: '💻', topic: 'Java OOP, arrays, inheritance, recursion' },
  { id: 'cs_principles', name: 'AP CS Principles', emoji: '🌐', topic: 'algorithms, data, internet, impact of computing' },
  { id: 'us_history', name: 'AP US History', emoji: '🇺🇸', topic: 'colonial era through present, periods and themes' },
  { id: 'world_history', name: 'AP World History', emoji: '🌍', topic: 'global networks, empires, revolutions, globalization' },
  { id: 'european_history', name: 'AP European History', emoji: '🏰', topic: 'Renaissance through Cold War Europe' },
  { id: 'us_gov', name: 'AP US Government', emoji: '🏛️', topic: 'Constitution, branches, civil liberties, participation' },
  { id: 'human_geo', name: 'AP Human Geography', emoji: '🗺️', topic: 'population, migration, culture, urbanization' },
  { id: 'psychology', name: 'AP Psychology', emoji: '🧠', topic: 'biological bases, cognition, development, social psych' },
  { id: 'macro', name: 'AP Macroeconomics', emoji: '📈', topic: 'GDP, inflation, monetary policy, open economy' },
  { id: 'micro', name: 'AP Microeconomics', emoji: '💰', topic: 'supply/demand, market structures, factor markets' },
  { id: 'english_lang', name: 'AP English Language', emoji: '✍️', topic: 'rhetoric, argumentation, style, synthesis' },
  { id: 'english_lit', name: 'AP English Literature', emoji: '📚', topic: 'fiction, poetry, drama, literary analysis' },
  { id: 'art_history', name: 'AP Art History', emoji: '🎨', topic: 'global art traditions, formal analysis, context' },
  { id: 'music_theory', name: 'AP Music Theory', emoji: '🎵', topic: 'scales, harmony, voice leading, musical form' },
  { id: 'spanish_lang', name: 'AP Spanish Language', emoji: '🇪🇸', topic: 'interpersonal, presentational, interpretive communication' },
  { id: 'french_lang', name: 'AP French Language', emoji: '🇫🇷', topic: 'French language skills, culture, and themes' },
  { id: 'latin', name: 'AP Latin', emoji: '🏛️', topic: 'Caesar, Vergil, Roman culture and grammar' },
  { id: 'comp_gov', name: 'AP Comparative Gov', emoji: '⚖️', topic: 'political systems, institutions, policy, democratization' },
  { id: 'art_2d', name: 'AP 2-D Art & Design', emoji: '🖼️', topic: 'design principles, composition, artistic process' },
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const CATEGORIES = [
  { label: 'Sciences', ids: ['biology','chemistry','physics_1','physics_2','physics_c_mech','environmental_science'] },
  { label: 'Math & CS', ids: ['calc_ab','calc_bc','statistics','computer_science_a','cs_principles'] },
  { label: 'History & Social Studies', ids: ['us_history','world_history','european_history','us_gov','human_geo','psychology','macro','micro','comp_gov'] },
  { label: 'English & Arts', ids: ['english_lang','english_lit','art_history','music_theory','art_2d'] },
  { label: 'World Languages', ids: ['spanish_lang','french_lang','latin'] },
];

// ── Voice personalities ──────────────────────────────────────────────────────
const VOICE_PROFILES = [
  { id: 'clear', label: 'Clear', desc: 'Neutral teacher', rate: 1.0, pitch: 1.0 },
  { id: 'friendly', label: 'Friendly', desc: 'Casual tone', rate: 1.05, pitch: 1.1 },
  { id: 'energetic', label: 'Energetic', desc: 'Faster pace', rate: 1.2, pitch: 1.15 },
  { id: 'calm', label: 'Calm', desc: 'Slower, focused', rate: 0.85, pitch: 0.95 },
];

const INTROS = [
  "Alright, let's break this down.",
  "Here's how to think about this.",
  "Let's go step by step.",
  "This is easier than it looks.",
  "Okay, pay attention — this is important.",
  "Let me walk you through this.",
  "Here's the big idea you need to know.",
  "Ready? Let's dive in.",
];

// ── Waveform ──────────────────────────────────────────────────────────────────
function Waveform({ active }) {
  const bars = [2, 4, 6, 8, 6, 4, 3, 5, 7, 5, 3, 4, 6];
  return (
    <div className="flex items-center gap-[2px] h-8">
      {bars.map((h, i) => (
        <div key={i} className={`w-[3px] rounded-full ${active ? 'bg-blue-500' : 'bg-gray-300'}`}
          style={{
            height: `${h * 3}px`,
            animation: active ? `waveBar 0.${5 + (i % 4)}s ease-in-out infinite alternate` : 'none',
            animationDelay: `${i * 40}ms`,
          }}
        />
      ))}
      <style>{`@keyframes waveBar { from { transform: scaleY(0.3); } to { transform: scaleY(1.4); } }`}</style>
    </div>
  );
}

export default function AudioLessons() {
  const navigate = useNavigate();

  // Lesson selection
  const [selectedSubject, setSelectedSubject] = useState(AP_SUBJECTS[0]);
  const [difficulty, setDifficulty] = useState('Medium');
  const [showSettings, setShowSettings] = useState(false);

  // Voice settings (persisted)
  const [voiceProfile, setVoiceProfile] = useState(() => {
    const saved = localStorage.getItem('audio_voice_profile');
    return VOICE_PROFILES.find(v => v.id === saved) || VOICE_PROFILES[0];
  });
  const [playbackSpeed, setPlaybackSpeed] = useState(() => parseFloat(localStorage.getItem('audio_speed') || '1'));
  const [captionsOn, setCaptionsOn] = useState(() => localStorage.getItem('audio_captions') === 'true');

  useEffect(() => { localStorage.setItem('audio_voice_profile', voiceProfile.id); }, [voiceProfile]);
  useEffect(() => { localStorage.setItem('audio_speed', playbackSpeed); }, [playbackSpeed]);
  useEffect(() => { localStorage.setItem('audio_captions', captionsOn); }, [captionsOn]);

  // Lesson state
  const [phase, setPhase] = useState('idle'); // idle | generating | playing | checkpoint | evaluating | complete
  const [segments, setSegments] = useState([]);
  const [currentSegIdx, setCurrentSegIdx] = useState(0);
  const [lessonTitle, setLessonTitle] = useState('');

  // TTS
  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const progressTimerRef = useRef(null);
  const segStartRef = useRef(Date.now());
  const segDurRef = useRef(1);
  const segmentsRef = useRef([]);

  // Checkpoint
  const [checkpoint, setCheckpoint] = useState(null);
  const [voiceInput, setVoiceInput] = useState('');
  const [micState, setMicState] = useState('idle');
  const [evalResult, setEvalResult] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [textFallback, setTextFallback] = useState(false);
  const [fallbackText, setFallbackText] = useState('');
  const recognitionRef = useRef(null);

  // Progress
  const [checkpointsTotal, setCheckpointsTotal] = useState(0);
  const [checkpointsDone, setCheckpointsDone] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionStart] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      if (phase !== 'idle' && phase !== 'generating') setElapsed(Math.floor((Date.now() - sessionStart) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [phase, sessionStart]);

  const formatTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ── Generate lesson ────────────────────────────────────────────────────────
  const generateLesson = async () => {
    setPhase('generating');
    setSegments([]);
    segmentsRef.current = [];
    setCurrentSegIdx(0);
    setCheckpointsDone(0);
    setCorrectCount(0);
    setAudioProgress(0);

    const intro = INTROS[Math.floor(Math.random() * INTROS.length)];

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are creating a conversational audio lesson script for an AP student. The tone should be like a real human tutor — short sentences, natural flow, never robotic.

Subject: ${selectedSubject.name}
Difficulty: ${difficulty}
Topics: ${selectedSubject.topic}

Generate exactly 6 segments alternating: teach, teach, checkpoint, teach, teach, checkpoint, teach, teach, checkpoint.
- Teaching segments: 3-5 short, natural sentences. Conversational. Use phrases like "so basically", "here's the thing", "think of it this way".
- Checkpoint segments: a clear question testing the previous teaching. Include an answer key and a helpful hint.

Start the first teach segment with this intro: "${intro}"

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
                type: { type: 'string' },
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
    const cps = segs.filter(s => s.type === 'checkpoint');
    setCheckpointsTotal(cps.length);
    setLessonTitle(result.title || selectedSubject.name);
    setSegments(segs);
    segmentsRef.current = segs;
    setPhase('playing');
    playSegment(segs, 0);
  };

  // ── TTS ────────────────────────────────────────────────────────────────────
  const getVoice = () => {
    const voices = synthRef.current.getVoices();
    // Prefer natural-sounding English voices
    const preferred = ['Google UK English Female', 'Google US English', 'Samantha', 'Victoria', 'Karen', 'Daniel'];
    for (const name of preferred) {
      const v = voices.find(v => v.name === name);
      if (v) return v;
    }
    return voices.find(v => v.lang.startsWith('en')) || voices[0];
  };

  const playSegment = useCallback((segs, idx) => {
    if (idx >= segs.length) { setPhase('complete'); setIsPlaying(false); return; }
    const seg = segs[idx];
    setCurrentSegIdx(idx);
    setAudioProgress(0);

    if (seg.type === 'checkpoint') {
      setPhase('checkpoint');
      setCheckpoint({ question: seg.question, answerKey: seg.answerKey, hint: seg.hint });
      setAttempts(0); setEvalResult(null); setVoiceInput(''); setFallbackText('');
      setIsPlaying(false);
      return;
    }

    synthRef.current.cancel();
    const utter = new SpeechSynthesisUtterance(seg.text);
    const vp = VOICE_PROFILES.find(v => v.id === localStorage.getItem('audio_voice_profile')) || VOICE_PROFILES[0];
    const speed = parseFloat(localStorage.getItem('audio_speed') || '1');
    utter.rate = vp.rate * speed;
    utter.pitch = vp.pitch;
    utter.voice = getVoice();
    utteranceRef.current = utter;
    setIsPlaying(true);

    const estMs = (seg.text.length * 65) / (vp.rate * speed);
    segDurRef.current = estMs;
    segStartRef.current = Date.now();

    clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      const pct = Math.min(99, ((Date.now() - segStartRef.current) / segDurRef.current) * 100);
      setAudioProgress(pct);
    }, 200);

    utter.onend = () => {
      clearInterval(progressTimerRef.current);
      setAudioProgress(100);
      setIsPlaying(false);
      setTimeout(() => playSegment(segs, idx + 1), 500);
    };
    utter.onerror = () => { setIsPlaying(false); playSegment(segs, idx + 1); };
    synthRef.current.speak(utter);
  }, []);

  const togglePlayPause = () => {
    if (synthRef.current.paused) { synthRef.current.resume(); setIsPlaying(true); }
    else if (synthRef.current.speaking) { synthRef.current.pause(); setIsPlaying(false); }
  };

  const skipBack = () => {
    if (currentSegIdx > 0) {
      synthRef.current.cancel();
      clearInterval(progressTimerRef.current);
      playSegment(segmentsRef.current, Math.max(0, currentSegIdx - 1));
    }
  };

  const skipForward = () => {
    synthRef.current.cancel();
    clearInterval(progressTimerRef.current);
    const next = currentSegIdx + 1;
    if (next < segmentsRef.current.length) playSegment(segmentsRef.current, next);
  };

  // ── Speech recognition ─────────────────────────────────────────────────────
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setTextFallback(true); return; }
    const rec = new SR();
    rec.lang = 'en-US'; rec.continuous = false; rec.interimResults = false;
    recognitionRef.current = rec;
    setMicState('listening'); setVoiceInput('');
    rec.onresult = e => { const t = e.results[0][0].transcript; setVoiceInput(t); setMicState('processing'); evaluateAnswer(t); };
    rec.onerror = () => { setMicState('idle'); setTextFallback(true); toast.error('Mic error — using text input instead.'); };
    rec.onend = () => setMicState(s => s === 'listening' ? 'idle' : s);
    rec.start();
  };

  const evaluateAnswer = async (userAnswer) => {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `AP tutor evaluating a student's spoken answer. Be lenient with wording — focus on understanding.
Question: ${checkpoint.question}
Expected: ${checkpoint.answerKey}
Student said: "${userAnswer}"
Return JSON:`,
      response_json_schema: {
        type: 'object',
        properties: {
          correct: { type: 'boolean' },
          feedback: { type: 'string' },
        }
      }
    });
    setEvalResult(result);
    setMicState('idle');
    if (result.correct) setCorrectCount(c => c + 1);
  };

  const handleRetry = () => { setEvalResult(null); setVoiceInput(''); setFallbackText(''); setAttempts(a => a + 1); };

  const handleContinue = () => {
    setCheckpointsDone(d => d + 1); setCheckpoint(null); setEvalResult(null); setVoiceInput('');
    setPhase('playing');
    playSegment(segmentsRef.current, currentSegIdx + 1);
  };

  const handleSubmitText = () => {
    if (!fallbackText.trim()) return;
    setVoiceInput(fallbackText); setMicState('processing'); evaluateAnswer(fallbackText);
  };

  const progressPct = segments.length > 0 ? Math.round((currentSegIdx / segments.length) * 100) : 0;
  const accuracyPct = checkpointsDone > 0 ? Math.round((correctCount / checkpointsDone) * 100) : 0;
  const currentSeg = segments[currentSegIdx];

  return (
    <ProtectedRoute>
      <DashboardNavbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <button onClick={() => navigate('/Dashboard')} className="hover:text-gray-600">Dashboard</button>
                <ChevronRight className="w-3 h-3" />
                <span className="text-gray-700 font-medium">Audio Lessons</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Audio Lessons</h1>
              <p className="text-gray-500 mt-1">Learn AP concepts through guided audio with interactive checkpoints</p>
            </div>
            <button
              onClick={() => setShowSettings(s => !s)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${showSettings ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              <Settings className="w-4 h-4" /> Voice Settings
            </button>
          </div>

          {/* Voice Settings Panel */}
          {showSettings && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Voice Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Voice Style</label>
                  <div className="space-y-2">
                    {VOICE_PROFILES.map(v => (
                      <button key={v.id} onClick={() => setVoiceProfile(v)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-all ${voiceProfile.id === v.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}>
                        <span className="font-medium">{v.label}</span>
                        <span className="text-xs text-gray-400">{v.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Playback Speed: {playbackSpeed}x</label>
                  <input type="range" min="0.75" max="1.5" step="0.25" value={playbackSpeed}
                    onChange={e => setPlaybackSpeed(parseFloat(e.target.value))}
                    className="w-full accent-blue-500" />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0.75x</span><span>1x</span><span>1.5x</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Options</label>
                  <button onClick={() => setCaptionsOn(c => !c)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all w-full ${captionsOn ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <Captions className="w-4 h-4" />
                    Captions {captionsOn ? 'On' : 'Off'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT */}
            <div className="lg:col-span-2 space-y-4">

              {/* Idle: Subject Selector */}
              {phase === 'idle' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h2 className="text-base font-semibold text-gray-800 mb-5">Select a Subject</h2>
                  {CATEGORIES.map(cat => (
                    <div key={cat.label} className="mb-6">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{cat.label}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {cat.ids.map(id => {
                          const sub = AP_SUBJECTS.find(s => s.id === id);
                          if (!sub) return null;
                          return (
                            <button key={id} onClick={() => setSelectedSubject(sub)}
                              className={`border rounded-xl p-3 text-left transition-all ${selectedSubject.id === id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'}`}>
                              <div className="text-xl mb-1">{sub.emoji}</div>
                              <div className={`text-xs font-semibold leading-tight ${selectedSubject.id === id ? 'text-blue-700' : 'text-gray-800'}`}>{sub.name}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="border-t border-gray-100 pt-4 mt-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Difficulty</label>
                    <div className="flex gap-2 mb-5">
                      {DIFFICULTIES.map(d => (
                        <button key={d} onClick={() => setDifficulty(d)}
                          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${difficulty === d ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                    <Button onClick={generateLesson} className="bg-blue-500 hover:bg-blue-600 w-full" size="lg">
                      <Headphones className="w-4 h-4 mr-2" /> Start Lesson — {selectedSubject.name}
                    </Button>
                  </div>
                </div>
              )}

              {/* Generating */}
              {phase === 'generating' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <p className="text-gray-700 font-medium">Preparing your lesson…</p>
                  <p className="text-gray-400 text-sm">{selectedSubject.name} · {difficulty}</p>
                </div>
              )}

              {/* Audio Player */}
              {(phase === 'playing' || phase === 'checkpoint') && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-blue-500 font-semibold uppercase tracking-wider">{selectedSubject.name}</p>
                      <h3 className="text-gray-900 font-semibold mt-0.5">{lessonTitle}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{voiceProfile.label} · {playbackSpeed}x</span>
                    </div>
                  </div>

                  {/* Captions */}
                  {captionsOn && currentSeg && currentSeg.type === 'teach' && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4 text-gray-700 text-sm leading-relaxed border border-gray-100 italic">
                      "{currentSeg.text}"
                    </div>
                  )}

                  {/* Progress bar */}
                  <div className="mb-5">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Segment {segments.slice(0, currentSegIdx + 1).filter(s => s.type === 'teach').length} of {segments.filter(s => s.type === 'teach').length}</span>
                      <span>{Math.round(audioProgress)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${audioProgress}%` }} />
                    </div>
                  </div>

                  {/* Controls */}
                  {phase === 'playing' && (
                    <div className="flex items-center gap-4">
                      <button onClick={skipBack} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                        <SkipBack className="w-4 h-4" />
                      </button>
                      <button onClick={togglePlayPause}
                        className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors shadow-sm">
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                      </button>
                      <button onClick={skipForward} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                        <SkipForward className="w-4 h-4" />
                      </button>
                      <Waveform active={isPlaying} />
                    </div>
                  )}
                  {phase === 'checkpoint' && (
                    <div className="flex items-center gap-3 text-sm text-amber-600 bg-amber-50 rounded-lg px-4 py-2">
                      <span className="font-semibold">⏸ Paused at checkpoint</span>
                    </div>
                  )}
                </div>
              )}

              {/* Checkpoint Card */}
              {phase === 'checkpoint' && checkpoint && (
                <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-bold">?</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-700">Checkpoint — Answer to continue</span>
                  </div>

                  <p className="text-gray-900 font-medium text-base mb-5 leading-relaxed">{checkpoint.question}</p>

                  {attempts >= 1 && !evalResult?.correct && checkpoint.hint && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-amber-800 text-sm">
                      💡 {checkpoint.hint}
                    </div>
                  )}

                  {evalResult && (
                    <div className={`rounded-lg p-4 mb-4 ${evalResult.correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {evalResult.correct ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-500" />}
                        <span className={`text-sm font-semibold ${evalResult.correct ? 'text-green-700' : 'text-red-700'}`}>
                          {evalResult.correct ? "Nice. Let's continue." : attempts >= 2 ? 'Moving on…' : 'Try again'}
                        </span>
                      </div>
                      <p className={`text-sm ${evalResult.correct ? 'text-green-700' : 'text-red-700'}`}>{evalResult.feedback}</p>
                      {voiceInput && <p className="text-xs text-gray-400 mt-1">You said: "{voiceInput}"</p>}
                    </div>
                  )}

                  {!evalResult?.correct && attempts >= 2 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-blue-800 text-sm">
                      <strong>Correct answer:</strong> {checkpoint.answerKey}
                    </div>
                  )}

                  {micState === 'idle' && !evalResult?.correct && attempts < 2 && (
                    !textFallback ? (
                      <button onClick={startListening}
                        className="w-full py-5 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 transition-colors flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shadow-md">
                          <Mic className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-blue-600 font-semibold text-sm">Tap to Answer</span>
                        <span className="text-blue-400 text-xs">Speak clearly</span>
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <textarea value={fallbackText} onChange={e => setFallbackText(e.target.value)}
                          placeholder="Type your answer…"
                          className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300" rows={3} />
                        <Button onClick={handleSubmitText} className="bg-blue-500 hover:bg-blue-600 w-full">Submit Answer</Button>
                      </div>
                    )
                  )}

                  {micState === 'listening' && (
                    <div className="flex flex-col items-center gap-3 py-6">
                      <div className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-200 animate-pulse">
                        <Mic className="w-6 h-6 text-white" />
                      </div>
                      <Waveform active={true} />
                      <p className="text-gray-600 text-sm font-medium">Listening…</p>
                      <button onClick={() => recognitionRef.current?.stop()} className="text-xs text-gray-400 underline">Stop</button>
                    </div>
                  )}

                  {micState === 'processing' && (
                    <div className="flex flex-col items-center gap-3 py-6">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                      <p className="text-gray-600 text-sm">Analyzing your answer…</p>
                    </div>
                  )}

                  <div className="flex gap-3 mt-4">
                    {evalResult?.correct && (
                      <Button onClick={handleContinue} className="bg-green-500 hover:bg-green-600 flex-1">Continue Lesson →</Button>
                    )}
                    {evalResult && !evalResult.correct && attempts < 2 && (
                      <Button onClick={handleRetry} variant="outline" className="flex-1"><RotateCcw className="w-4 h-4 mr-1" /> Try Again</Button>
                    )}
                    {!evalResult?.correct && attempts >= 2 && (
                      <Button onClick={handleContinue} className="bg-blue-500 hover:bg-blue-600 flex-1">Continue Anyway →</Button>
                    )}
                  </div>
                </div>
              )}

              {/* Complete */}
              {phase === 'complete' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
                  <div className="text-5xl mb-4">🎉</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Lesson Complete!</h2>
                  <p className="text-gray-500 mb-6">{selectedSubject.name} · {difficulty}</p>
                  <div className="flex gap-6 justify-center mb-8">
                    <div><p className="text-3xl font-bold text-green-500">{accuracyPct}%</p><p className="text-xs text-gray-500">Accuracy</p></div>
                    <div><p className="text-3xl font-bold text-blue-500">{correctCount}/{checkpointsTotal}</p><p className="text-xs text-gray-500">Checkpoints</p></div>
                    <div><p className="text-3xl font-bold text-gray-700">{formatTime(elapsed)}</p><p className="text-xs text-gray-500">Time</p></div>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => setPhase('idle')}>Try Another</Button>
                    <Button className="bg-blue-500 hover:bg-blue-600" onClick={generateLesson}>Repeat</Button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Progress */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sticky top-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Progress</h3>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Lesson</span><span>{progressPct}%</span></div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  {[
                    { label: 'Subject', value: selectedSubject.emoji + ' ' + selectedSubject.name.replace('AP ', '') },
                    { label: 'Voice', value: voiceProfile.label },
                    { label: 'Speed', value: `${playbackSpeed}x` },
                    { label: 'Checkpoints', value: `${checkpointsDone} / ${checkpointsTotal || '—'}` },
                    { label: 'Accuracy', value: checkpointsDone > 0 ? `${accuracyPct}%` : '—' },
                    { label: 'Time', value: phase !== 'idle' ? formatTime(elapsed) : '—' },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{r.label}</span>
                      <span className="text-sm font-semibold text-gray-800 truncate max-w-[120px] text-right">{r.value}</span>
                    </div>
                  ))}
                </div>

                {segments.filter(s => s.type === 'checkpoint').length > 0 && (
                  <div className="pt-3 mt-3 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Checkpoints</p>
                    {segments.filter(s => s.type === 'checkpoint').map((seg, i) => {
                      const gIdx = segments.indexOf(seg);
                      const done = currentSegIdx > gIdx;
                      const active = currentSegIdx === gIdx && phase === 'checkpoint';
                      return (
                        <div key={i} className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs mb-1 ${active ? 'bg-blue-50' : ''}`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${done ? 'bg-green-100 text-green-600' : active ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                            {done ? '✓' : i + 1}
                          </div>
                          <span className={done ? 'text-green-700' : active ? 'text-blue-700 font-semibold' : 'text-gray-400'}>
                            Checkpoint {i + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-700 mb-1">💡 Tip</p>
                <p className="text-xs text-blue-600 leading-relaxed">
                  Change voice style and speed in Voice Settings above. Your preferences are saved across all lessons.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}