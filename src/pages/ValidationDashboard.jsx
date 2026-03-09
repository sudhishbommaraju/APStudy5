import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { QuestionIntegritySystem } from '@/components/validation/QuestionIntegritySystem';
import { AlertCircle, CheckCircle2, RefreshCw, Loader2, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ValidationDashboard() {
  const [user, setUser] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [autoFixing, setAutoFixing] = useState({});

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list('subject_id'),
  });

  const { data: allQuestions = [] } = useQuery({
    queryKey: ['all-questions'],
    queryFn: () => base44.entities.Question.list('-created_date', 1000),
  });

  const runValidation = async () => {
    setIsValidating(true);
    
    const questionsToValidate = selectedSubject === 'all' 
      ? allQuestions 
      : allQuestions.filter(q => q.subject_id === selectedSubject);
    
    const results = QuestionIntegritySystem.validateBulk(questionsToValidate);
    setValidationResults(results);
    setIsValidating(false);
  };

  const handleAutoFix = async (questionId) => {
    setAutoFixing(prev => ({ ...prev, [questionId]: true }));
    
    try {
      const question = allQuestions.find(q => q.id === questionId);
      const validation = QuestionIntegritySystem.validateQuestion(question);
      const fixResult = QuestionIntegritySystem.autoFix(question, validation);
      
      if (fixResult.fixed) {
        await base44.entities.Question.update(questionId, fixResult.updates);
        alert('Question fixed successfully!');
        runValidation(); // Re-run validation
      } else {
        alert(`Cannot auto-fix: ${fixResult.reason}`);
      }
    } catch (e) {
      console.error('Failed to auto-fix:', e);
      alert('Failed to fix question');
    }
    
    setAutoFixing(prev => ({ ...prev, [questionId]: false }));
  };

  const handleDelete = async (questionId) => {
    if (!confirm('Delete this invalid question?')) return;
    
    try {
      await base44.entities.Question.delete(questionId);
      // Audit log
      await base44.functions.invoke('adminAuditLog', {
        action: 'DELETE_INVALID_QUESTION', entity: 'Question', entity_id: questionId
      });
      alert('Question deleted');
      runValidation();
    } catch (e) {
      alert('Failed to delete question');
    }
  };

  const exportReport = () => {
    if (!validationResults) return;
    
    const report = validationResults.results.map(r => ({
      question_id: r.questionId,
      subject: r.subject,
      errors: r.validation.errors.join('; '),
      stored_answer: allQuestions.find(q => q.id === r.questionId)?.correct_answer,
      computed_answer: r.validation.computedAnswer
    }));
    
    const csv = [
      'Question ID,Subject,Errors,Stored Answer,Computed Answer',
      ...report.map(r => `${r.question_id},${r.subject},"${r.errors}",${r.stored_answer},${r.computed_answer || 'N/A'}`)
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation-report-${new Date().toISOString()}.csv`;
    a.click();
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400">Admin access required</p>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Question Validation Dashboard</h1>
        <p className="page-description">
          Validate all questions for integrity and correctness
        </p>
      </div>

      <div className="space-y-6">
        {/* Controls */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-200 mb-2 block">Filter by Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="bg-slate-900/50 border-slate-700/50 text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900/95 border-slate-700/50">
                  <SelectItem value="all" className="text-slate-200">All Subjects</SelectItem>
                  {subjects.map(s => (
                    <SelectItem key={s.subject_id} value={s.subject_id} className="text-slate-200">
                      {s.icon} {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={runValidation}
              disabled={isValidating}
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
          </div>
        </div>

        {/* Results Summary */}
        {validationResults && (
          <>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 text-center">
                <div className="text-3xl font-bold text-slate-100">{validationResults.total}</div>
                <div className="text-sm text-slate-400 mt-1">Total Questions</div>
              </div>
              <div className="bg-emerald-500/10 backdrop-blur-sm rounded-xl border border-emerald-500/30 p-6 text-center">
                <div className="text-3xl font-bold text-emerald-400">{validationResults.valid}</div>
                <div className="text-sm text-emerald-300 mt-1">Valid</div>
              </div>
              <div className="bg-rose-500/10 backdrop-blur-sm rounded-xl border border-rose-500/30 p-6 text-center">
                <div className="text-3xl font-bold text-rose-400">{validationResults.invalid}</div>
                <div className="text-sm text-rose-300 mt-1">Invalid</div>
              </div>
            </div>

            {validationResults.invalid > 0 && (
              <div className="flex justify-end">
                <Button onClick={exportReport} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report (CSV)
                </Button>
              </div>
            )}

            {/* Failed Questions */}
            {validationResults.results.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-100">
                  Invalid Questions ({validationResults.results.length})
                </h3>
                
                {validationResults.results.map((result) => {
                  const question = allQuestions.find(q => q.id === result.questionId);
                  if (!question) return null;
                  
                  return (
                    <div key={result.questionId} className="bg-rose-500/5 rounded-xl border border-rose-500/20 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-5 h-5 text-rose-500" />
                            <span className="font-mono text-sm text-slate-400">{result.questionId}</span>
                          </div>
                          <div className="text-sm text-slate-300 mb-1">
                            <strong>Subject:</strong> {question.subject_id}
                          </div>
                          <div className="text-sm text-slate-300 mb-3">
                            <strong>Unit:</strong> {question.unit_name}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {result.validation.computedAnswer && (
                            <Button
                              onClick={() => handleAutoFix(result.questionId)}
                              disabled={autoFixing[result.questionId]}
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              {autoFixing[result.questionId] ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                'Auto-Fix'
                              )}
                            </Button>
                          )}
                          <Button
                            onClick={() => handleDelete(result.questionId)}
                            size="sm"
                            variant="outline"
                            className="border-rose-300 text-rose-700"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 mb-4">
                        <div className="text-sm text-slate-700 mb-2">
                          <strong>Question:</strong> {question.question_text.slice(0, 150)}...
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>A: {question.choice_a.slice(0, 50)}...</div>
                          <div>B: {question.choice_b.slice(0, 50)}...</div>
                          <div>C: {question.choice_c.slice(0, 50)}...</div>
                          <div>D: {question.choice_d.slice(0, 50)}...</div>
                        </div>
                      </div>
                      
                      {result.validation.computedAnswer && (
                        <div className="bg-amber-50 rounded-lg p-3 mb-3">
                          <div className="text-sm text-amber-900">
                            <strong>Stored Answer:</strong> <span className="font-mono">{question.correct_answer}</span>
                            <br/>
                            <strong>Computed Answer:</strong> <span className="font-mono">{result.validation.computedAnswer}</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="bg-rose-50 rounded-lg p-3">
                        <div className="text-xs font-bold text-rose-800 mb-1">Validation Errors:</div>
                        <ul className="list-disc pl-4 text-xs text-rose-700 space-y-1">
                          {result.validation.errors.map((err, idx) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {validationResults.results.length === 0 && (
              <div className="bg-emerald-500/10 rounded-xl border border-emerald-500/30 p-8 text-center">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-100 mb-2">All Questions Valid!</h3>
                <p className="text-slate-300">
                  {validationResults.total} questions passed integrity validation
                </p>
              </div>
            )}
          </>
        )}

        {!validationResults && (
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-12 text-center">
            <RefreshCw className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-100 mb-2">
              Run Validation to Check Questions
            </h3>
            <p className="text-slate-400 text-sm">
              This will validate all questions for correctness, LaTeX integrity, and answer accuracy
            </p>
          </div>
        )}
      </div>
    </>
  );
}