import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, BookOpen, Lock } from 'lucide-react';
import { createPageUrl } from '@/utils';
import QuestionCard from '@/components/ui/QuestionCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateLatexDocument, examToLatex, downloadLatexFile, createLicenseFooter } from '@/components/utils/LatexExporter';

/**
 * DEMO MODE - Zero-friction access
 * No login required, full feature preview
 * Data never creates accounts
 */

export default function Demo() {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isComplete, setIsComplete] = useState(false);
  const [sessionStartTime] = useState(Date.now());

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list('subject_id'),
  });

  const generateDemoQuestions = async () => {
    if (!selectedSubject) return;

    setIsGenerating(true);

    try {
      const subject = subjects.find(s => s.subject_id === selectedSubject);
      const units = await base44.entities.Unit.filter({ subject_id: selectedSubject });
      
      // Generate 5 demo questions
      const questionPromises = [];
      for (let i = 0; i < 5; i++) {
        const unit = units[i % units.length];
        
        const prompt = `Generate a high-quality ${subject.name} multiple choice question.
Unit: ${unit.unit_name}
Difficulty: medium

Use proper LaTeX for ALL math: $x^2$, $$\\frac{a}{b}$$

CRITICAL RULES:
✅ All math in LaTeX format
✅ Each choice written ONCE (no duplication)
✅ All 4 choices must be distinct
✅ No unicode subscripts/superscripts
✅ Use \\text{} for units: $100\\text{°C}$

Return JSON with: question_text, choice_a, choice_b, choice_c, choice_d, correct_answer, explanation, hint`;

        questionPromises.push(
          base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
              type: 'object',
              properties: {
                question_text: { type: 'string' },
                choice_a: { type: 'string' },
                choice_b: { type: 'string' },
                choice_c: { type: 'string' },
                choice_d: { type: 'string' },
                correct_answer: { type: 'string' },
                explanation: { type: 'string' },
                hint: { type: 'string' },
              },
            },
          })
        );
      }

      const responses = await Promise.all(questionPromises);
      setQuestions(responses);
    } catch (e) {
      console.error('Failed to generate demo:', e);
      alert('Failed to generate demo questions. Please try again.');
    }

    setIsGenerating(false);
  };

  const handleAnswer = (answer) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: answer }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const exportDemo = () => {
    const examData = {
      subject_name: subjects.find(s => s.subject_id === selectedSubject)?.name || 'Demo',
      time_limit_minutes: 10,
      total_questions: questions.length,
    };

    const latexBody = examToLatex(examData, questions, answers, true);
    const fullLatex = generateLatexDocument(latexBody + createLicenseFooter(), 'Proofly Demo Exam');
    downloadLatexFile(fullLatex, 'proofly_demo.tex');
  };

  // Setup
  if (questions.length === 0) {
    return (
      <>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-100 mb-3">Try Proofly - No Login Required</h1>
            <p className="text-lg text-slate-300">
              Experience our LaTeX-native study platform with a full demo
            </p>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">What's Included in Demo</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <p>✓ 5 practice questions with instant feedback</p>
              <p>✓ Full LaTeX rendering for mathematical notation</p>
              <p>✓ Export to .tex format (compile with pdflatex)</p>
              <p>✓ No account creation, no data stored</p>
            </div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-200 mb-2 block">Choose a Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="bg-slate-900/50 border-slate-700/50 text-slate-200">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {subjects.filter(s => ['Math', 'Science'].includes(s.category)).map((subject) => (
                    <SelectItem key={subject.subject_id} value={subject.subject_id} className="text-slate-200">
                      {subject.icon} {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={generateDemoQuestions}
              disabled={isGenerating || !selectedSubject}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Demo...
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Start Demo
                </>
              )}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400 mb-3">
              Want to save your progress and access all features?
            </p>
            <Button
              onClick={() => base44.auth.redirectToLogin(createPageUrl('Dashboard'))}
              variant="outline"
            >
              <Lock className="w-4 h-4 mr-2" />
              Sign Up / Login
            </Button>
          </div>
        </div>
      </>
    );
  }

  // Complete
  if (isComplete) {
    const correctCount = questions.filter((q, i) => answers[i] === q.correct_answer).length;
    const accuracy = (correctCount / questions.length) * 100;

    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8 text-center mb-6"
        >
          <h2 className="text-3xl font-bold text-slate-100 mb-2">Demo Complete!</h2>
          <p className="text-5xl font-bold text-violet-400 my-4">{accuracy.toFixed(0)}%</p>
          <p className="text-slate-300">{correctCount} out of {questions.length} correct</p>
        </motion.div>

        <div className="space-y-4">
          <Button onClick={exportDemo} variant="outline" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Export Demo (.tex)
          </Button>

          <Button
            onClick={() => base44.auth.redirectToLogin(createPageUrl('Dashboard'))}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
          >
            Sign Up to Save Progress & Access Full Platform
          </Button>

          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full"
          >
            Try Another Demo
          </Button>
        </div>
      </div>
    );
  }

  // In progress
  const currentQuestion = questions[currentIndex];
  const answered = answers[currentIndex] !== undefined;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-slate-300">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <span className="text-xs px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full">
          DEMO MODE
        </span>
      </div>

      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <QuestionCard
          question={currentQuestion}
          onAnswer={handleAnswer}
          selectedAnswer={answers[currentIndex]}
          showFeedback={answered}
          mode="practice"
        />
      </motion.div>

      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end mt-4"
          >
            <Button onClick={handleNext}>
              {currentIndex < questions.length - 1 ? 'Next Question' : 'Complete Demo'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}