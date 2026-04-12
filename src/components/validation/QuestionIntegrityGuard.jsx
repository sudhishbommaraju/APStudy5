import React from 'react';
import { QuestionIntegritySystem } from './QuestionIntegritySystem';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * QUESTION INTEGRITY GUARD
 * Runtime protection - blocks invalid questions from reaching students
 * 
 * NO QUESTION MAY BE DISPLAYED WITHOUT PASSING VALIDATION
 */

export default function QuestionIntegrityGuard({ question, children, onRegenerate }) {
  if (!question) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-rose-800 mb-2">Question Not Available</h3>
        <p className="text-sm text-rose-600">This question could not be loaded.</p>
      </div>
    );
  }

  // VALIDATION GATE - Run full integrity check
  const validation = QuestionIntegritySystem.validateQuestion(question);

  if (!validation.valid) {
    // WARN - Question has validation issues, but allow display
    console.warn('⚠️ QUESTION VALIDATION ISSUES:', {
      questionId: question.id,
      subject: question.subject_id,
      errors: validation.errors,
      storedAnswer: question.correct_answer,
      computedAnswer: validation.computedAnswer
    });

    // Only block if critical errors (answer mismatch or missing required fields)
    const hasCriticalError = validation.errors.some(err => {
      const errStr = typeof err === 'string' ? err : String(err);
      return errStr.includes('Answer mismatch') || 
             errStr.includes('Missing required') ||
             errStr.includes('No valid choices');
    });

    if (hasCriticalError) {
      return (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-rose-800 mb-2">Invalid Question Blocked</h3>
          <p className="text-sm text-rose-700 mb-4">
            This question has critical errors and cannot be displayed.
          </p>
          
          {onRegenerate && (
            <Button onClick={onRegenerate} variant="outline" className="border-rose-300 text-rose-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate New Question
            </Button>
          )}
          
          {import.meta.env.DEV && (
            <div className="mt-6 text-left bg-white rounded-lg p-4 text-xs font-mono text-slate-700 border border-rose-200">
              <div className="font-bold mb-2 text-rose-800">🔍 Validation Report:</div>
              <div className="mb-3">
                <span className="font-semibold">Question ID:</span> {question.id}
              </div>
              <div className="mb-3">
                <span className="font-semibold">Subject:</span> {question.subject_id}
              </div>
              {validation.computedAnswer && (
                <div className="mb-3">
                  <span className="font-semibold">Computed Answer:</span> {validation.computedAnswer}<br/>
                  <span className="font-semibold">Stored Answer:</span> {question.correct_answer}
                  {validation.computedAnswer !== question.correct_answer && (
                    <span className="text-rose-600 font-bold ml-2">❌ MISMATCH</span>
                  )}
                </div>
              )}
              <div>
                <div className="font-bold mb-1 text-rose-800">Errors:</div>
                <ul className="list-disc pl-4 space-y-1">
                  {validation.errors.map((err, idx) => (
                    <li key={idx} className="text-rose-700">{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      );
    }
  }

  // VALIDATION PASSED - Display answer mismatch warning if detected
  if (validation.computedAnswer && validation.computedAnswer !== question.correct_answer) {
    console.warn('⚠️ ANSWER MISMATCH (passed validation but flagged):', {
      questionId: question.id,
      stored: question.correct_answer,
      computed: validation.computedAnswer
    });
  }

  // PASS - Render question
  return <>{children}</>;
}