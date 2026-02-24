import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import ExamShell from '@/components/exam/ExamShell';
import { Button } from '@/components/ui/button';
import { AuroraBackground } from '@/components/ui/animated-background';
import { ArrowLeft, Loader2, Play } from 'lucide-react';

export default function SATPractice() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionId, setSessionId] = useState(null);

  const generatePractice = async () => {
    if (loading) return; // Prevent duplicate calls
    
    setLoading(true);

    try {
      const user = await base44.auth.me();
      // PHASE 5: CLEAR ALL CACHES BEFORE NEW GENERATION
      const { generateQuestionsOptimized, clearCache } = await import('@/components/generation/FastQuestionGenerator');
      clearCache();
      
      const result = await generateQuestionsOptimized({
        examType: 'SAT',
        subjectId: 'SAT',
        difficulty: 'mixed',
        count: 10
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

      // Optional session tracking
      try {
        const exams = await base44.entities.Exam.filter({ exam_type: 'SAT' });
        if (exams.length > 0) {
          const session = await base44.entities.EnginePracticeSession.create({
            user_email: user.email,
            exam_id: exams[0].id,
            question_count: result.length,
            mode: 'untimed',
            status: 'active',
            started_at: new Date().toISOString()
          });
          setSessionId(session.id);
        }
      } catch (sessionError) {
        console.warn("Session tracking skipped:", sessionError);
      }

    } catch (error) {
      console.error("Generation failed:", error);
      
      setQuestions([
        {
          id: 'fallback-1',
          stem: "If 3x + 5 = 20, what is the value of x?",
          answer_choices: ["5", "8", "10", "15"],
          correct_answer: 0,
          explanation: null
        },
        {
          id: 'fallback-2',
          stem: "Which word best completes the sentence? The scientist's findings were _____ by multiple independent studies.",
          answer_choices: ["contradicted", "corroborated", "fabricated", "dismissed"],
          correct_answer: 1,
          explanation: null
        },
        {
          id: 'fallback-3',
          stem: "A rectangle has a length of 12 and width of 5. What is its area?",
          answer_choices: ["17", "34", "60", "72"],
          correct_answer: 2,
          explanation: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (response) => {
    if (sessionId) {
      try {
        await base44.entities.EnginePracticeResponse.create({
          session_id: sessionId,
          question_id: response.questionId,
          selected_answer: response.selectedAnswer,
          is_correct: response.isCorrect,
          response_time_ms: response.timeSpent * 1000
        });
      } catch (error) {
        console.warn("Response tracking failed (non-critical):", error);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigate(createPageUrl('Dashboard'));
    }
  };

  if (questions.length === 0) {
    return (
      <AuroraBackground>
      <div className="min-h-screen py-16">
        <div className="max-w-3xl mx-auto px-6">
          <button
            onClick={() => navigate(createPageUrl('Dashboard'))}
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-12"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center">
            <h1 className="text-3xl font-light text-white mb-4">SAT Practice</h1>
            <p className="text-neutral-400 mb-8">Generate adaptive SAT questions aligned with College Board taxonomy</p>
            
            <Button
              onClick={generatePractice}
              disabled={loading}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 px-8"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Generate Practice
                </>
              )}
            </Button>

            {/* Debug Panel */}
            <div className="mt-8 p-4 bg-neutral-800 rounded-lg text-left text-sm">
              <div className="text-neutral-400 space-y-1">
                <p>Loading: {loading ? "Yes" : "No"}</p>
                <p>Questions: {questions.length}</p>
                <p>Status: {loading ? "Generating..." : "Ready"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground>
    <div className="min-h-screen">
      <div className="bg-neutral-900 border-b border-neutral-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <h2 className="text-lg font-medium text-white">SAT Practice</h2>
          <Button
            variant="outline"
            onClick={() => {
              setQuestions([]);
              setCurrentIndex(0);
              setSessionId(null);
            }}
          >
            Exit Practice
          </Button>
        </div>
      </div>
      <ExamShell
        question={questions[currentIndex]}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        examType="SAT"
        subject="Math"
        mode="practice"
        onSubmit={handleSubmit}
        onNext={handleNext}
      />
    </div>
    </AuroraBackground>
  );
}