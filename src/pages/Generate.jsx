import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowRight, ChevronLeft, Sparkles, BookOpen, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import QuestionCard from '@/components/ui/QuestionCard';
import SubjectUnitSelector from '@/components/study/SubjectUnitSelector';
import { cn } from '@/lib/utils';

export default function Generate() {
  const [user, setUser] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');

  const [generationMode, setGenerationMode] = useState('skill'); // 'skill' or 'notes'
  const [notes, setNotes] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [fetchingContent, setFetchingContent] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);



  const { data: currentSubjectData } = useQuery({
    queryKey: ['subject', selectedSubject],
    queryFn: () => base44.entities.Subject.list(),
    enabled: !!selectedSubject,
    select: (subjects) => subjects.find(s => s.subject_id === selectedSubject),
  });

  const isStandardizedTest = currentSubjectData?.category === 'Standardized';

  const fetchLinkContent = async () => {
    if (!videoUrl.trim()) return;
    
    setFetchingContent(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract and summarize the key educational content from this URL: ${videoUrl}
        
Please provide a comprehensive summary of the main concepts, topics, and information covered. Focus on educational content that can be used to generate study questions.

If this is a YouTube video, extract the main points discussed. If it's an article or webpage, summarize the key concepts.`,
        add_context_from_internet: true,
      });
      
      setNotes(response);
    } catch (e) {
      console.error('Failed to fetch content:', e);
    }
    setFetchingContent(false);
  };

  const generateQuestions = async () => {
    if (!selectedSubject || !selectedUnit) return;
    
    setGenerating(true);
    setGeneratedQuestions([]);
    setCurrentIndex(0);

    try {
      const { data: units = [] } = await base44.entities.Unit.filter({ subject_id: selectedSubject });
      const unit = units.find(u => u.id === selectedUnit);
      
      let contextInstructions = '';
      
      // SAT/ACT specific instructions
      if (selectedSubject === 'sat' && unit?.unit_name === 'Math') {
        contextInstructions = `Generate ${questionCount} SAT Math questions (${selectedDifficulty} difficulty). Topics: algebra, problem-solving, data analysis, advanced math (quadratics, exponentials, functions), geometry, trigonometry. Use real SAT format and difficulty.`;
      } else if (selectedSubject === 'sat' && unit?.unit_name === 'Reading and Writing') {
        contextInstructions = `Generate ${questionCount} SAT Reading and Writing questions (${selectedDifficulty} difficulty). Include short passages (2-4 sentences each) about literature, history, science, or social studies. Ask about grammar, vocabulary in context, rhetorical skills, or comprehension. Use real SAT format.`;
      } else if (selectedSubject === 'act' && unit?.unit_name === 'Math') {
        contextInstructions = `Generate ${questionCount} ACT Math questions (${selectedDifficulty} difficulty). Topics: pre-algebra, elementary algebra, intermediate algebra, coordinate geometry, plane geometry, trigonometry. Use real ACT format.`;
      } else if (selectedSubject === 'act' && unit?.unit_name === 'English') {
        contextInstructions = `Generate ${questionCount} ACT English questions (${selectedDifficulty} difficulty). Include sentences or short passages with grammar, punctuation, sentence structure, strategy, organization, or style issues. Test grammar rules, rhetorical skills, and writing conventions. Use real ACT format.`;
      } else if (selectedSubject === 'act' && unit?.unit_name === 'Reading') {
        contextInstructions = `Generate ${questionCount} ACT Reading questions (${selectedDifficulty} difficulty). Include passage excerpts (3-5 sentences each) from prose fiction, social science, humanities, or natural science. Ask about main ideas, details, inferences, vocabulary, or author's craft. Use real ACT format.`;
      } else if (selectedSubject === 'act' && unit?.unit_name === 'Science') {
        contextInstructions = `Generate ${questionCount} ACT Science questions (${selectedDifficulty} difficulty). Present data (describe charts/graphs/experiments) about biology, chemistry, physics, or earth science. Ask about data interpretation, scientific investigation, or evaluation of models. Use real ACT format.`;
      } else {
        const topicContext = generationMode === 'notes' 
          ? `Student's Notes:\n${notes}`
          : `Subject: ${currentSubjectData?.name}`;
        contextInstructions = `Generate ${questionCount} exam-style multiple choice questions for ${currentSubjectData?.name || selectedSubject}.

${topicContext}

Difficulty: ${selectedDifficulty}`;
      }

      const prompt = `${contextInstructions}

TABLES AND GRAPHS (For Science/Math):
- If the question involves data analysis, comparisons, or scientific results, include a table or graph description
- Format tables as markdown: | Header 1 | Header 2 |\n|---------|----------|\n| Data 1 | Data 2 |
- For graphs, describe the data points as JSON: {"type": "line/bar/scatter", "data": [{"x": 1, "y": 2}, ...], "labels": {"x": "Time (s)", "y": "Distance (m)"}}
- Only include visual data when it enhances understanding

CRITICAL FORMATTING REQUIREMENTS - READ CAREFULLY:

1. NEVER DUPLICATE EQUATIONS OR VALUES
2. NEVER show raw LaTeX commands like \\text, \\times in visible text
3. STRICTLY SEPARATE plain text from math blocks
4. ALL equations in $$ display blocks, ONE TIME ONLY
5. Units MUST use \\text{} inside math: $9.8 \\text{ m/s}^{2}$

EXPLANATION FORMAT (FOLLOW EXACTLY):

"Concept explanation in plain English.

The relevant formula is:

$$
[equation with proper LaTeX]
$$

Given values:

$$
[var] = [value] \\text{ [unit]}
$$

Substitute into formula:

$$
[calculation step 1]
$$

$$
[calculation step 2]
$$

$$
[final result] = [answer] \\text{ [unit]}
$$

Conclusion in plain text."

CORRECT EXAMPLES:

Physics:
"For gravitational potential energy:

$$
PE = mgh
$$

Given:

$$
m = 2 \\text{ kg}, \\quad h = 10 \\text{ m}, \\quad g = 9.8 \\text{ m/s}^{2}
$$

Calculate:

$$
PE = (2)(9.8)(10) = 196 \\text{ J}
$$

Approximately 200 J."

Chemistry:
"Using the electron configuration formula:

$$
\\text{Max electrons} = 2n^{2}
$$

For the third shell:

$$
2(3)^{2} = 18 \\text{ electrons}
$$"

NEVER WRITE:
- PE = mghPE = mgh (duplicated)
- 9.8\\textm/s^2 (broken LaTeX)
- 2extkg (corrupted units)

Requirements:
- Match official exam style
- 4 choices (A, B, C, D)
- One correct answer
- Each equation appears ONCE
- Units in \\text{}
- Progressive difficulty

CRITICAL - ANSWER CONSISTENCY:
- Calculate the correct answer first
- The correct_answer field MUST point to the choice with that calculated value
- Double-check: if math gives 196 ≈ 200, correct_answer must be the letter with 200
- NEVER let explanation contradict the correct_answer field
- Verify the letter matches the value BEFORE returning JSON

Return a JSON object with a "questions" array, where each question has:
- question_text: The question stem
- choice_a, choice_b, choice_c, choice_d: The four answer choices  
- correct_answer: "A", "B", "C", or "D"
- explanation: Detailed step-by-step solution with LaTeX
- wrong_answer_explanations: Object with A/B/C/D keys explaining common mistakes
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
                  table_data: { type: 'string' },
                  graph_data: { type: 'string' },
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
                  },
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
          subject_id: selectedSubject,
          unit_id: selectedUnit,
          skill_id: '',
          unit_name: '',
          skill_name: q.skill_name || 'Generated',
          difficulty: selectedDifficulty,
          question_text: q.question_text,
          table_data: q.table_data || '',
          graph_data: q.graph_data || '',
          choice_a: q.choice_a,
          choice_b: q.choice_b,
          choice_c: q.choice_c,
          choice_d: q.choice_d,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          wrong_answer_explanations: q.wrong_answer_explanations || {},
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
      subject_id: selectedSubject,
      unit_id: selectedUnit,
      skill_id: question.skill_id,
      unit_name: question.unit_name,
      skill_name: question.skill_name,
      difficulty: selectedDifficulty,
      selected_answer: selectedAnswer,
      correct_answer: question.correct_answer,
      is_correct: isCorrect,
      mode: 'practice',
    });
  };

  const canGenerate = selectedSubject && selectedUnit && (generationMode === 'notes' ? notes.trim().length > 20 : true);

  const isYouTubeUrl = (url) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #e8f1f8, #d9e9f5)', fontFamily: 'Georgia, serif' }}>
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

              {/* Subject, Unit Selector */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <SubjectUnitSelector
                  selectedSubject={selectedSubject}
                  selectedUnit={selectedUnit}
                  onSubjectChange={(subjectId) => {
                    setSelectedSubject(subjectId);
                    setSelectedUnit('');
                  }}
                  onUnitChange={setSelectedUnit}
                  hideSkillSelector={true}
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

              {/* Question Count */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 block">
                  Number of Questions {isStandardizedTest && '(Custom for SAT/ACT)'}
                </label>
                {isStandardizedTest ? (
                  <div className="space-y-2">
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={questionCount}
                      onChange={(e) => {
                        const val = Math.min(60, Math.max(1, parseInt(e.target.value) || 1));
                        setQuestionCount(val);
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                      placeholder="Enter 1-60"
                    />
                    <p className="text-xs text-slate-500">Max 60 questions</p>
                  </div>
                ) : (
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
                )}
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
            <div className="lg:col-span-2 space-y-4">
              {generationMode === 'notes' && (
                <>
                  {/* URL Input */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 block">
                      Generate from YouTube Video or Link
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                          placeholder="Paste YouTube video URL or article link..."
                          className="h-11"
                        />
                      </div>
                      <Button 
                        onClick={fetchLinkContent}
                        disabled={!videoUrl.trim() || fetchingContent}
                        variant="outline"
                      >
                        {fetchingContent ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <LinkIcon className="w-4 h-4 mr-2" />
                            Fetch Content
                          </>
                        )}
                      </Button>
                    </div>
                    {videoUrl && isYouTubeUrl(videoUrl) && (
                      <p className="text-xs text-slate-600 mt-2 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        YouTube video detected - AI will extract key concepts from the video
                      </p>
                    )}
                  </div>

                  {/* Notes Input */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 block">
                      Your Notes {videoUrl && '(or edit extracted content)'}
                    </label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Paste your study notes, textbook excerpts, or topic summary here. The AI will analyze your notes and generate exam-style questions to test your understanding.

Example:
The derivative of a function represents the rate of change. The power rule states that d/dx[x^n] = nx^(n-1). For the chain rule, if y = f(g(x)), then dy/dx = f'(g(x)) · g'(x)..."
                      className="min-h-[300px] resize-none"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Minimum 20 characters required. More detailed notes will produce better questions.
                    </p>
                  </div>
                </>
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