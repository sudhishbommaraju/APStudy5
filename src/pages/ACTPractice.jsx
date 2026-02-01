import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Target, TrendingUp, BookOpen, Calculator, FlaskConical, FileText } from 'lucide-react';
import QuestionCard from '@/components/ui/QuestionCard';
import { motion } from 'framer-motion';

export default function ACTPractice() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('english');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        console.error('Failed to load user:', e);
      }
    };
    loadUser();
  }, []);

  const { data: attempts = [] } = useQuery({
    queryKey: ['attempts', user?.email],
    queryFn: () => base44.entities.Attempt.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const generateACT = async (section, count = 10) => {
    setIsGenerating(true);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setIsComplete(false);

    try {
      const actSubject = await base44.entities.Subject.filter({ subject_id: 'act' });
      if (!actSubject || actSubject.length === 0) {
        throw new Error('ACT subject not found');
      }

      const units = await base44.entities.Unit.filter({ subject_id: 'act' });
      const targetUnit = units.find(u => u.unit_name.toLowerCase().includes(section)) || units[0];

      const prompts = [];
      for (let i = 0; i < count; i++) {
        const prompt = generatePromptForSection(section);
        
        prompts.push(
          base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
              type: 'object',
              properties: {
                passage: { type: 'string' },
                question_text: { type: 'string' },
                choice_a: { type: 'string' },
                choice_b: { type: 'string' },
                choice_c: { type: 'string' },
                choice_d: { type: 'string' },
                correct_answer: { type: 'string' },
                explanation: { type: 'string' },
                wrong_answer_explanations: {
                  type: 'object',
                  properties: {
                    A: { type: 'string' },
                    B: { type: 'string' },
                    C: { type: 'string' },
                    D: { type: 'string' }
                  }
                }
              },
              required: ['question_text', 'choice_a', 'choice_b', 'choice_c', 'choice_d', 'correct_answer', 'explanation']
            }
          })
        );
      }

      const responses = await Promise.all(prompts);
      
      const generatedQuestions = await Promise.all(
        responses.map(r => 
          base44.entities.Question.create({
            subject_id: 'act',
            unit_id: targetUnit.id,
            skill_id: '',
            unit_name: targetUnit.unit_name,
            skill_name: section.charAt(0).toUpperCase() + section.slice(1),
            difficulty: 'medium',
            question_text: r.passage ? `${r.passage}\n\n${r.question_text}` : r.question_text,
            choice_a: r.choice_a,
            choice_b: r.choice_b,
            choice_c: r.choice_c,
            choice_d: r.choice_d,
            correct_answer: r.correct_answer,
            explanation: r.explanation,
            wrong_answer_explanations: r.wrong_answer_explanations || {},
            is_ai_generated: true
          })
        )
      );

      // Generate notes and flashcards
      await generateNotesAndFlashcards(section, generatedQuestions);

      setQuestions(generatedQuestions);
    } catch (e) {
      console.error('ACT generation failed:', e);
      alert('Failed to generate ACT questions. Please try again.');
    }
    setIsGenerating(false);
  };

  const generatePromptForSection = (section) => {
    const prompts = {
      english: `Generate an ORIGINAL ACT English question (passage-based editing).

CRITICAL RULES:
1. Provide a 3-5 sentence passage with ONE underlined portion
2. Question tests grammar, punctuation, style, or organization
3. Four answer choices: A (NO CHANGE), B, C, D
4. All distractors must be plausible but have clear errors

Return JSON with:
- passage: the text with ONE underlined word/phrase marked as [UNDERLINED]
- question_text: "Which choice best maintains the sentence structure?" (or similar)
- choice_a: "NO CHANGE"
- choice_b, choice_c, choice_d: alternative versions
- correct_answer: "A", "B", "C", or "D"
- explanation: grammar rule or style principle
- wrong_answer_explanations: why each wrong choice is incorrect`,

      math: `Generate an ORIGINAL ACT Math question (algebra, geometry, or trigonometry).

CRITICAL RULES:
1. MUST use LaTeX for ALL math: $x^2 + 5x - 6 = 0$, not x² + 5x - 6 = 0
2. ACT style: straightforward, tests concept directly
3. Domains: Pre-Algebra, Elementary Algebra, Intermediate Algebra, Coordinate Geometry, Plane Geometry, Trigonometry

Return JSON with:
- question_text: the problem (use LaTeX)
- choice_a, choice_b, choice_c, choice_d: answer options (use LaTeX)
- correct_answer: "A", "B", "C", or "D"
- explanation: solution steps (use LaTeX)
- wrong_answer_explanations: common mistakes leading to wrong answers`,

      reading: `Generate an ORIGINAL ACT Reading passage and question.

CRITICAL RULES:
1. Passage: 200-300 words (fiction, humanities, social science, or natural science)
2. ONE question about: main idea, detail, inference, or author's purpose
3. All four choices must be defensible until close reading

Return JSON with:
- passage: the reading passage
- question_text: comprehension question
- choice_a, choice_b, choice_c, choice_d: answer choices
- correct_answer: "A", "B", "C", or "D"
- explanation: evidence from passage
- wrong_answer_explanations: why each distractor is incorrect`,

      science: `Generate an ORIGINAL ACT Science question (data interpretation).

CRITICAL RULES:
1. Provide a DATA TABLE or describe a simple experiment
2. Question tests: reading graphs, interpreting trends, or drawing conclusions
3. Science REASONING first, science KNOWLEDGE second
4. Use LaTeX for any formulas: $\\frac{distance}{time}$

Return JSON with:
- passage: describe the table/experiment (can include markdown table)
- question_text: data interpretation question
- choice_a, choice_b, choice_c, choice_d: answer options
- correct_answer: "A", "B", "C", or "D"
- explanation: how to read the data
- wrong_answer_explanations: common misinterpretations`
    };

    return prompts[section] || prompts.english;
  };

  const generateNotesAndFlashcards = async (section, questions) => {
    try {
      const usesLatex = ['math', 'science'].includes(section);
      const notePrompt = `Based on these ACT ${section} questions, create comprehensive study notes.

${usesLatex ? 'USE LATEX for ALL formulas: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$' : 'Use clear text formatting.'}

Include:
- Key concepts tested
- Common question patterns
- Strategy tips
- Example approaches

Format as markdown.`;

      const noteContent = await base44.integrations.Core.InvokeLLM({
        prompt: notePrompt
      });

      await base44.entities.Note.create({
        exam_type: 'ACT',
        unit_name: section.charAt(0).toUpperCase() + section.slice(1),
        title: `ACT ${section.charAt(0).toUpperCase() + section.slice(1)} - Key Concepts`,
        content: noteContent,
        topics_covered: [],
        is_ai_generated: true
      });

      // Generate flashcards
      for (let i = 0; i < Math.min(5, questions.length); i++) {
        const q = questions[i];
        await base44.entities.Flashcard.create({
          exam_type: 'ACT',
          unit_name: section.charAt(0).toUpperCase() + section.slice(1),
          front: q.question_text.substring(0, 200),
          back: q.explanation,
          topic: q.skill_name,
          difficulty: 'medium',
          is_ai_generated: true
        });
      }
    } catch (e) {
      console.error('Failed to generate notes/flashcards:', e);
    }
  };

  const handleAnswer = (answer) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: answer }));
  };

  const handleNext = async () => {
    const question = questions[currentIndex];
    const selectedAnswer = answers[currentIndex];
    const isCorrect = selectedAnswer === question.correct_answer;

    await base44.entities.Attempt.create({
      question_id: question.id,
      subject_id: 'act',
      unit_id: question.unit_id,
      skill_id: question.skill_id,
      skill_name: question.skill_name,
      difficulty: question.difficulty,
      selected_answer: selectedAnswer,
      correct_answer: question.correct_answer,
      is_correct: isCorrect,
      mode: 'practice'
    });

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
      queryClient.invalidateQueries({ queryKey: ['attempts'] });
    }
  };

  const resetPractice = () => {
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setIsComplete(false);
  };

  const calculateScoreRange = () => {
    const actAttempts = attempts.filter(a => a.subject_id === 'act');
    if (actAttempts.length < 10) return null;

    const correct = actAttempts.filter(a => a.is_correct).length;
    const accuracy = (correct / actAttempts.length) * 100;

    // ACT score is 1-36
    let baseScore = 1 + (accuracy / 100) * 35;
    let margin = 3;
    
    return {
      low: Math.max(1, Math.round(baseScore - margin)),
      high: Math.min(36, Math.round(baseScore + margin)),
      confidence: actAttempts.length > 50 ? 75 : 60
    };
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (isComplete) {
    const correctCount = questions.filter((q, i) => answers[i] === q.correct_answer).length;
    const accuracy = (correctCount / questions.length) * 100;

    return (
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 text-center mb-6"
        >
          <Target className="w-16 h-16 mx-auto mb-4 text-violet-400" />
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Practice Complete!</h1>
          <p className="text-4xl font-bold text-violet-400 mb-4">{accuracy.toFixed(0)}%</p>
          <p className="text-slate-400">{correctCount} out of {questions.length} correct</p>
        </motion.div>
        <Button onClick={resetPractice} className="w-full">New Practice</Button>
      </div>
    );
  }

  if (questions.length > 0) {
    const currentQuestion = questions[currentIndex];
    const answered = answers[currentIndex] !== undefined;

    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-slate-400">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <div className="h-2 w-48 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-violet-600 transition-all"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <QuestionCard
          question={currentQuestion}
          onAnswer={handleAnswer}
          selectedAnswer={answers[currentIndex]}
          showFeedback={answered}
          mode="practice"
        />

        {answered && (
          <div className="mt-4 flex justify-end">
            <Button onClick={handleNext}>
              {currentIndex < questions.length - 1 ? 'Next Question' : 'Complete Practice'}
            </Button>
          </div>
        )}
      </div>
    );
  }

  const scoreRange = calculateScoreRange();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">ACT Practice</h1>
        <p className="page-description">Official-style ACT practice questions</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 bg-slate-800/40 border border-slate-700/50">
          <TabsTrigger value="english">
            <FileText className="w-4 h-4 mr-2" />
            English
          </TabsTrigger>
          <TabsTrigger value="math">
            <Calculator className="w-4 h-4 mr-2" />
            Math
          </TabsTrigger>
          <TabsTrigger value="reading">
            <BookOpen className="w-4 h-4 mr-2" />
            Reading
          </TabsTrigger>
          <TabsTrigger value="science">
            <FlaskConical className="w-4 h-4 mr-2" />
            Science
          </TabsTrigger>
          <TabsTrigger value="full_length">
            <Target className="w-4 h-4 mr-2" />
            Full Test
          </TabsTrigger>
          <TabsTrigger value="score_analyzer">
            <TrendingUp className="w-4 h-4 mr-2" />
            Score
          </TabsTrigger>
        </TabsList>

        <TabsContent value="english">
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8">
            <h2 className="text-2xl font-bold text-slate-100 mb-4">ACT English</h2>
            <p className="text-slate-400 mb-6">
              Passage-based editing questions testing grammar, punctuation, style, and organization.
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={() => generateACT('english', 10)}
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Generate 10 Questions
              </Button>
              <Button 
                onClick={() => generateACT('english', 15)}
                disabled={isGenerating}
                variant="outline"
                className="flex-1"
              >
                Generate 15 Questions
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="math">
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8">
            <h2 className="text-2xl font-bold text-slate-100 mb-4">ACT Math</h2>
            <p className="text-slate-400 mb-6">
              Algebra, geometry, and trigonometry. All math rendered in LaTeX.
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={() => generateACT('math', 10)}
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Generate 10 Questions
              </Button>
              <Button 
                onClick={() => generateACT('math', 15)}
                disabled={isGenerating}
                variant="outline"
                className="flex-1"
              >
                Generate 15 Questions
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reading">
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8">
            <h2 className="text-2xl font-bold text-slate-100 mb-4">ACT Reading</h2>
            <p className="text-slate-400 mb-6">
              Comprehension questions on fiction, humanities, social science, and natural science passages.
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={() => generateACT('reading', 10)}
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Generate 10 Questions
              </Button>
              <Button 
                onClick={() => generateACT('reading', 15)}
                disabled={isGenerating}
                variant="outline"
                className="flex-1"
              >
                Generate 15 Questions
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="science">
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8">
            <h2 className="text-2xl font-bold text-slate-100 mb-4">ACT Science</h2>
            <p className="text-slate-400 mb-6">
              Data interpretation, scientific reasoning, and experiment analysis. Data first, knowledge second.
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={() => generateACT('science', 10)}
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Generate 10 Questions
              </Button>
              <Button 
                onClick={() => generateACT('science', 15)}
                disabled={isGenerating}
                variant="outline"
                className="flex-1"
              >
                Generate 15 Questions
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="full_length">
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8">
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Full-Length ACT Practice</h2>
            <p className="text-slate-400 mb-6">
              Complete practice test: 75 English + 60 Math + 40 Reading + 40 Science (215 total).
            </p>
            <Button disabled>
              Start Full-Length Practice (Coming Soon)
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="score_analyzer">
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8">
            <h2 className="text-2xl font-bold text-slate-100 mb-4">ACT Score Analyzer</h2>
            {scoreRange ? (
              <div className="space-y-4">
                <div className="text-center p-8 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg">
                  <p className="text-sm text-slate-400 mb-2">Predicted ACT Composite Range</p>
                  <p className="text-5xl font-bold text-green-400 mb-2">
                    {scoreRange.low}–{scoreRange.high}
                  </p>
                  <p className="text-sm text-slate-500">Confidence: {scoreRange.confidence}%</p>
                </div>
                <p className="text-slate-400 text-sm">
                  Based on {attempts.filter(a => a.subject_id === 'act').length} ACT practice questions completed.
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">
                  Complete at least 10 ACT practice questions to see your predicted score range.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}