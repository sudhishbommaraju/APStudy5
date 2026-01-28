import React from 'react';
import { QuestionValidator } from './QuestionValidator';
import { AlertTriangle } from 'lucide-react';

/**
 * Runtime guard that BLOCKS invalid questions from rendering
 * Never shows broken content to students
 */

export default function QuestionIntegrityGuard({ question, children, onBlocked }) {
  const validationResult = QuestionValidator.validate(question);

  if (!validationResult.valid) {
    // Log to console for debugging
    console.error('BLOCKED INVALID QUESTION:', {
      id: question.id,
      errors: validationResult.errors,
    });

    // Notify parent component
    if (onBlocked) {
      onBlocked(question.id, validationResult);
    }

    // Show safe fallback UI (admin sees details, students see generic message)
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-rose-300 mb-2">
          Question Unavailable
        </h3>
        <p className="text-sm text-slate-300">
          This question has been automatically blocked due to quality issues.
          A new question will be generated.
        </p>
      </div>
    );
  }

  // Question is valid, render normally
  return <>{children}</>;
}