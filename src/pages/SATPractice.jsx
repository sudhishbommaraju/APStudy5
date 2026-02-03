import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Target, TrendingUp, BookOpen, Calculator } from 'lucide-react';
import QuestionCard from '@/components/ui/QuestionCard';
import { SafeQuestionGenerator } from '@/components/generation/SafeQuestionGenerator';
import { motion, AnimatePresence } from 'framer-motion';

export default function SATPractice() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('reading_writing');
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

  const generateSAT = async (section, count = 10) => {
    setIsGenerating(true);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setIsComplete(false);

    try {
      const satSubject = await base44.entities.Subject.filter({ subject_id: 'sat' });
      if (!satSubject || satSubject.length === 0) {
        throw new Error('SAT subject not found');
      }

      const units = await base44.entities.Unit.filter({ subject_id: 'sat' });
      const targetUnit = units.find(u => 
        section === 'reading_writing' 
          ? u.unit_name.includes('Reading') 
          : u.unit_name.includes('Math')
      ) || units[0];

      const prompts = [];
      for (let i = 0; i < count; i++) {
        const prompt = section === 'reading_writing' 
          ? generateReadingWritingPrompt()
          : generateMathPrompt();
        
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
            subject_id: 'sat',
            unit_id: targetUnit.id,
            skill_id: '',
            unit_name: targetUnit.unit_name,
            skill_name: section === 'reading_writing' ? 'Reading & Writing' : 'Math',
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
      console.error('SAT generation failed:', e);
      alert('Failed to generate SAT questions. Please try again.');
    }
    setIsGenerating(false);
  };

  const generateReadingWritingPrompt = () => {
    return `Generate an ORIGINAL SAT Reading & Writing question in the style of College Board Progress Checks.

SAT READING/WRITING RULES (MANDATORY):
✓ NO LaTeX allowed (text-only subject)
✓ Passage: 120-180 words ONLY
✓ Short paragraphs, clear structure
✓ Quoted text in italics
✓ Professional academic tone
❌ NO math formatting
❌ NO LaTeX blocks
❌ NO symbols or equations

UNDERLINE FORMATTING (GRAMMAR/CONVENTIONS QUESTIONS ONLY):
✓ Use <u>tested phrase</u> HTML tags for underlined text
✓ NEVER write the word "UNDERLINED" anywhere
✓ Question stem MUST be bold: **Which choice best maintains...**
✓ Choice A MUST be "NO CHANGE"
✓ Underlined text must match choice A exactly

Example (CORRECT):
Passage: "The scientist, after years of research, <u>finally made a breakthrough in understanding</u> the complex system."
Question: **Which choice best maintains the sentence structure and clarity?**
A. NO CHANGE
B. finally, made a breakthrough in understanding
C. made, finally a breakthrough in understanding  
D. made a breakthrough finally in understanding

CRITICAL RULES:
1. Question types: Central Idea, Command of Evidence, Words in Context, Grammar/Conventions
2. Answer choices must be TIGHT distractors - all plausible
3. ONE passage → ONE question
4. Plain English only

ORIGINAL CONTENT REQUIRED:
- Create your own passage - do NOT copy existing SAT passages
- Passage can be about: science discovery, historical event, literary analysis, social issue

Return JSON with:
- passage: the 120-180 word reading passage (use <u>text</u> for underlined portions in grammar questions)
- question_text: the specific question (use **bold** for question stems)
- choice_a, choice_b, choice_c, choice_d: four plausible answers (plain text)
- correct_answer: "A", "B", "C", or "D"
- explanation: why correct answer is right (plain text)
- wrong_answer_explanations: object with A, B, C, D keys explaining why each wrong answer is wrong`;
  };

  const generateMathPrompt = () => {
    return `Generate an ORIGINAL SAT Math question (Heart of Algebra, Problem Solving & Data Analysis, or Passport to Advanced Math).

SAT MATH FORMATTING RULES (MANDATORY):
✓ ALL math in LaTeX: $x^2 + 3x - 4 = 0$
✓ Units with \\text{}: $20\\,\\text{m/s}$
✓ Block equations when needed:
$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$
✓ Write each formula ONCE only
❌ NEVER write "ext" without \\text{}
❌ NEVER duplicate formulas: "$x=5$x=5"
❌ NEVER use malformed units: "m/s2", "extm"
❌ NO raw unicode: x², use $x^2$

CRITICAL RULES:
1. Multiple choice (A-D) format
2. Realistic SAT difficulty - not too easy, not impossibly hard
3. Include brief context if needed (word problem)

Domains to rotate:
- Heart of Algebra: linear equations, inequalities, systems
- Problem Solving: ratios, percentages, data analysis
- Passport to Advanced Math: quadratics, exponentials, functions

Return JSON with:
- question_text: the problem (LaTeX for all math)
- choice_a, choice_b, choice_c, choice_d: numerical or algebraic answers (LaTeX)
- correct_answer: "A", "B", "C", or "D"
- explanation: step-by-step solution (LaTeX)
- wrong_answer_explanations: why each wrong answer is wrong

FINAL CHECK:
✓ ALL math in proper LaTeX
✓ NO "ext" corruption
✓ NO duplication
✓ Units properly formatted`;
  };

  const generateNotesAndFlashcards = async (section, questions) => {
    try {
      // Generate summary note
      const notePrompt = `Based on these SAT ${section === 'reading_writing' ? 'Reading & Writing' : 'Math'} questions, create comprehensive study notes.

${section === 'math' ? 'USE LATEX for ALL formulas: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$' : 'Use clear text formatting.'}

Include:
- Key concepts covered
- Common patterns
- Strategy tips
- Example approaches

Format as markdown.`;

      const noteContent = await base44.integrations.Core.InvokeLLM({
        prompt: notePrompt
      });

      await base44.entities.Note.create({
        exam_type: 'SAT',
        unit_name: section === 'reading_writing' ? 'Reading & Writing' : 'Math',
        title: `SAT ${section === 'reading_writing' ? 'Reading & Writing' : 'Math'} - Key Concepts`,
        content: noteContent,
        topics_covered: [],
        is_ai_generated: true
      });

      // Generate 5 flashcards from the questions
      for (let i = 0; i < Math.min(5, questions.length); i++) {
        const q = questions[i];
        await base44.entities.Flashcard.create({
          exam_type: 'SAT',
          unit_name: section === 'reading_writing' ? 'Reading & Writing' : 'Math',
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
      subject_id: 'sat',
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

  // Score Analyzer
  const calculateScoreRange = () => {
    const satAttempts = attempts.filter(a => a.subject_id === 'sat');
    if (satAttempts.length < 10) return null;

    const correct = satAttempts.filter(a => a.is_correct).length;
    const accuracy = (correct / satAttempts.length) * 100;

    // Conservative range estimation
    let baseScore = 200 + (accuracy / 100) * 1400;
    let margin = 70;
    
    return {
      low: Math.round(baseScore - margin),
      high: Math.round(baseScore + margin),
      confidence: satAttempts.length > 50 ? 75 : 60
    };
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D6B98C]" />
      </div>
    );
  }

  // Complete state
  if (isComplete) {
    const correctCount = questions.filter((q, i) => answers[i] === q.correct_answer).length;
    const accuracy = (correctCount / questions.length) * 100;

    return (
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[#1E1E1E] rounded-2xl border border-[#2A2A2A] p-8 text-center mb-6"
        >
          <Target className="w-16 h-16 mx-auto mb-4 text-[#D6B98C]" />
          <h1 className="text-3xl font-bold text-[#F5F5F5] mb-2">Practice Complete!</h1>
          <p className="text-4xl font-bold text-[#D6B98C] mb-4">{accuracy.toFixed(0)}%</p>
          <p className="text-[#B5B5B5]">{correctCount} out of {questions.length} correct</p>
        </motion.div>
        <div className="flex gap-3">
          <Button onClick={resetPractice} className="flex-1">New Practice</Button>
        </div>
      </div>
    );
  }

  // Practice in progress
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

  // Setup view
  const scoreRange = calculateScoreRange();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">SAT Practice</h1>
        <p className="page-description">Official-style SAT practice questions</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-[#1E1E1E] border border-[#2A2A2A]">
          <TabsTrigger value="reading_writing">
            <BookOpen className="w-4 h-4 mr-2" />
            Reading & Writing
          </TabsTrigger>
          <TabsTrigger value="math">
            <Calculator className="w-4 h-4 mr-2" />
            Math
          </TabsTrigger>
          <TabsTrigger value="full_length">
            <Target className="w-4 h-4 mr-2" />
            Full-Length
          </TabsTrigger>
          <TabsTrigger value="score_analyzer">
            <TrendingUp className="w-4 h-4 mr-2" />
            Score Analyzer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reading_writing">
          <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-8">
            <h2 className="text-2xl font-semibold text-[#F5F5F5] mb-4">SAT Reading & Writing</h2>
            <p className="text-[#B5B5B5] mb-6">
              Practice with original passages and questions designed to match College Board style.
              Each passage is 120-180 words followed by one question.
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={() => generateSAT('reading_writing', 10)}
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Generate 10 Questions
              </Button>
              <Button 
                onClick={() => generateSAT('reading_writing', 20)}
                disabled={isGenerating}
                variant="outline"
                className="flex-1"
              >
                Generate 20 Questions
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="math">
          <div className="bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-8">
            <h2 className="text-2xl font-semibold text-[#F5F5F5] mb-4">SAT Math</h2>
            <p className="text-[#B5B5B5] mb-6">
              Practice Heart of Algebra, Problem Solving & Data Analysis, and Passport to Advanced Math.
              All math rendered in LaTeX for proper formatting.
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={() => generateSAT('math', 10)}
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Generate 10 Questions
              </Button>
              <Button 
                onClick={() => generateSAT('math', 20)}
                disabled={isGenerating}
                variant="outline"
                className="flex-1"
              >
                Generate 20 Questions
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="full_length">
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8">
            <h2 className="text-2xl font-bold text-slate-100 mb-4">Full-Length SAT Practice</h2>
            <p className="text-slate-400 mb-6">
              Complete practice test: 54 Reading & Writing + 44 Math questions (98 total).
              Timed simulation of the real SAT.
            </p>
            <Button 
              onClick={() => {
                setActiveTab('reading_writing');
                generateSAT('reading_writing', 27);
              }}
              disabled={isGenerating}
            >
              {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Start Full-Length Practice (Coming Soon)
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="score_analyzer">
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8">
            <h2 className="text-2xl font-bold text-slate-100 mb-4">SAT Score Analyzer</h2>
            {scoreRange ? (
              <div className="space-y-4">
                <div className="text-center p-8 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-lg">
                  <p className="text-sm text-slate-400 mb-2">Predicted SAT Score Range</p>
                  <p className="text-5xl font-bold text-violet-400 mb-2">
                    {scoreRange.low}–{scoreRange.high}
                  </p>
                  <p className="text-sm text-slate-500">Confidence: {scoreRange.confidence}%</p>
                </div>
                <p className="text-slate-400 text-sm">
                  Based on {attempts.filter(a => a.subject_id === 'sat').length} SAT practice questions completed.
                  Complete more questions to increase accuracy of prediction.
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">
                  Complete at least 10 SAT practice questions to see your predicted score range.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}