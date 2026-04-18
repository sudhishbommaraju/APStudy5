import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Target, Zap, CheckCircle, XCircle, RotateCcw,
  TrendingUp, AlertTriangle, Loader2, ChevronRight, Award
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardNavbar from '@/components/layout/DashboardNavbar';

// ── Cluster mistakes by skill/unit ──────────────────────────────────────────
function clusterMistakes(attempts) {
  const clusters = {};
  attempts
    .filter(a => !a.is_correct)
    .forEach(a => {
      const key = a.skill_name || a.unit_name || 'Unknown';
      if (!clusters[key]) {
        clusters[key] = {
          skill: key,
          unit: a.unit_name || '',
          subject: a.subject_id || '',
          mistakes: 0,
          total: 0,
        };
      }
      clusters[key].mistakes++;
    });

  // Also count total attempts per skill
  attempts.forEach(a => {
    const key = a.skill_name || a.unit_name || 'Unknown';
    if (clusters[key]) clusters[key].total++;
  });

  return Object.values(clusters)
    .filter(c => c.mistakes >= 1)
    .sort((a, b) => b.mistakes - a.mistakes)
    .slice(0, 10);
}

// ── Mini-quiz generator ──────────────────────────────────────────────────────
async function generateMiniQuiz(cluster) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an expert AP/SAT/ACT test prep question writer.
Generate 5 multiple-choice questions specifically targeting the weak area: "${cluster.skill}" (Unit: "${cluster.unit}", Subject: "${cluster.subject}").
Questions should directly address common misconceptions and test deep understanding.
Each question must have exactly 4 answer choices (A-D) and one correct answer.
Return ONLY valid JSON.`,
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
              explanation: { type: 'string' }
            }
          }
        }
      }
    }
  });
  return (result?.questions || []).map(q => ({
    ...q,
    choices: [q.choice_a, q.choice_b, q.choice_c, q.choice_d],
  }));
}

// ── View: Cluster List ───────────────────────────────────────────────────────
function ClusterList({ clusters, onSelect }) {
  return (
    <div className="space-y-3">
      {clusters.map((c, i) => {
        const errorRate = c.total > 0 ? Math.round((c.mistakes / c.total) * 100) : 100;
        const severity = errorRate >= 70 ? 'red' : errorRate >= 40 ? 'orange' : 'yellow';
        const colorMap = { red: 'bg-red-50 border-red-200', orange: 'bg-orange-50 border-orange-200', yellow: 'bg-yellow-50 border-yellow-200' };
        const barMap = { red: 'bg-red-500', orange: 'bg-orange-400', yellow: 'bg-yellow-400' };
        const textMap = { red: 'text-red-700', orange: 'text-orange-700', yellow: 'text-yellow-700' };

        return (
          <button
            key={i}
            onClick={() => onSelect(c)}
            className={`w-full text-left border rounded-xl p-4 transition-all hover:shadow-md ${colorMap[severity]}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className={`font-semibold text-sm ${textMap[severity]}`}>{c.skill}</p>
                {c.unit && c.unit !== c.skill && (
                  <p className="text-xs text-gray-500 mt-0.5">{c.unit}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${textMap[severity]}`}>{c.mistakes} mistake{c.mistakes !== 1 ? 's' : ''}</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div className="w-full bg-white/60 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full ${barMap[severity]}`} style={{ width: `${Math.min(100, errorRate)}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">{errorRate}% error rate</p>
          </button>
        );
      })}
    </div>
  );
}

// ── View: Mini Quiz ──────────────────────────────────────────────────────────
function MiniQuiz({ cluster, questions, onComplete, onBack }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[index];
  const correctLetter = (q?.correct_answer || '').toUpperCase().trim().charAt(0);
  const correctIdx = ['A', 'B', 'C', 'D'].indexOf(correctLetter);

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    if (selected === correctIdx) setCorrect(c => c + 1);
  };

  const handleNext = () => {
    if (index < questions.length - 1) {
      setIndex(i => i + 1);
      setSelected(null);
      setSubmitted(false);
    } else {
      setDone(true);
    }
  };

  if (done) {
    const pct = Math.round((correct / questions.length) * 100);
    const mastered = pct >= 80;
    return (
      <div className="text-center py-10">
        <div className="text-6xl mb-4">{mastered ? '🎉' : '📚'}</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          {mastered ? 'Area Improving!' : 'Keep Drilling'}
        </h2>
        <p className="text-gray-500 text-sm mb-2">{cluster.skill}</p>
        <div className={`text-5xl font-bold mb-2 ${mastered ? 'text-green-500' : 'text-orange-500'}`}>{pct}%</div>
        <p className="text-gray-400 mb-8">{correct} / {questions.length} correct</p>
        {mastered ? (
          <div className="flex items-center gap-2 justify-center text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm font-semibold mb-6">
            <Award className="w-5 h-5" /> Mastery demonstrated for this skill
          </div>
        ) : (
          <div className="flex items-center gap-2 justify-center text-orange-600 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm font-semibold mb-6">
            <AlertTriangle className="w-5 h-5" /> More practice recommended
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Back to Weak Areas</Button>
          <Button onClick={onComplete} className="bg-blue-600 hover:bg-blue-700">
            <RotateCcw className="w-4 h-4 mr-2" /> Drill Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-sm text-gray-400">{index + 1} / {questions.length}</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-3">Targeting: {cluster.skill}</p>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 leading-relaxed">{q.question_text}</h3>

        <div className="space-y-3">
          {q.choices.map((choice, idx) => {
            const letter = ['A', 'B', 'C', 'D'][idx];
            const isSelected = selected === idx;
            const isCorrectChoice = idx === correctIdx;
            const showGreen = submitted && isCorrectChoice;
            const showRed = submitted && isSelected && !isCorrectChoice;

            return (
              <button
                key={idx}
                onClick={() => !submitted && setSelected(idx)}
                disabled={submitted}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm ${
                  showGreen ? 'border-green-500 bg-green-50 text-green-800' :
                  showRed ? 'border-red-500 bg-red-50 text-red-800' :
                  isSelected ? 'border-blue-500 bg-blue-50 text-blue-900' :
                  'border-gray-200 hover:border-gray-300 text-gray-800'
                } ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span className="font-semibold mr-2">{letter}.</span> {choice}
                {showGreen && <CheckCircle className="inline w-4 h-4 ml-2 text-green-600" />}
                {showRed && <XCircle className="inline w-4 h-4 ml-2 text-red-500" />}
              </button>
            );
          })}
        </div>

        {submitted && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Explanation</p>
            <p className="text-sm text-gray-700 leading-relaxed">{q.explanation}</p>
          </div>
        )}
      </div>

      {!submitted ? (
        <Button onClick={handleSubmit} disabled={selected === null} className="w-full bg-blue-600 hover:bg-blue-700">
          Submit Answer
        </Button>
      ) : (
        <Button onClick={handleNext} className="w-full bg-blue-600 hover:bg-blue-700">
          {index < questions.length - 1 ? 'Next Question' : 'See Results'}
        </Button>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ImprovementEngine() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clusters, setClusters] = useState([]);
  const [selected, setSelected] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizKey, setQuizKey] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const attempts = await base44.entities.Attempt.filter(
        { created_by: user.email }, '-created_date', 500
      );
      const found = clusterMistakes(attempts);
      setClusters(found);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleSelectCluster(cluster) {
    setSelected(cluster);
    setGenerating(true);
    setQuizQuestions([]);
    try {
      const qs = await generateMiniQuiz(cluster);
      setQuizQuestions(qs);
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
  }

  return (
    <ProtectedRoute>
      <DashboardNavbar />
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="max-w-3xl mx-auto px-6 py-10">

          {/* Header */}
          {!selected && (
            <>
              <button onClick={() => navigate('/Dashboard')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-8">
                <ArrowLeft className="w-4 h-4" /> Dashboard
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Improvement Engine</h1>
                  <p className="text-sm text-gray-500">Clusters your weak areas and drills them to mastery</p>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
                </div>
              ) : clusters.length === 0 ? (
                <div className="text-center py-20">
                  <TrendingUp className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No mistakes recorded yet.</p>
                  <p className="text-gray-400 text-sm mt-1">Complete some practice sessions first, then come back here.</p>
                  <Button className="mt-6" onClick={() => navigate('/APPractice')}>Start Practicing</Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mt-8 mb-4">
                    <Zap className="w-4 h-4 text-orange-500" />
                    <h2 className="text-sm font-semibold text-gray-700">Your {clusters.length} Weak Areas — click to drill</h2>
                  </div>
                  <ClusterList clusters={clusters} onSelect={handleSelectCluster} />
                </>
              )}
            </>
          )}

          {/* Loading quiz */}
          {selected && generating && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Generating Targeted Drill</h2>
              <p className="text-sm text-gray-400">Building 5 questions for: <span className="font-semibold text-blue-600">{selected.skill}</span></p>
            </div>
          )}

          {/* Quiz */}
          {selected && !generating && quizQuestions.length > 0 && (
            <MiniQuiz
              key={quizKey}
              cluster={selected}
              questions={quizQuestions}
              onBack={() => { setSelected(null); setQuizQuestions([]); }}
              onComplete={() => { setQuizKey(k => k + 1); handleSelectCluster(selected); }}
            />
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
}