import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import ExamShell from '@/components/exam/ExamShell';
import PracticeErrorState from '@/components/error/PracticeErrorState';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function SATPractice() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    // Always clear state to allow new generation
    setQuestions([]);
    setCurrentIndex(0);
    setSessionId(null);
    setLoading(true);
    
    initializePractice();
  }, []);

  const initializePractice = async () => {
    try {
      setLoading(true);
      const user = await base44.auth.me();
      const exams = await base44.entities.Exam.filter({ exam_type: 'SAT' });
      
      if (!exams.length) {
        throw new Error('SAT exam not found');
      }

      // Try to fetch existing questions
      let practiceQuestions = await base44.entities.ProoflyQuestion.filter({
        is_active: true
      }, '-created_date', 10);

      // Filter for SAT questions if metadata available
      practiceQuestions = practiceQuestions.filter(q => 
        !q.generation_metadata?.exam_type || q.generation_metadata?.exam_type === 'SAT'
      );

      // Generate new questions if needed
      if (practiceQuestions.length < 10) {
        const { generateQuestionsWithRetry } = await import('@/components/generation/RobustQuestionGenerator');
        
        const result = await generateQuestionsWithRetry({
          examType: 'SAT',
          difficulty: 3,
          questionCount: 10,
          questionType: 'MCQ',
          keywords: ['Math', 'Reading', 'Writing']
        });

        if (result.success && result.questions.length > 0) {
          practiceQuestions = result.questions;
          toast.success(`Generated ${result.questions.length} new SAT questions`);
        } else {
          throw new Error(result.error || 'Failed to generate questions');
        }
      }

      if (practiceQuestions.length === 0) {
        throw new Error('No practice questions available');
      }

      // Create practice session
      const session = await base44.entities.EnginePracticeSession.create({
        user_email: user.email,
        exam_id: exams[0].id,
        question_count: practiceQuestions.length,
        mode: 'untimed',
        status: 'active',
        started_at: new Date().toISOString()
      });

      if (!session || !session.id) {
        throw new Error('Failed to create practice session');
      }

      console.log('✓ SAT practice session created:', session.id);
      setSessionId(session.id);
      setQuestions(practiceQuestions);
    } catch (error) {
      console.error('Failed to load practice:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (response) => {
    await base44.entities.EnginePracticeResponse.create({
      session_id: sessionId,
      question_id: response.questionId,
      selected_answer: response.selectedAnswer,
      is_correct: response.isCorrect,
      response_time_ms: response.timeSpent * 1000
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigate(createPageUrl('Dashboard'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <PracticeErrorState 
        title="No Questions Available"
        description="Unable to load SAT questions. Please generate some questions first."
      />
    );
  }

  return (
    <div className="min-h-screen bg-black">
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
  );
}