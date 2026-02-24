import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AuroraBackground } from '@/components/ui/animated-background';
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

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const startPractice = async () => {
    if (!selectedSection) {
      toast.error('Please select a section');
      return;
    }

    console.log("🚀 ACT Practice generation started");
    setPracticing(true);

    try {
      const user = await base44.auth.me();
      const sectionData = sections.find(s => s.id === selectedSection);
      const sectionName = sectionData?.name || 'ACT';

      const { generateQuestionsWithRetry } = await import('@/components/generation/RobustQuestionGenerator');
      
      const result = await generateQuestionsWithRetry({
        examType: 'ACT',
        domainId: selectedSection,
        difficulty: 3,
        questionCount: questionCount,
        questionType: 'MCQ',
        keywords: [sectionName],
        userEmail: user.email,
        adaptiveDifficulty: true
      });

      console.log("✅ AI Response:", result);

      if (!result || !result.questions || result.questions.length === 0) {
        throw new Error("AI returned no questions");
      }

      setQuestions(result.questions);
      setCurrentIndex(0);
      toast.success(`Generated ${result.questions.length} ACT questions`);

    } catch (error) {
      console.error("❌ AI failed, using HARD FALLBACK:", error);
      
      const fallback = [
        {
          id: 'fallback-1',
          stem: "What is 8 × 7?",
          answer_choices: ["48", "54", "56", "63"],
          correct_answer: 2,
          explanation: "8 × 7 = 56"
        }
      ];
      
      setQuestions(fallback);
      setCurrentIndex(0);
      toast.info("Using fallback questions - AI temporarily unavailable");
    } finally {
      setPracticing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (questions.length > 0) {
    return (
      <AuroraBackground>
        <div className="min-h-screen">
          <div className="bg-neutral-900 border-b border-neutral-800 px-6 py-4">
            <div className="flex items-center justify-between max-w-[1800px] mx-auto">
              <h2 className="text-lg font-medium text-white">ACT Practice</h2>
              <Button
                variant="outline"
                onClick={() => {
                  setQuestions([]);
                  setCurrentIndex(0);
                }}
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
              onComplete={() => {
                setQuestions([]);
                setCurrentIndex(0);
                toast.success('Practice complete!');
              }}
            />
          </div>
        </div>
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground>
    <div className="min-h-screen py-16">
      <div className="max-w-3xl mx-auto px-6">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="mb-8 text-neutral-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-12 text-center">
          <h1 className="text-3xl font-light text-white mb-2">ACT Practice</h1>
          <p className="text-neutral-400">Master ACT sections with targeted practice</p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4 flex gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 space-y-6">
          <div>
            <label className="text-sm text-neutral-400 mb-2 block">Section</label>
            <Select value={selectedSection} onValueChange={setSelectedSection} disabled={loading}>
              <SelectTrigger className="bg-black border-neutral-700 text-white">
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
            <label className="text-sm text-neutral-400 mb-2 block">Number of Questions</label>
            <Select value={String(questionCount)} onValueChange={(v) => setQuestionCount(Number(v))}>
              <SelectTrigger className="bg-black border-neutral-700 text-white">
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
          >
            {practicing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              'Start ACT Practice'
            )}
          </Button>
        </div>
      </div>
    </div>
    </AuroraBackground>
  );
}