import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { SATACTGenerator } from '@/components/generation/SATACTGenerator';
import APPracticeQuestion from '@/components/practice/APPracticeQuestion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, BookOpen, BarChart2, Clock, Target, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';

export default function SATPractice() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [section, setSection] = useState('mixed');
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState('hard');
  const [sessionHistory, setSessionHistory] = useState([]);
  const [timeSpent, setTimeSpent] = useState(0);
  const timerRef = useRef(null);

  const totalAnswered = sessionHistory.length;
  const totalCorrect = sessionHistory.filter(Boolean).length;
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : null;
  const lastScore = totalAnswered > 0 ? `${totalCorrect}/${totalAnswered}` : '—';

  const formatTime = (ms) => {
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  const generatePractice = async () => {
    if (loading) return;
    setLoading(true);
    const nonce = Date.now();
    try {
      let allQuestions = [];
      if (section === 'mixed') {
        const half = Math.ceil(questionCount / 2);
        const [rwBatch, mathBatch] = await Promise.all([
          SATACTGenerator.generateSATQuestionBatch({ section: 'reading_writing', count: half, nonce: nonce + 1 }),
          SATACTGenerator.generateSATQuestionBatch({ section: 'math', count: questionCount - half, nonce: nonce + 2 }),
        ]);
        allQuestions = [...rwBatch, ...mathBatch].sort(() => Math.random() - 0.5);
      } else {
        allQuestions = await SATACTGenerator.generateSATQuestionBatch({ section, count: questionCount, nonce });
      }
      setQuestions(allQuestions);
      setCurrentIndex(0);
      setScore(0);
      const start = Date.now();
      timerRef.current = setInterval(() => setTimeSpent(Date.now() - start), 1000);
    } catch (error) {
      console.error('SAT generation failed:', error);
      toast.error('Failed to generate questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = (wasCorrect) => {
    if (wasCorrect) setScore(s => s + 1);
    setSessionHistory(h => [...h, wasCorrect]);
    setCurrentIndex(i => i + 1);
  };

  const handleComplete = (wasCorrect) => {
    clearInterval(timerRef.current);
    const finalScore = score + (wasCorrect ? 1 : 0);
    const pct = Math.round((finalScore / questions.length) * 100);
    setSessionHistory(h => [...h, wasCorrect]);
    toast.success(`Session complete! ${finalScore}/${questions.length} correct (${pct}%)`);
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
  };

  const COUNTS = [5, 10, 20];
  const SECTIONS = [['mixed', 'Mixed'], ['reading_writing', 'Reading & Writing'], ['math', 'Math']];
  const DIFFICULTIES = [['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']];

  if (questions.length > 0) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between max-w-[1200px] mx-auto">
            <h2 className="text-lg font-semibold text-gray-900">
              SAT Practice — {section === 'reading_writing' ? 'Reading & Writing' : section === 'math' ? 'Math' : 'Mixed'}
            </h2>
            <Button
              variant="outline"
              onClick={() => { clearInterval(timerRef.current); setQuestions([]); setCurrentIndex(0); setScore(0); }}
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Exit Practice
            </Button>
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <APPracticeQuestion
            question={questions[currentIndex]}
            questionIndex={currentIndex}
            totalQuestions={questions.length}
            onNext={handleNext}
            onComplete={handleComplete}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => navigate(createPageUrl('Dashboard'))}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <span className="text-sm text-gray-400">SAT Practice</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">SAT Practice</h1>
          <p className="text-gray-500 text-sm mt-1">Hard, authentic SAT-level questions targeting 1400–1600 scorers</p>
        </div>

        {/* Two-column workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

          {/* LEFT: Controls */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Generate SAT Practice</h2>
              <p className="text-sm text-gray-400 mb-5">Select your preferences and generate a fresh set of SAT questions instantly.</p>

              {/* Section */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Section</label>
                <div className="flex gap-2">
                  {SECTIONS.map(([val, label]) => (
                    <button key={val} onClick={() => setSection(val)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                        section === val ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Difficulty</label>
                <div className="flex gap-2">
                  {DIFFICULTIES.map(([val, label]) => (
                    <button key={val} onClick={() => setDifficulty(val)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                        difficulty === val
                          ? val === 'easy' ? 'bg-green-500 text-white border-green-500'
                          : val === 'medium' ? 'bg-yellow-500 text-white border-yellow-500'
                          : 'bg-red-500 text-white border-red-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Questions</label>
                <div className="flex gap-2">
                  {COUNTS.map(n => (
                    <button key={n} onClick={() => setQuestionCount(n)}
                      className={`w-16 h-10 rounded-lg text-sm font-semibold border transition-all ${
                        questionCount === n ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={generatePractice}
                disabled={loading}
                size="lg"
                className="bg-blue-500 hover:bg-blue-600 text-white w-full rounded-lg shadow-sm"
              >
                {loading
                  ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating questions…</>
                  : <><Play className="w-5 h-5 mr-2" />Generate Practice</>}
              </Button>
            </div>
          </div>

          {/* RIGHT: Stats */}
          <div className="lg:sticky lg:top-6 space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Session Stats</h3>
              <div className="space-y-3">
                <StatRow icon={<CheckCircle2 className="w-4 h-4 text-blue-400" />} label="Status" value={loading ? 'Generating…' : 'Ready'} />
                <StatRow icon={<BookOpen className="w-4 h-4 text-purple-400" />} label="Questions" value={`${questionCount} selected`} />
                <StatRow icon={<Target className="w-4 h-4 text-green-400" />} label="Accuracy" value={accuracy !== null ? `${accuracy}%` : '—'} />
                <StatRow icon={<BarChart2 className="w-4 h-4 text-orange-400" />} label="Last Score" value={lastScore} />
                <StatRow icon={<Clock className="w-4 h-4 text-gray-400" />} label="Time Spent" value={timeSpent > 0 ? formatTime(timeSpent) : '—'} />
              </div>

              {totalAnswered > 0 && (
                <div className="mt-5">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span className="font-medium">Session Progress</span>
                    <span>{totalCorrect}/{totalAnswered}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${accuracy}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700 mb-1">💡 SAT Tip</p>
              <p className="text-xs text-blue-600 leading-relaxed">
                For Reading & Writing, always eliminate answers that go beyond what the passage says. Stick to the text.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-gray-500 text-sm">{icon}{label}</div>
      <span className="text-sm font-semibold text-gray-800">{value}</span>
    </div>
  );
}