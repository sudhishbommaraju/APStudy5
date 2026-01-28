import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download, FileText, GraduationCap, Plus, Trash2 } from 'lucide-react';
import { generateLatexDocument, worksheetToLatex, examToLatex, downloadLatexFile, createLicenseFooter } from '@/components/utils/LatexExporter';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default function TeacherMode() {
  const [user, setUser] = useState(null);
  const [documentType, setDocumentType] = useState('worksheet');
  const [title, setTitle] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [problemCount, setProblemCount] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [customTopics, setCustomTopics] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);

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

  const { data: units = [] } = useQuery({
    queryKey: ['units', selectedSubject],
    queryFn: () => base44.entities.Unit.filter({ subject_id: selectedSubject }),
    enabled: !!selectedSubject,
  });

  const generateWorksheet = async () => {
    if (!title || !selectedSubject) {
      alert('Please provide a title and select a subject');
      return;
    }

    setIsGenerating(true);

    try {
      const subject = subjects.find(s => s.subject_id === selectedSubject);
      const topicsContext = customTopics ? `Specific topics: ${customTopics}` : 'Cover standard curriculum topics';

      const prompt = `You are an expert educator creating a ${documentType} for ${subject.name}.

Title: ${title}
Difficulty: ${difficulty}
Number of Problems: ${problemCount}
${topicsContext}

Generate ${problemCount} high-quality academic problems with:
1. Clear problem statements using proper LaTeX for ALL mathematical notation
2. Detailed step-by-step solutions with LaTeX
3. Pedagogical notes where helpful

CRITICAL LaTeX RULES:
- ALL math must be in LaTeX: inline $...$ or display $$...$$
- Use proper notation: $\\frac{a}{b}$, $x^{2}$, $\\sqrt{x}$, $H_{2}O$
- Chemical formulas: $CH_{4}$, $H_{2}SO_{4}$
- Units in \\text{}: $100\\text{ m/s}$
- NO unicode, NO plain text math

Return JSON array of problems:
[
  {
    "problem_number": 1,
    "question": "LaTeX-formatted problem statement",
    "solution": "Step-by-step LaTeX solution",
    "difficulty": "easy/medium/hard",
    "learning_objective": "What this tests"
  }
]`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            problems: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  problem_number: { type: 'number' },
                  question: { type: 'string' },
                  solution: { type: 'string' },
                  difficulty: { type: 'string' },
                  learning_objective: { type: 'string' }
                }
              }
            }
          }
        }
      });

      setGeneratedContent(response.problems);
    } catch (e) {
      console.error('Failed to generate:', e);
      alert('Failed to generate content. Please try again.');
    }

    setIsGenerating(false);
  };

  const exportToLatex = () => {
    if (!generatedContent) return;

    const problems = generatedContent.map(p => ({
      question: p.question,
      solution: p.solution
    }));

    const latexBody = worksheetToLatex(title, problems, true);
    const fullLatex = generateLatexDocument(latexBody + createLicenseFooter(), title);
    
    downloadLatexFile(fullLatex, `${title.replace(/\s+/g, '_')}.tex`);
  };

  const exportSolutionsOnly = () => {
    if (!generatedContent) return;

    const problems = generatedContent.map(p => ({
      question: p.question,
      solution: p.solution
    }));

    const latexBody = worksheetToLatex(title + ' - Solutions', problems, true);
    const fullLatex = generateLatexDocument(latexBody + createLicenseFooter(), title + ' - Solutions');
    
    downloadLatexFile(fullLatex, `${title.replace(/\s+/g, '_')}_solutions.tex`);
  };

  const exportProblemsOnly = () => {
    if (!generatedContent) return;

    const problems = generatedContent.map(p => ({
      question: p.question,
    }));

    const latexBody = worksheetToLatex(title, problems, false);
    const fullLatex = generateLatexDocument(latexBody + createLicenseFooter(), title);
    
    downloadLatexFile(fullLatex, `${title.replace(/\s+/g, '_')}_problems_only.tex`);
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Teacher Mode</h1>
        <p className="page-description">
          Create LaTeX-native worksheets and exams - Free for educators
        </p>
        <div className="mt-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-lg inline-block">
          <p className="text-xs text-emerald-300">
            📜 All exports licensed under CC BY 4.0 - Free to use, share, and adapt
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {!generatedContent ? (
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-200 mb-2 block">Document Type</label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-700/50 text-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="worksheet" className="text-slate-200">Worksheet</SelectItem>
                    <SelectItem value="exam" className="text-slate-200">Exam</SelectItem>
                    <SelectItem value="practice_set" className="text-slate-200">Practice Set</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-200 mb-2 block">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Calculus Derivatives Quiz"
                  className="bg-slate-900/50 border-slate-700/50 text-slate-200"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-200 mb-2 block">Subject</label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-700/50 text-slate-200">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {subjects.map((subject) => (
                      <SelectItem key={subject.subject_id} value={subject.subject_id} className="text-slate-200">
                        {subject.icon} {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-200 mb-2 block">Number of Problems</label>
                <div className="flex gap-2">
                  {[5, 10, 15, 20].map((count) => (
                    <button
                      key={count}
                      onClick={() => setProblemCount(count)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        problemCount === count
                          ? 'bg-violet-600 text-white'
                          : 'bg-slate-900/50 text-slate-300 hover:bg-slate-900/70 border border-slate-700/50'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-200 mb-2 block">Difficulty</label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-700/50 text-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="easy" className="text-slate-200">Easy</SelectItem>
                    <SelectItem value="medium" className="text-slate-200">Medium</SelectItem>
                    <SelectItem value="hard" className="text-slate-200">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-200 mb-2 block">
                  Specific Topics (Optional)
                </label>
                <Textarea
                  value={customTopics}
                  onChange={(e) => setCustomTopics(e.target.value)}
                  placeholder="e.g., Chain rule, implicit differentiation, related rates"
                  className="bg-slate-900/50 border-slate-700/50 text-slate-200"
                />
              </div>

              <Button
                onClick={generateWorksheet}
                disabled={isGenerating || !title || !selectedSubject}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Generate {documentType}
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Export Options */}
            <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-xl border border-emerald-500/30 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Export Options</h3>
              <div className="grid md:grid-cols-3 gap-3">
                <Button
                  onClick={exportProblemsOnly}
                  variant="outline"
                  className="border-slate-600 hover:bg-slate-800"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Problems Only (.tex)
                </Button>
                <Button
                  onClick={exportSolutionsOnly}
                  variant="outline"
                  className="border-slate-600 hover:bg-slate-800"
                >
                  <Download className="w-4 h-4 mr-2" />
                  With Solutions (.tex)
                </Button>
                <Button
                  onClick={exportToLatex}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Full Document (.tex)
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-3">
                📝 Compile with pdflatex or use Overleaf for PDF generation
              </p>
            </div>

            {/* Preview */}
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-100">Preview</h3>
                <Button
                  onClick={() => setGeneratedContent(null)}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Document
                </Button>
              </div>
              
              <div className="space-y-6">
                {generatedContent.map((problem, idx) => (
                  <div key={idx} className="border-b border-slate-700/50 pb-6 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-slate-100">Problem {problem.problem_number}</h4>
                      <span className="text-xs px-2 py-1 bg-slate-700/50 rounded-full text-slate-300">
                        {problem.difficulty}
                      </span>
                    </div>
                    
                    <div className="mb-3 prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {problem.question}
                      </ReactMarkdown>
                    </div>

                    <div className="mt-3 p-4 bg-slate-900/50 rounded-lg">
                      <p className="text-xs font-semibold text-emerald-400 mb-2">Solution:</p>
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {problem.solution}
                        </ReactMarkdown>
                      </div>
                    </div>

                    {problem.learning_objective && (
                      <p className="text-xs text-slate-400 mt-2">
                        <strong>Learning Objective:</strong> {problem.learning_objective}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* License Notice */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <h4 className="font-semibold text-slate-100 mb-2">Open Educational License</h4>
          <p className="text-sm text-slate-300 mb-2">
            All materials generated in Teacher Mode are licensed under{' '}
            <a 
              href="https://creativecommons.org/licenses/by/4.0/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 underline"
            >
              Creative Commons Attribution 4.0 International (CC BY 4.0)
            </a>
          </p>
          <p className="text-xs text-slate-400">
            ✓ Free to use in classrooms<br/>
            ✓ Free to modify and redistribute<br/>
            ✓ Free for commercial use<br/>
            ✓ Attribution required
          </p>
        </div>
      </div>
    </>
  );
}