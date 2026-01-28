import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, CheckCircle2, Download, RefreshCw } from 'lucide-react';
import { QuestionValidator } from '@/components/validation/QuestionValidator';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default function QuestionValidation() {
  const [user, setUser] = useState(null);
  const [validationReport, setValidationReport] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedInvalidQuestion, setSelectedInvalidQuestion] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Redirect if not admin
        if (currentUser.role !== 'admin') {
          window.location.href = '/';
        }
      } catch (e) {
        console.error('Failed to load user:', e);
      }
    };
    loadUser();
  }, []);

  const { data: allQuestions = [], refetch } = useQuery({
    queryKey: ['allQuestions'],
    queryFn: () => base44.entities.Question.list('-created_date', 1000),
  });

  const runValidation = async () => {
    setIsValidating(true);
    
    // Run validation on all questions
    const report = QuestionValidator.validateBatch(allQuestions);
    setValidationReport(report);
    
    setIsValidating(false);
  };

  const downloadReport = () => {
    if (!validationReport) return;
    
    const reportText = QuestionValidator.generateReport(validationReport);
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `question_integrity_report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const deleteInvalidQuestion = async (questionId) => {
    if (!confirm('Delete this invalid question?')) return;
    
    try {
      await base44.entities.Question.delete(questionId);
      refetch();
      runValidation();
    } catch (e) {
      console.error('Failed to delete question:', e);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <p className="text-slate-100">Admin access required</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Question Integrity Validation</h1>
        <p className="page-description">
          Test harness for content quality - NO broken questions reach students
        </p>
      </div>

      <div className="space-y-6">
        {/* Control Panel */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Validation Suite</h3>
              <p className="text-sm text-slate-400">
                Total questions in database: {allQuestions.length}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={runValidation}
                disabled={isValidating || allQuestions.length === 0}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Run Validation
                  </>
                )}
              </Button>
              {validationReport && (
                <Button
                  onClick={downloadReport}
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
              )}
            </div>
          </div>

          {validationReport && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-slate-100">{validationReport.total}</div>
                <div className="text-xs text-slate-400">Total</div>
              </div>
              <div className="bg-emerald-500/10 rounded-lg p-4 text-center border border-emerald-500/30">
                <div className="text-2xl font-bold text-emerald-400">{validationReport.valid}</div>
                <div className="text-xs text-emerald-300">Valid</div>
              </div>
              <div className="bg-rose-500/10 rounded-lg p-4 text-center border border-rose-500/30">
                <div className="text-2xl font-bold text-rose-400">{validationReport.invalid}</div>
                <div className="text-xs text-rose-300">Invalid</div>
              </div>
            </div>
          )}
        </div>

        {/* Invalid Questions List */}
        {validationReport && validationReport.invalid > 0 && (
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-rose-500/30 overflow-hidden">
            <div className="px-6 py-4 bg-rose-500/10 border-b border-rose-500/30">
              <h3 className="font-semibold text-rose-300">
                ⚠️ {validationReport.invalid} Invalid Questions
              </h3>
              <p className="text-xs text-rose-300/80 mt-1">
                These questions are blocked from student access
              </p>
            </div>
            
            <div className="divide-y divide-slate-700/30 max-h-[600px] overflow-y-auto">
              {validationReport.invalidQuestions.map((iq) => {
                const question = allQuestions.find(q => q.id === iq.id);
                
                return (
                  <div key={iq.id} className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 bg-slate-700/50 rounded text-slate-300">
                            {iq.subject}
                          </span>
                          <span className="text-xs text-slate-400">
                            {iq.unit} • {iq.skill}
                          </span>
                        </div>
                        <p className="text-sm text-slate-100 font-mono text-xs line-clamp-2">
                          {question?.question_text}
                        </p>
                      </div>
                      <Button
                        onClick={() => deleteInvalidQuestion(iq.id)}
                        variant="outline"
                        size="sm"
                        className="text-rose-400 hover:bg-rose-500/10"
                      >
                        Delete
                      </Button>
                    </div>

                    {/* Error Details */}
                    <div className="space-y-2">
                      {iq.validationResult.errors.map((err, idx) => (
                        <div key={idx} className="bg-rose-500/5 border border-rose-500/20 rounded-lg p-3">
                          <p className="text-xs font-semibold text-rose-300 mb-2">
                            {err.phase}
                          </p>
                          {err.details.map((detail, didx) => (
                            <div key={didx} className="text-xs text-slate-300 mb-1">
                              • <strong>{detail.type}:</strong> {detail.message}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* Show the question details */}
                    <button
                      onClick={() => setSelectedInvalidQuestion(
                        selectedInvalidQuestion === iq.id ? null : iq.id
                      )}
                      className="text-xs text-violet-400 hover:text-violet-300 mt-3"
                    >
                      {selectedInvalidQuestion === iq.id ? 'Hide' : 'Show'} Question Details
                    </button>

                    {selectedInvalidQuestion === iq.id && question && (
                      <div className="mt-3 bg-slate-900/50 rounded-lg p-4 space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-slate-400 mb-1">Question Text:</p>
                          <p className="text-xs text-slate-200 font-mono">{question.question_text}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs font-semibold text-slate-400 mb-1">A:</p>
                            <p className="text-xs text-slate-200 font-mono">{question.choice_a}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-400 mb-1">B:</p>
                            <p className="text-xs text-slate-200 font-mono">{question.choice_b}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-400 mb-1">C:</p>
                            <p className="text-xs text-slate-200 font-mono">{question.choice_c}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-400 mb-1">D:</p>
                            <p className="text-xs text-slate-200 font-mono">{question.choice_d}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-400 mb-1">Correct Answer:</p>
                          <p className="text-xs text-slate-200">{question.correct_answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Success State */}
        {validationReport && validationReport.invalid === 0 && (
          <div className="bg-emerald-500/10 rounded-xl border border-emerald-500/30 p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-100 mb-2">
              All Questions Valid ✓
            </h3>
            <p className="text-slate-300">
              All {validationReport.total} questions passed integrity validation
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-3">Validation Rules</h3>
          <div className="space-y-2 text-sm text-slate-300">
            <p>✓ LaTeX syntax must be valid (balanced braces, proper delimiters)</p>
            <p>✓ No unicode math symbols (must use LaTeX: $x^2$ not x²)</p>
            <p>✓ No duplication artifacts ($CH_4$CH4 → $CH_4$)</p>
            <p>✓ No "ext" corruption (use \\text&#123;°C&#125; properly)</p>
            <p>✓ All 4 MCQ choices must be distinct</p>
            <p>✓ Correct answer must be A, B, C, or D</p>
            <p>✓ Correct answer choice must exist</p>
            <p>✓ Explanation must be substantive (&gt;20 characters)</p>
          </div>
        </div>
      </div>
    </>
  );
}