import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, BookOpen } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import LatexStepInput from '@/components/practice/LatexStepInput';
import { motion } from 'framer-motion';

/**
 * PRACTICE WORKSPACE MODE
 * Students work through problems step-by-step with LaTeX input
 * Side-by-side comparison with canonical solution
 */

export default function PracticeWorkspace() {
  const [user, setUser] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [problems, setProblems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [studentSolutions, setStudentSolutions] = useState({});
  const [showComparison, setShowComparison] = useState({});

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

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list('subject_id'),
  });

  const generateProblems = async () => {
    setIsGenerating(true);

    try {
      const subject = subjects.find(s => s.subject_id === selectedSubject);
      const units = await base44.entities.Unit.filter({ subject_id: selectedSubject });

      const problemPromises = [];
      for (let i = 0; i < 5; i++) {
        const unit = units[i % units.length];

        const prompt = `Generate a step-by-step math problem for ${subject.name}, Unit: ${unit.unit_name}.

Create a problem that requires showing work (not just multiple choice).

Return JSON with:
- problem_statement: The question (LaTeX for math)
- canonical_solution: Step-by-step solution with LaTeX
- key_concepts: Array of concepts tested

Use proper LaTeX: $x^2$, $$\\frac{a}{b}$$, etc.`;

        problemPromises.push(
          base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
              type: 'object',
              properties: {
                problem_statement: { type: 'string' },
                canonical_solution: { type: 'string' },
                key_concepts: { type: 'array', items: { type: 'string' } },
              },
            },
          })
        );
      }

      const responses = await Promise.all(problemPromises);
      setProblems(responses);
    } catch (e) {
      console.error('Failed to generate problems:', e);
      alert('Failed to generate problems. Please try again.');
    }

    setIsGenerating(false);
  };

  const handleSolutionSubmit = (solution) => {
    setStudentSolutions(prev => ({ ...prev, [currentIndex]: solution }));
    setShowComparison(prev => ({ ...prev, [currentIndex]: true }));
  };

  const handleNext = () => {
    if (currentIndex < problems.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  if (problems.length === 0) {
    return (
      <>
        <div className="page-header">
          <h1 className="page-title">Practice Workspace</h1>
          <p className="page-description">
            Solve problems step-by-step with LaTeX - Compare with canonical solutions
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-200 mb-2 block">Select Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="bg-slate-900/50 border-slate-700/50 text-slate-200">
                  <SelectValue placeholder="Choose subject" />
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
              onClick={generateProblems}
              disabled={isGenerating || !selectedSubject}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Generate Problems
                </>
              )}
            </Button>
          </div>
        </div>
      </>
    );
  }

  const currentProblem = problems[currentIndex];
  const hasSubmitted = showComparison[currentIndex];

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Practice Workspace</h1>
        <p className="text-sm text-slate-400">
          Problem {currentIndex + 1} of {problems.length}
        </p>
      </div>

      <div className="space-y-6">
        {/* Problem Statement */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Problem</h3>
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {currentProblem.problem_statement}
            </ReactMarkdown>
          </div>
          {currentProblem.key_concepts && (
            <div className="mt-4 flex flex-wrap gap-2">
              {currentProblem.key_concepts.map((concept, idx) => (
                <span key={idx} className="text-xs px-2 py-1 bg-violet-500/20 text-violet-300 rounded-full">
                  {concept}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Student Input or Comparison */}
        {!hasSubmitted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <LatexStepInput
              onSubmit={handleSolutionSubmit}
              canonicalSolution={currentProblem.canonical_solution}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-2 gap-4"
          >
            {/* Student Solution */}
            <div className="bg-blue-500/10 rounded-xl border border-blue-500/30 p-6">
              <h4 className="text-sm font-semibold text-blue-300 mb-4">Your Solution</h4>
              <div className="prose prose-sm prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {studentSolutions[currentIndex]}
                </ReactMarkdown>
              </div>
            </div>

            {/* Canonical Solution */}
            <div className="bg-emerald-500/10 rounded-xl border border-emerald-500/30 p-6">
              <h4 className="text-sm font-semibold text-emerald-300 mb-4">Model Solution</h4>
              <div className="prose prose-sm prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {currentProblem.canonical_solution}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        {hasSubmitted && currentIndex < problems.length - 1 && (
          <div className="flex justify-end">
            <Button onClick={handleNext}>
              Next Problem
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {hasSubmitted && currentIndex === problems.length - 1 && (
          <div className="text-center bg-emerald-500/10 rounded-xl border border-emerald-500/30 p-6">
            <h3 className="text-xl font-bold text-slate-100 mb-2">All Problems Complete!</h3>
            <p className="text-slate-300 mb-4">Great work practicing step-by-step solutions</p>
            <Button onClick={() => window.location.reload()}>
              <BookOpen className="w-4 h-4 mr-2" />
              New Problem Set
            </Button>
          </div>
        )}
      </div>
    </>
  );
}