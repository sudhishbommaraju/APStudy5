import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { AP_SUBJECTS } from '@/components/studyhub/AP_SUBJECTS';
import {
  ArrowLeft, Timer, Loader2, CheckCircle, XCircle,
  ChevronRight, ChevronLeft, Flag, BookOpen, Trophy
} from 'lucide-react';

// Full test config per subject
const TEST_CONFIG = {
  default: { mcq: 45, time: 105 }, // minutes
  'ap_calc_ab': { mcq: 45, time: 105 },
  'ap_calc_bc': { mcq: 45, time: 105 },
  'ap_statistics': { mcq: 40, time: 90 },
  'ap_biology': { mcq: 60, time: 90 },
  'ap_chemistry': { mcq: 60, time: 90 },
  'ap_physics_1': { mcq: 50, time: 90 },
  'ap_us_history': { mcq: 55, time: 95 },
  'ap_world_history': { mcq: 55, time: 95 },
};

function getConfig(subjectId) {
  return TEST_CONFIG[subjectId] || TEST_CONFIG.default;
}

// ── Step 1: Subject Selection ──────────────────────────────
function SubjectSelector({ onStart }) {
  const [selected, setSelected] = useState(null);
  const categories = [...new Set(AP_SUBJECTS.map(s => s.category))];

  return (
    <div className="min-h-screen bg-[#f8fafc] py-10 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">AP Full-Length Practice Test</h1>
          <p className="text-gray-500 text-sm">Select a subject to begin a timed, full-length AP exam simulation</p>
        </div>

        {categories.map(cat => (
          <div key={cat} className="mb-8">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{cat}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {AP_SUBJECTS.filter(s => s.category === cat).map(subject => {
                const cfg = getConfig(subject.id);
                const isSelected = selected?.id === subject.id;
                return (
                  <button
                    key={subject.id}
                    onClick={() => setSelected(subject)}
                    className={`rounded-xl p-4 text-left border transition-all ${
                      isSelected
                        ? 'bg-blue-500 border-blue-500 text-white shadow-md'
                        : 'bg-white border-gray-200 hover:border-blue-400 text-gray-800'
                    }`}
                  >
                    <p className="text-sm font-semibold leading-tight mb-1">{subject.subject}</p>
                    <p className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                      {cfg.mcq} MCQ · {cfg.time} min
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {selected && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{selected.subject}</p>
              <p className="text-sm text-gray-500">{getConfig(selected.id).mcq} questions · {getConfig(selected.id).time} minutes</p>
            </div>
            <Button onClick={() => onStart(selected)} className="bg-blue-500 hover:bg-blue-600 text-white px-8">
              Begin Test <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step 2: Generating ────────────────────────────────────
function GeneratingScreen({ subject, progress }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Building Your Exam</h2>
        <p className="text-gray-500 text-sm mb-4">Generating {subject.subject} questions aligned with the 2025-2026 AP framework…</p>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-2">{progress}%</p>
      </div>
    </div>
  );
}

// ── Step 3: Exam Interface ────────────────────────────────
function ExamInterface({ subject, questions, timeMinutes, onSubmit }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [timeLeft, setTimeLeft] = useState(timeMinutes * 60);
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const isLowTime = timeLeft < 300;

  const handleSubmit = () => {
    clearInterval(timerRef.current);
    setSubmitted(true);
    const correct = questions.filter((q, i) => answers[i] === q.correct_answer).length;
    onSubmit({ answers, correct, total: questions.length });
  };

  const q = questions[currentIndex];
  const choices = [
    { letter: 'A', text: q.choice_a },
    { letter: 'B', text: q.choice_b },
    { letter: 'C', text: q.choice_c },
    { letter: 'D', text: q.choice_d },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-blue-500" />
          <div>
            <p className="text-sm font-bold text-gray-900">{subject.subject}</p>
            <p className="text-xs text-gray-400">AP Full-Length Exam</p>
          </div>
        </div>
        <div className={`font-mono font-bold text-lg px-4 py-1.5 rounded-lg ${isLowTime ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-700'}`}>
          {formatTime(timeLeft)}
        </div>
        <Button onClick={handleSubmit} variant="outline" className="border-gray-300 text-gray-700 text-sm">
          Submit Test
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Question panel */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Question {currentIndex + 1} of {questions.length}</span>
              <button
                onClick={() => setFlagged(f => ({ ...f, [currentIndex]: !f[currentIndex] }))}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${flagged[currentIndex] ? 'bg-amber-50 border-amber-400 text-amber-600' : 'border-gray-200 text-gray-400 hover:border-amber-400'}`}
              >
                <Flag className="w-3 h-3" /> {flagged[currentIndex] ? 'Flagged' : 'Flag'}
              </button>
            </div>

            <p className="text-base text-gray-900 leading-relaxed mb-6 font-medium">{q.question_text}</p>

            <div className="space-y-3">
              {choices.map(c => (
                <button
                  key={c.letter}
                  onClick={() => setAnswers(a => ({ ...a, [currentIndex]: c.letter }))}
                  className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                    answers[currentIndex] === c.letter
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    answers[currentIndex] === c.letter ? 'border-white text-white' : 'border-gray-300 text-gray-500'
                  }`}>{c.letter}</span>
                  <span className="text-sm leading-relaxed">{c.text}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mt-8">
              <button
                onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex(i => i + 1)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-blue-500 hover:text-blue-700"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <Button onClick={handleSubmit} className="bg-green-500 hover:bg-green-600 text-white text-sm">
                  Finish Exam
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Question navigator */}
        <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-auto">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Questions</p>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-full aspect-square rounded-md text-xs font-semibold transition-all ${
                  i === currentIndex ? 'bg-blue-500 text-white' :
                  answers[i] ? (flagged[i] ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-green-100 text-green-700') :
                  'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-1.5 text-xs text-gray-500">
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-green-100 inline-block" /> Answered</div>
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-amber-100 inline-block" /> Flagged</div>
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-gray-100 inline-block" /> Unanswered</div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">{Object.keys(answers).length} / {questions.length} answered</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 4: Results ────────────────────────────────────────
function ResultsScreen({ subject, result, questions, navigate }) {
  const pct = Math.round((result.correct / result.total) * 100);
  const apScore = pct >= 90 ? 5 : pct >= 75 ? 4 : pct >= 60 ? 3 : pct >= 45 ? 2 : 1;
  const scoreColor = apScore >= 4 ? '#16a34a' : apScore === 3 ? '#2563eb' : '#dc2626';

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center max-w-lg w-full">
        <Trophy className="w-12 h-12 mx-auto mb-4" style={{ color: scoreColor }} />
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Exam Complete</h1>
        <p className="text-gray-500 mb-6">{subject.subject}</p>

        <div className="flex items-center justify-center gap-8 mb-6">
          <div>
            <p className="text-4xl font-bold text-gray-900">{pct}%</p>
            <p className="text-xs text-gray-400 mt-1">Raw Score</p>
          </div>
          <div className="w-px h-12 bg-gray-200" />
          <div>
            <p className="text-4xl font-bold" style={{ color: scoreColor }}>{apScore}</p>
            <p className="text-xs text-gray-400 mt-1">AP Score Est.</p>
          </div>
          <div className="w-px h-12 bg-gray-200" />
          <div>
            <p className="text-4xl font-bold text-gray-900">{result.correct}/{result.total}</p>
            <p className="text-xs text-gray-400 mt-1">Correct</p>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">AP Score Scale</p>
          {[5, 4, 3, 2, 1].map(s => {
            const ranges = { 5: '90-100%', 4: '75-89%', 3: '60-74%', 2: '45-59%', 1: '0-44%' };
            return (
              <div key={s} className={`flex items-center justify-between py-1.5 px-3 rounded-lg mb-1 ${apScore === s ? 'bg-blue-50 border border-blue-200' : ''}`}>
                <span className={`text-sm font-semibold ${apScore === s ? 'text-blue-700' : 'text-gray-600'}`}>Score {s}</span>
                <span className={`text-xs ${apScore === s ? 'text-blue-500' : 'text-gray-400'}`}>{ranges[s]}</span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/APFullTest')} className="flex-1">New Test</Button>
          <Button onClick={() => navigate('/APPractice')} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">Practice Weak Areas</Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function APFullTest() {
  const navigate = useNavigate();
  const [step, setStep] = useState('select'); // select | generating | exam | results
  const [subject, setSubject] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [result, setResult] = useState(null);
  const [genProgress, setGenProgress] = useState(0);

  const handleStart = async (selectedSubject) => {
    setSubject(selectedSubject);
    setStep('generating');
    setGenProgress(10);

    const cfg = getConfig(selectedSubject.id);
    const units = selectedSubject.units || [];
    const unitList = units.map(u => `${u.name}: ${(u.topics || []).join(', ')}`).join('\n');

    try {
      setGenProgress(30);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AP exam question writer. Generate exactly ${cfg.mcq} AP-style multiple choice questions for:
Subject: ${selectedSubject.subject}

Curriculum units and topics:
${unitList}

Requirements:
- Questions must be distributed proportionally across all units
- Match real AP exam difficulty and style (college-level rigor)
- All 4 answer choices (A-D) must be plausible
- Include some data interpretation, graph reading, and application questions
- Test higher-order thinking (analysis, evaluation, synthesis), not just recall
- For science/math: include quantitative problems with numbers

Return exactly ${cfg.mcq} questions.`,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question_text: { type: 'string' },
                  choice_a: { type: 'string' },
                  choice_b: { type: 'string' },
                  choice_c: { type: 'string' },
                  choice_d: { type: 'string' },
                  correct_answer: { type: 'string' },
                  explanation: { type: 'string' },
                  unit: { type: 'string' },
                }
              }
            }
          }
        }
      });
      setGenProgress(90);
      setQuestions(result.questions || []);
      setGenProgress(100);
      setTimeout(() => setStep('exam'), 300);
    } catch (e) {
      setStep('select');
    }
  };

  const handleSubmit = (res) => {
    setResult(res);
    setStep('results');
  };

  if (step === 'select') return <SubjectSelector onStart={handleStart} />;
  if (step === 'generating') return <GeneratingScreen subject={subject} progress={genProgress} />;
  if (step === 'exam') return (
    <ExamInterface
      subject={subject}
      questions={questions}
      timeMinutes={getConfig(subject.id).time}
      onSubmit={handleSubmit}
    />
  );
  if (step === 'results') return (
    <ResultsScreen subject={subject} result={result} questions={questions} navigate={navigate} />
  );
}