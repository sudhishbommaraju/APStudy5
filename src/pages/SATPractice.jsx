import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
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
    initializePractice();
  }, []);

  const initializePractice = async () => {
    try {
      // Create practice session
      const user = await base44.auth.me();
      const session = await base44.entities.EnginePracticeSession.create({
        user_email: user.email,
        exam_id: 'SAT',
        question_count: 10,
        mode: 'untimed'
      });
      setSessionId(session.id);

      // Fetch sample questions
      const allQuestions = await base44.entities.ProoflyQuestion.list();
      const satQuestions = allQuestions.slice(0, 10);
      setQuestions(satQuestions);
    } catch (error) {
      console.error('Failed to load practice:', error);
    }
    setLoading(false);
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
  );
}