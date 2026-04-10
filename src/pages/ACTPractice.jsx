import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import APPracticeQuestion from '@/components/practice/APPracticeQuestion';

export default function ACTPractice() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [error, setError] = useState(null);
  const [examId, setExamId] = useState(null);
  const [practicing, setPracticing] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Always clear state to allow new generation
    setError(null);
    setSelectedSection('');
    setPracticing(false);
    
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      setLoading(true);
      setError(null);
      const exams = await base44.entities.Exam.filter({ exam_type: 'ACT' });
      if (exams.length > 0) {
        setExamId(exams[0].id);
        const domainList = await base44.entities.Domain.filter({ exam_id: exams[0].id });
        setSections(domainList);
      }
    } catch (err) {
      console.error('Failed to load sections:', err);
      setError('Failed to load practice sections');
      toast.error('Failed to load sections');
    } finally {
      setLoading(false);
    }
  };

  const startPractice = async () => {
    if (!selectedSection) {
      toast.error('Please select a section');
      return;
    }
    
    if (practicing) return; // Prevent duplicate calls

    setPracticing(true);

    try {
      // PHASE 5: CLEAR ALL CACHES BEFORE NEW GENERATION
      const { generateQuestionsOptimized, clearCache } = await import('@/components/generation/FastQuestionGenerator');
      clearCache();
      
      const result = await generateQuestionsOptimized({
        examType: 'ACT',
        subjectId: selectedSection,
        difficulty: 'mixed',
        count: questionCount
      });

      setQuestions(result.map(q => ({
        id: q.id,
        stimulus: q.stimulus || '',
        question_text: q.question_text || '',
        stem: q.question_text || '',
        answer_choices: [q.choice_a, q.choice_b, q.choice_c, q.choice_d],
        correct_answer: ['A', 'B', 'C', 'D'].indexOf(q.correct_answer),
        explanation: q.explanation
      })));
      setCurrentIndex(0);

    } catch (error) {
      console.error("Generation failed:", error);
      
      setQuestions([{
        id: 'fallback-1',
        stem: "What is 8 × 7?",
        answer_choices: ["48", "54", "56", "63"],
        correct_answer: 2,
        explanation: null
      }]);
      setCurrentIndex(0);
    } finally {
      setPracticing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (questions.length > 0) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between max-w-[1800px] mx-auto">
            <h2 className="text-lg font-semibold text-gray-900">ACT Practice</h2>
            <Button
              variant="outline"
              onClick={() => { setQuestions([]); setCurrentIndex(0); }}
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Exit Practice
            </Button>
          </div>
        </div>
        <div className="max-w-[1800px] mx-auto px-6 py-8">
          <APPracticeQuestion
            question={questions[currentIndex]}
            questionIndex={currentIndex}
            totalQuestions={questions.length}
            onNext={() => setCurrentIndex(currentIndex + 1)}
            onComplete={() => { setQuestions([]); setCurrentIndex(0); toast.success('Practice complete!'); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-16">
      <div className="max-w-3xl mx-auto px-6">
        <button
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="mb-10 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">ACT Practice</h1>
          <p className="text-gray-500">Master ACT sections with targeted practice</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Section</label>
            <Select value={selectedSection} onValueChange={setSelectedSection} disabled={loading}>
              <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Number of Questions</label>
            <Select value={String(questionCount)} onValueChange={(v) => setQuestionCount(Number(v))}>
              <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 Questions</SelectItem>
                <SelectItem value="10">10 Questions</SelectItem>
                <SelectItem value="20">20 Questions</SelectItem>
                <SelectItem value="30">30 Questions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={startPractice}
            disabled={!selectedSection || practicing}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white shadow-sm py-6 text-base"
          >
            {practicing ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Starting...</>
            ) : (
              'Start ACT Practice'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}