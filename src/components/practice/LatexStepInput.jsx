import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Eye, Edit3 } from 'lucide-react';

export default function LatexStepInput({ onSubmit, canonicalSolution = '' }) {
  const [studentSteps, setStudentSteps] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!studentSteps.trim()) return;
    setSubmitted(true);
    onSubmit(studentSteps);
  };

  if (submitted) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        {/* Student Solution */}
        <div className="bg-slate-800/40 rounded-lg border border-slate-700/50 p-4">
          <h4 className="text-sm font-semibold text-blue-400 mb-3">Your Solution</h4>
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {studentSteps}
            </ReactMarkdown>
          </div>
        </div>

        {/* Canonical Solution */}
        <div className="bg-slate-800/40 rounded-lg border border-emerald-700/50 p-4">
          <h4 className="text-sm font-semibold text-emerald-400 mb-3">Model Solution</h4>
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {canonicalSolution}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-200">
          Write your solution (use LaTeX for math: $x^2$, $$\\frac{a}{b}$$)
        </label>
        <Button
          onClick={() => setShowPreview(!showPreview)}
          variant="outline"
          size="sm"
        >
          <Eye className="w-4 h-4 mr-2" />
          {showPreview ? 'Edit' : 'Preview'}
        </Button>
      </div>

      {!showPreview ? (
        <Textarea
          value={studentSteps}
          onChange={(e) => setStudentSteps(e.target.value)}
          placeholder="Step 1: Given $f(x) = x^2 + 3x$&#10;&#10;Step 2: Apply power rule: $f'(x) = 2x + 3$&#10;&#10;Step 3: Therefore..."
          className="bg-slate-900/50 border-slate-700/50 text-slate-200 min-h-[200px] font-mono text-sm"
        />
      ) : (
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 min-h-[200px]">
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {studentSteps || '*Preview will appear here...*'}
            </ReactMarkdown>
          </div>
        </div>
      )}

      <div className="flex gap-2 text-xs text-slate-400 bg-slate-900/30 p-3 rounded-lg">
        <div>
          <strong>LaTeX Tips:</strong> Inline: $x^2$, Display: $$\\frac{a}{b}$$, Sqrt: $\\sqrt{x}$, Subscript: $x_{i}$
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!studentSteps.trim()}
        className="w-full bg-violet-600 hover:bg-violet-700"
      >
        <Edit3 className="w-4 h-4 mr-2" />
        Submit & Compare
      </Button>
    </div>
  );
}