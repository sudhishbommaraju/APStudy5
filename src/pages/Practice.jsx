import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, Target, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import QuestionCard from '@/components/ui/QuestionCard';
import UpgradeModal from '@/components/monetization/UpgradeModal';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { checkAndResetCredits, checkCredits, useCredit } from '@/components/monetization/CreditHelper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function Practice() {
  const location = useLocation();
  const queryClient = useQueryClient();

  /* -------------------- STATE -------------------- */
  const [user, setUser] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [questionCount, setQuestionCount] = useState(10);

  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isComplete, setIsComplete] = useState(false);

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [error, setError] = useState(null);

  /* -------------------- USER -------------------- */
  useEffect(() => {
    (async () => {
      try {
        const currentUser = await base44.auth.me();
        const { user: refreshed } = await checkAndResetCredits(currentUser);
        setUser(refreshed);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  /* -------------------- DATA -------------------- */
  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list('subject_id'),
  });

  const { data: units = [], isLoading: unitsLoading } = useQuery({
    queryKey: ['units', selectedSubject],
    queryFn: () => base44.entities.Unit.filter({ subject_id: selectedSubject }),
    enabled: !!selectedSubject,
  });

  /* -------------------- GENERATE -------------------- */
  const generateQuestions = async () => {
    if (!user) return alert('User still loading.');
    if (subjectsLoading || subjects.length === 0) {
      alert('Subjects are still loading. Please wait.');
      return;
    }

    const { allowed } = await checkCredits(user, 'daily_practice_count');
    if (!allowed) {
      setUpgradeModalOpen(true);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      setUser(await useCredit(user, 'daily_practice_count'));

      /* -------- SUBJECT SELECTION -------- */
      const targetSubjects =
        !selectedSubject || selectedSubject === 'all'
          ? subjects.slice(0, 3)
          : subjects.filter(s => s.subject_id === selectedSubject);

      /* -------- UNIT SELECTION -------- */
      let targetUnits = [];

      for (const subject of targetSubjects) {
        const subjectUnits = await base44.entities.Unit.filter({
          subject_id: subject.subject_id,
        });

        if (!selectedUnit || selectedUnit === 'all') {
          targetUnits.push(
            ...subjectUnits.map(u => ({ ...u, subject }))
          );
        } else {
          const unit = subjectUnits.find(u => u.id === selectedUnit);
          if (unit) targetUnits.push({ ...unit, subject });
        }
      }

      /* -------- HARD FALLBACK -------- */
      if (targetUnits.length === 0) {
        targetUnits = [{
          id: 'fallback',
          unit_name: 'General Practice',
          subject: targetSubjects[0],
        }];
      }

      /* -------- LLM GENERATION -------- */
      const prompts = Array.from({ length: questionCount }).map(() => {
        const unit = targetUnits[Math.floor(Math.random() * targetUnits.length)];
        return base44.integrations.Core.InvokeLLM({
          prompt: `
Generate an AP / SAT / ACT style multiple choice question for:
Subject: ${unit.subject.name}
Unit: ${unit.unit_name}

STRICT RULES:
- ALL math must be LaTeX
- Use x^{2}, never x^2
- No ext, no malformed units
- Units must use \\text{}
- Return valid JSON ONLY

Fields:
question_text
choice_a
choice_b
choice_c
choice_d
correct_answer
explanation
          `,
          response_json_schema: {
            type: 'object',
            required: [
              'question_text',
              'choice_a',
              'choice_b',
              'choice_c',
              'choice_d',
              'correct_answer',
              'explanation',
            ],
            properties: {
              question_text: { type: 'string' },
              choice_a: { type: 'string' },
              choice_b: { type: 'string' },
              choice_c: { type: 'string' },
              choice_d: { type: 'string' },
              correct_answer: { type: 'string' },
              explanation: { type: 'string' },
            },
          },
        }).then(r => ({ ...r, unit }));
      });

      const responses = await Promise.all(prompts);

      const created = await Promise.all(
        responses.map(r =>
          base44.entities.Question.create({
            subject_id: r.unit.subject.subject_id,
            unit_id: r.unit.id,
            unit_name: r.unit.unit_name,
            skill_name: 'General',
            difficulty: 'medium',
            question_text: r.question_text,
            choice_a: r.choice_a,
            choice_b: r.choice_b,
            choice_c: r.choice_c,
            choice_d: r.choice_d,
            correct_answer: r.correct_answer,
            explanation: r.explanation,
            is_ai_generated: true,
          })
        )
      );

      setQuestions(created);
    } catch (e) {
      console.error(e);
      setError(e.message);
      alert(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  /* -------------------- PRACTICE FLOW -------------------- */
  const handleAnswer = answer => {
    setAnswers(a => ({ ...a, [currentIndex]: answer }));
    if (answer === questions[currentIndex].correct_answer) {
      confetti({ particleCount: 40, spread: 50 });
    }
  };

  const handleNext = async () => {
    const q = questions[currentIndex];
    await base44.entities.Attempt.create({
      question_id: q.id,
      selected_answer: answers[currentIndex],
      correct_answer: q.correct_answer,
      is_correct: answers[currentIndex] === q.correct_answer,
      mode: 'practice',
    });

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      setIsComplete(true);
      queryClient.invalidateQueries({ queryKey: ['attempts'] });
    }
  };

  const reset = () => {
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setIsComplete(false);
    setSelectedSubject('');
    setSelectedUnit('');
  };

  /* -------------------- UI -------------------- */

  if (questions.length === 0 && !isGenerating) {
    return (
      <>
        <h1 className="text-3xl font-bold mb-4">Practice Mode</h1>

        <Select value={selectedSubject} onValueChange={v => {
          setSelectedSubject(v);
          setSelectedUnit('');
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Choose subject or All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map(s => (
              <SelectItem key={s.subject_id} value={s.subject_id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedSubject && (
          <Select value={selectedUnit} onValueChange={setSelectedUnit}>
            <SelectTrigger>
              <SelectValue placeholder="Choose unit or All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Units</SelectItem>
              {units.map(u => (
                <SelectItem key={u.id} value={u.id}>
                  {u.unit_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button
          className="mt-6"
          disabled={isGenerating || subjectsLoading}
          onClick={generateQuestions}
        >
          {isGenerating ? 'Generating...' : 'Start Practice'}
        </Button>
        <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
      </>
    );
  }

  if (isGenerating) {
    return <Loader2 className="animate-spin mx-auto mt-32" />;
  }

  if (isComplete) {
    return (
      <>
        <h2 className="text-2xl font-bold">Practice Complete 🎉</h2>
        <Button onClick={reset}>New Practice</Button>
      </>
    );
  }

  const q = questions[currentIndex];

  return (
    <>
      <QuestionCard
        question={q}
        onAnswer={handleAnswer}
        selectedAnswer={answers[currentIndex]}
        showFeedback={answers[currentIndex] !== undefined}
      />

      {answers[currentIndex] !== undefined && (
        <Button onClick={handleNext} className="mt-4">
          {currentIndex < questions.length - 1 ? 'Next' : 'Finish'}
        </Button>
      )}
    </>
  );
}
