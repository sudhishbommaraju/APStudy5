import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { SATACTGenerator } from '@/components/generation/SATACTGenerator';
import APPracticeQuestion from '@/components/practice/APPracticeQuestion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Play, BookOpen, Calculator } from 'lucide-react';

export default function SATPractice() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [section, setSection] = useState('mixed'); // 'reading_writing' | 'math' | 'mixed'
  const [questionCount, setQuestionCount] = useState(10);

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
    } catch (error) {
      console.error('SAT generation failed:', error);
      toast.error('Failed to generate questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = (wasCorrect) => {
    if (wasCorrect) setScore(s => s + 1);
    setCurrentIndex(i => i + 1);
  };

  const handleComplete = (wasCorrect) => {
    const finalScore = score + (wasCorrect ? 1 : 0);
    const pct = Math.round((finalScore / questions.length) * 100);
    toast.success(`Session complete! ${finalScore}/${questions.length} correct (${pct}%)`);
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
  };

  const COUNTS = [5, 10, 15, 20];

  if (questions.length > 0) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900">SAT Practice — {section === 'reading_writing' ? 'Reading & Writing' : section === 'math' ? 'Math' : 'Mixed'}</h2>
            <Button variant="outline" onClick={() => { setQuestions([]); setCurrentIndex(0); setScore(0); }} className="border-gray-200 text-gray-700 hover:bg-gray-50">
              Exit Practice
            </Button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-6 py-8">
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
    <div className="min-h-screen bg-[#f8fafc] py-16">
      <div className="max-w-2xl mx-auto px-6">
        <button onClick={() => navigate(createPageUrl('Dashboard'))} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-10 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">SAT Practice</h1>
          <p className="text-gray-500 text-sm mb-6">Hard, authentic SAT-level questions targeting 1400-1600 scorers</p>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Section</label>
            <div className="flex gap-2">
              {[['mixed','Mixed'], ['reading_writing','Reading & Writing'], ['math','Math']].map(([val, label]) => (
                <button key={val} onClick={() => setSection(val)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                    section === val ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Questions</label>
            <div className="flex gap-2">
              {COUNTS.map(n => (
                <button key={n} onClick={() => setQuestionCount(n)}
                  className={`w-14 h-10 rounded-lg text-sm font-semibold border transition-all ${
                    questionCount === n ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={generatePractice} disabled={loading} size="lg" className="bg-blue-500 hover:bg-blue-600 text-white w-full shadow-sm">
            {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating hard SAT questions…</> : <><Play className="w-5 h-5 mr-2" />Start {questionCount} Questions</>}
          </Button>
        </div>
      </div>
    </div>
  );
}