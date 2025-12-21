import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowRight, ChevronLeft, Sparkles, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SkillSelector from '@/components/ui/SkillSelector';
import QuestionCard from '@/components/ui/QuestionCard';
import { cn } from '@/lib/utils';

const EXAM_NAMES = {
  ap_calculus: 'AP Calculus',
  sat_math: 'SAT Math',
  act_math: 'ACT Math',
  psat_math: 'PSAT Math',
};

export default function Generate() {
  const urlParams = new URLSearchParams(window.location.search);
  const examFromUrl = urlParams.get('exam');
  
  const [user, setUser] = useState(null);
  const [selectedExam, setSelectedExam] = useState(examFromUrl || 'sat_math');
  const [generationMode, setGenerationMode] = useState('skill'); // 'skill' or 'notes'
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [notes, setNotes] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      if (!examFromUrl && currentUser.primary_exam) {
        setSelectedExam(currentUser.primary_exam);
      }
    };
    loadUser();
  }, [examFromUrl]);

  const { data: skills = [] } = useQuery({
    queryKey: ['skills'],
    queryFn: () => base44.entities.Skill.list(),
  });

  const generateQuestions = async () => {
    setGenerating(true);
    setGeneratedQuestions([]);
    setCurrentIndex(0);

    try {
      const topicContext = generationMode === 'skill' 
        ? `Skill: ${selectedSkill.skill_name}\nSubject: ${selectedSkill.subject}`
        : `Student's Notes:\n${notes}`;

      const prompt = `Generate ${questionCount} exam-style multiple choice questions for ${EXAM_NAMES[selectedExam]}.

${topicContext}

Difficulty: ${selectedDifficulty}

Requirements for each question:
- Match official College Board/ACT question style and phrasing exactly
- Exactly 4 answer choices (A, B, C, D)
- Exactly one correct answer
- Include plausible distractors that test common misconceptions
- For ${selectedDifficulty} difficulty: ${
  selectedDifficulty === 'easy' ? 'straightforward application of concepts' :
  selectedDifficulty === 'medium' ? 'requires multi-step reasoning' :
  'complex problem requiring deep understanding and multiple concepts'
}
- Use proper mathematical notation
- Each question should test a slightly different aspect of the topic
- Questions should progressively build in complexity

Return a JSON object with a "questions" array, where each question has:
- question_text: The question stem
- choice_a, choice_b, choice_c, choice_d: The four answer choices  
- correct_answer: "A", "B", "C", or "D"
- explanation: Detailed step-by-step solution
- skill_name: The specific skill being tested (infer from notes if using notes mode)`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
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
                  explanation: { type: 'string' },
                  skill_name: { type: 'string' },
                },
              },
            },
          },
          required: ['questions'],
        },
      });

      // Save questions to database
      const savedQuestions = [];
      for (const q of response.questions) {
        const saved = await base44.entities.Question.create({
          exam_type: selectedExam,
          skill_id: selectedSkill?.id || '',
          skill_name: q.skill_name || selectedSkill?.skill_name || 'Generated',
          subject: selectedSkill?.subject || 'Custom',
          difficulty: selectedDifficulty,
          question_text: q.question_text,
          choice_a: q.choice_a,
          choice_b: q.choice_b,
          choice_c: q.choice_c,
          choice_d: q.choice_d,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          source_notes: generationMode === 'notes' ? notes : undefined,
          is_ai_generated: true,
        });
        savedQuestions.push(saved);
      }

      setGeneratedQuestions(savedQuestions);
    } catch (e) {
      console.error('Failed to generate questions:', e);
    }
    setGenerating(false);
  };

  const handleAnswer = async (selectedAnswer) => {
    const question = generatedQuestions[currentIndex];
    const isCorrect = selectedAnswer === question.correct_answer;

    await base44.entities.Attempt.create({
      question_id: question.id,
      exam_type: selectedExam,
      skill_name: question.skill_name,
      subject: question.subject,
      difficulty: selectedDifficulty,
      selected_answer: selectedAnswer,
      correct_answer: question.correct_answer,
      is_correct: isCorrect,
      mode: 'practice',
    });
  };

  const canGenerate = generationMode === 'skill' ? !!selectedSkill : notes.trim().length > 20;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AI Question Generator</h1>
            <p className="text-slate-500">Create exam-style questions from skills or your notes</p>
          </div>
        </div>

        {generatedQuestions.length === 0 ? (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Settings */}
            <div className="lg:col-span-1 space-y-4">
              {/* Mode Toggle */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 block">
                  Generate From
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setGenerationMode('skill')}
                    className={cn(
                      "flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      generationMode === 'skill'
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    <BookOpen className="w-4 h-4" />
                    Skill
                  </button>
                  <button
                    onClick={() => setGenerationMode('notes')}
                    className={cn(
                      "flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      generationMode === 'notes'
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    <Sparkles className="w-4 h-4" />
                    Notes
                  </button>
                </div>
              </div>

              {/* Exam Selector */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 block">
                  Exam
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(EXAM_NAMES).map(([id, name]) => (
                    <button
                      key={id}
                      onClick={() => {
                        setSelectedExam(id);
                        setSelectedSkill(null);
                      }}
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        selectedExam === id
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {name.replace(' Math', '')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 block">
                  Difficulty
                </label>
                <div className="flex gap-2">
                  {['easy', 'medium', 'hard'].map((d) => (
                    <button
                      key={d}
                      onClick={() => setSelectedDifficulty(d)}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all",
                        selectedDifficulty === d
                          ? d === 'easy' ? "bg-emerald-100 text-emerald-700" :
                            d === 'medium' ? "bg-amber-100 text-amber-700" :
                            "bg-rose-100 text-rose-700"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 block">
                  Number of Questions
                </label>
                <div className="flex gap-2">
                  {[3, 5, 10].map((n) => (
                    <button
                      key={n}
                      onClick={() => setQuestionCount(n)}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        questionCount === n
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={generateQuestions}
                disabled={!canGenerate || generating}
                className="w-full h-12"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate {questionCount} Questions
              </Button>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              {generationMode === 'skill' ? (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 block">
                    Select Skill
                  </label>
                  <div className="max-h-[500px] overflow-y-auto pr-2 -mr-2">
                    <SkillSelector
                      skills={skills}
                      selectedSkill={selectedSkill}
                      onSelect={setSelectedSkill}
                      examType={selectedExam}
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 block">
                    Paste Your Notes
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Paste your study notes, textbook excerpts, or topic summary here. The AI will analyze your notes and generate exam-style questions to test your understanding.

Example:
The derivative of a function represents the rate of change. The power rule states that d/dx[x^n] = nx^(n-1). For the chain rule, if y = f(g(x)), then dy/dx = f'(g(x)) · g'(x)..."
                    className="min-h-[400px] resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Minimum 20 characters required. More detailed notes will produce better questions.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Question Review */
          <div className="max-w-3xl mx-auto">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
                <span>Question {currentIndex + 1} of {generatedQuestions.length}</span>
                <button
                  onClick={() => {
                    setGeneratedQuestions([]);
                    setCurrentIndex(0);
                  }}
                  className="text-slate-600 hover:text-slate-900"
                >
                  Generate More
                </button>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-slate-900 transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / generatedQuestions.length) * 100}%` }}
                />
              </div>
            </div>

            <QuestionCard
              key={generatedQuestions[currentIndex].id}
              question={generatedQuestions[currentIndex]}
              onAnswer={handleAnswer}
              mode="practice"
            />

            <div className="flex justify-between mt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>
              <Button
                onClick={() => setCurrentIndex(Math.min(generatedQuestions.length - 1, currentIndex + 1))}
                disabled={currentIndex === generatedQuestions.length - 1}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}