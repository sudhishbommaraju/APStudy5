import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, RotateCcw, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import QuestionCard from '@/components/ui/QuestionCard';
import SubjectUnitSelector from '@/components/study/SubjectUnitSelector';
import { cn } from '@/lib/utils';

export default function Practice() {
  const urlParams = new URLSearchParams(window.location.search);
  const examFromUrl = urlParams.get('exam');
  
  const [user, setUser] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: currentSkillData } = useQuery({
    queryKey: ['skill', selectedSkill],
    queryFn: () => base44.entities.Skill.list(),
    enabled: !!selectedSkill,
    select: (skills) => skills.find(s => s.id === selectedSkill),
  });

  const generateQuestion = async () => {
    if (!currentSkillData) return;
    
    setGenerating(true);
    setAnswered(false);
    
    try {
      // Check if we have unused questions first
      const existingQuestionsForSkill = await base44.entities.Question.filter({
        subject_id: selectedSubject,
        unit_id: selectedUnit,
        skill_id: selectedSkill,
        difficulty: selectedDifficulty,
      });
      
      const usedQuestionIds = new Set();
      const attempts = await base44.entities.Attempt.filter({
        skill_id: selectedSkill,
        difficulty: selectedDifficulty,
        created_by: user?.email,
      });
      attempts.forEach(a => usedQuestionIds.add(a.question_id));
      
      const unusedQuestions = existingQuestionsForSkill.filter(q => !usedQuestionIds.has(q.id));
      
      if (unusedQuestions.length > 0) {
        const randomQ = unusedQuestions[Math.floor(Math.random() * unusedQuestions.length)];
        setCurrentQuestion(randomQ);
        setGenerating(false);
        return;
      }

      // Generate new question with AI
      const prompt = `Generate an exam-style multiple choice question for ${currentSkillData.subject_name || selectedSubject}.

Topic/Skill: ${currentSkillData.skill_name}
Difficulty: ${selectedDifficulty}

Requirements:
- Match official College Board/ACT question style and phrasing
- Exactly 4 answer choices (A, B, C, D)
- Exactly one correct answer
- Include plausible distractors that test common misconceptions
- For ${selectedDifficulty} difficulty: ${
  selectedDifficulty === 'easy' ? 'straightforward application of concepts' :
  selectedDifficulty === 'medium' ? 'requires multi-step reasoning' :
  'complex problem requiring deep understanding and multiple concepts'
}
- Use proper mathematical notation where needed

Return a JSON object with:
- question_text: The question stem (can include LaTeX math notation)
- choice_a, choice_b, choice_c, choice_d: The four answer choices
- correct_answer: "A", "B", "C", or "D"
- explanation: Detailed step-by-step solution
- wrong_answer_explanations: Object with explanations for why each wrong answer is incorrect`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            question_text: { type: 'string' },
            choice_a: { type: 'string' },
            choice_b: { type: 'string' },
            choice_c: { type: 'string' },
            choice_d: { type: 'string' },
            correct_answer: { type: 'string', enum: ['A', 'B', 'C', 'D'] },
            explanation: { type: 'string' },
            wrong_answer_explanations: { 
              type: 'object',
              properties: {
                A: { type: 'string' },
                B: { type: 'string' },
                C: { type: 'string' },
                D: { type: 'string' },
              }
            },
          },
          required: ['question_text', 'choice_a', 'choice_b', 'choice_c', 'choice_d', 'correct_answer', 'explanation'],
        },
      });

      const newQuestion = await base44.entities.Question.create({
        subject_id: selectedSubject,
        unit_id: selectedUnit,
        skill_id: selectedSkill,
        unit_name: currentSkillData.unit_name || '',
        skill_name: currentSkillData.skill_name,
        difficulty: selectedDifficulty,
        question_text: response.question_text,
        choice_a: response.choice_a,
        choice_b: response.choice_b,
        choice_c: response.choice_c,
        choice_d: response.choice_d,
        correct_answer: response.correct_answer,
        explanation: response.explanation,
        wrong_answer_explanations: response.wrong_answer_explanations || {},
        is_ai_generated: true,
      });

      setCurrentQuestion(newQuestion);
    } catch (e) {
      console.error('Failed to generate question:', e);
    }
    setGenerating(false);
  };

  const handleAnswer = async (selectedAnswer) => {
    if (!currentQuestion) return;
    
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    setAnswered(true);
    setQuestionsAnswered(prev => prev + 1);
    if (isCorrect) setCorrectCount(prev => prev + 1);

    // Record attempt
    await base44.entities.Attempt.create({
      question_id: currentQuestion.id,
      subject_id: selectedSubject,
      unit_id: selectedUnit,
      skill_id: selectedSkill,
      unit_name: currentQuestion.unit_name,
      skill_name: currentQuestion.skill_name,
      difficulty: selectedDifficulty,
      selected_answer: selectedAnswer,
      correct_answer: currentQuestion.correct_answer,
      is_correct: isCorrect,
      mode: 'practice',
    });

    queryClient.invalidateQueries({ queryKey: ['attempts'] });
  };

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
            <h1 className="text-2xl font-bold text-slate-900">Practice Mode</h1>
            <p className="text-slate-500">Select a skill and start practicing</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Subject, Unit, Skill Selector */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <SubjectUnitSelector
                selectedSubject={selectedSubject}
                selectedUnit={selectedUnit}
                selectedSkill={selectedSkill}
                onSubjectChange={(subjectId) => {
                  setSelectedSubject(subjectId);
                  setSelectedUnit('');
                  setSelectedSkill('');
                  setCurrentQuestion(null);
                }}
                onUnitChange={(unitId) => {
                  setSelectedUnit(unitId);
                  setSelectedSkill('');
                  setCurrentQuestion(null);
                }}
                onSkillChange={(skillId) => {
                  setSelectedSkill(skillId);
                  setCurrentQuestion(null);
                  setAnswered(false);
                }}
              />
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

            {/* Session Stats */}
            {questionsAnswered > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 block">
                  This Session
                </label>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Accuracy</span>
                  <span className="font-semibold text-slate-900">
                    {((correctCount / questionsAnswered) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-slate-600">Questions</span>
                  <span className="font-semibold text-slate-900">
                    {correctCount}/{questionsAnswered}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {!selectedSubject ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <ArrowRight className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Select a Subject</h3>
                <p className="text-slate-500 text-sm">
                  Choose a subject to get started
                </p>
              </div>
            ) : !selectedUnit ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <ArrowRight className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Select a Unit</h3>
                <p className="text-slate-500 text-sm">
                  Choose a unit from the selected subject
                </p>
              </div>
            ) : !selectedSkill ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <ArrowRight className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Select a Skill</h3>
                <p className="text-slate-500 text-sm">
                  Choose a specific skill to practice
                </p>
              </div>
            ) : generating ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500">Generating question...</p>
              </div>
            ) : currentQuestion ? (
              <div className="space-y-4">
                <QuestionCard
                  question={currentQuestion}
                  onAnswer={handleAnswer}
                  showFeedback={answered}
                  mode="practice"
                />
                
                {answered && (
                  <div className="flex justify-end">
                    <Button onClick={generateQuestion}>
                      Next Question
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <h3 className="font-semibold text-slate-900 mb-2">
                  Ready to practice {currentSkillData?.skill_name}?
                </h3>
                {currentSkillData?.description && (
                  <p className="text-slate-500 text-sm mb-6">
                    {currentSkillData.description}
                  </p>
                )}
                <Button onClick={generateQuestion} disabled={!currentSkillData}>
                  Generate Question
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}