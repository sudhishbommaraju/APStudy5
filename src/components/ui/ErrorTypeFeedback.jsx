import React from 'react';
import { Brain, Calculator, Eye, Clock, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const ERROR_TYPE_GUIDANCE = {
  conceptual: {
    icon: Brain,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    title: 'Conceptual Understanding',
    guidance: 'Focus on understanding the underlying concept before attempting similar problems.',
  },
  computation: {
    icon: Calculator,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    title: 'Computation Error',
    guidance: 'Double-check your arithmetic and algebraic manipulations. Work through calculations carefully.',
  },
  misread: {
    icon: Eye,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    title: 'Question Misread',
    guidance: 'Read questions carefully. Underline key information and what the question is asking for.',
  },
  time_pressure: {
    icon: Clock,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    title: 'Time Pressure',
    guidance: 'Practice similar problems to build speed. Focus on recognizing patterns quickly.',
  },
};

export default function ErrorTypeFeedback({ errorType, question, selectedAnswer }) {
  const config = ERROR_TYPE_GUIDANCE[errorType];
  if (!config) return null;

  const Icon = config.icon;
  const wrongAnswerExplanation = question.wrong_answer_explanations?.[selectedAnswer];

  return (
    <div className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-5 mt-4`}>
      <div className="flex items-start gap-3 mb-3">
        <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h4 className={`font-semibold ${config.color} mb-1`}>{config.title}</h4>
          <p className="text-sm text-slate-700">{config.guidance}</p>
        </div>
      </div>

      {wrongAnswerExplanation && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Why {selectedAnswer} is incorrect
          </p>
          <div className="text-sm text-slate-700 prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {wrongAnswerExplanation}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {errorType === 'conceptual' && question.hint && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Key Concept
            </p>
          </div>
          <div className="text-sm text-slate-700">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {question.hint}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}