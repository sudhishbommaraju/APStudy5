import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Dumbbell, Loader2, Sparkles, Check, RotateCw, AlertCircle, Trophy } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { base44 } from '@/api/base44Client';
import { AP_SUBJECTS } from '@/components/studyhub/AP_SUBJECTS';
import MathRenderer from '@/components/ui/MathRenderer';
import { SubjectPicker, UnitPicker } from '@/components/studyhub/SubjectPicker';

const SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          answer_index: { type: 'integer' },
          explanation: { type: 'string' },
        },
      },
    },
  },
};

export default function Practice() {
  const [params] = useSearchParams();
  const [subjectId, setSubjectId] = useState(params.get('subject') || AP_SUBJECTS[0].id);
  const [unit, setUnit] = useState(params.get('unit') || '');
  const [count, setCount] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState(null);
  const [answers, setAnswers] = useState({});

  const subject = useMemo(() => AP_SUBJECTS.find((s) => s.id === subjectId) || AP_SUBJECTS[0], [subjectId]);

  async function start() {
    setError('');
    setBusy(true);
    setAnswers({});
    try {
      const prompt = [
        `Generate ${count} AP-style multiple-choice questions for "${subject.subject}"${
          unit ? `, focused on "${unit}"` : ''
        }.`,
        `Each question must have exactly 4 options, a correct answer_index (0-3), and a concise explanation.`,
        `Use LaTeX for all math. Vary difficulty like a real AP exam.`,
      ].join('\n');
      const data = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: SCHEMA });
      const qs = Array.isArray(data?.questions) ? data.questions : [];
      if (qs.length === 0) throw new Error('No questions were generated. Add your API key, or try again.');
      setQuestions(qs);
    } catch (e) {
      setError(e.message || 'Could not generate questions.');
    } finally {
      setBusy(false);
    }
  }

  async function answer(qi, oi) {
    if (answers[qi] !== undefined) return;
    setAnswers((a) => ({ ...a, [qi]: oi }));
    const correct = oi === questions[qi].answer_index;
    try {
      await base44.entities.Attempt.create({
        subject: subject.subject,
        subject_id: subject.id,
        unit,
        correct,
      });
    } catch {
      /* best effort */
    }
  }

  const answeredCount = Object.keys(answers).length;
  const score = questions
    ? Object.entries(answers).filter(([qi, oi]) => oi === questions[qi].answer_index).length
    : 0;

  if (questions) {
    const done = answeredCount === questions.length;
    return (
      <AppShell title="Practice" subtitle={subject.subject + (unit ? ` · ${unit}` : '')}>
        <div className="mb-5 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold">
            <Trophy className="h-4 w-4 text-primary" />
            Score: {score}/{questions.length}
          </div>
          <button
            onClick={() => {
              setQuestions(null);
              setError('');
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-secondary"
          >
            <RotateCw className="h-4 w-4" /> New set
          </button>
        </div>

        {done && (
          <div className="mb-5 card-elevated flex items-center gap-4 p-5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient text-white shadow-brand">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display text-lg font-bold text-foreground">
                {Math.round((score / questions.length) * 100)}% correct
              </p>
              <p className="text-sm text-muted-foreground">
                {score} of {questions.length} right. Nice work — keep the streak going.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {questions.map((q, qi) => {
            const picked = answers[qi];
            const revealed = picked !== undefined;
            return (
              <div key={qi} className="card-elevated p-5">
                <p className="mb-3 font-semibold text-foreground">
                  <span className="mr-2 text-primary">Q{qi + 1}.</span>
                  <MathRenderer text={q.question} />
                </p>
                <div className="space-y-2">
                  {(q.options || []).map((opt, oi) => {
                    const correct = oi === q.answer_index;
                    const chosen = picked === oi;
                    let cls = 'border-border bg-card hover:border-primary/40';
                    if (revealed && correct) cls = 'border-emerald-400 bg-emerald-50';
                    else if (revealed && chosen && !correct) cls = 'border-red-400 bg-red-50';
                    return (
                      <button
                        key={oi}
                        disabled={revealed}
                        onClick={() => answer(qi, oi)}
                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${cls}`}
                      >
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-secondary text-xs font-bold text-foreground/70">
                          {String.fromCharCode(65 + oi)}
                        </span>
                        <span className="text-foreground">
                          <MathRenderer text={opt} />
                        </span>
                        {revealed && correct && <Check className="ml-auto h-4 w-4 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
                {revealed && q.explanation && (
                  <div className="mt-3 rounded-xl bg-secondary/50 p-3 text-sm text-foreground/80">
                    <span className="font-semibold text-foreground">Explanation: </span>
                    <MathRenderer text={q.explanation} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Practice" subtitle="AI-generated AP questions with instant feedback.">
      <div className="mx-auto max-w-xl">
        <div className="card-elevated p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-gradient text-white shadow-brand">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg font-bold text-foreground">New practice set</p>
              <p className="text-sm text-muted-foreground">Pick a subject and difficulty.</p>
            </div>
          </div>

          <div className="space-y-4">
            <SubjectPicker
              value={subjectId}
              onChange={(id) => {
                setSubjectId(id);
                setUnit('');
              }}
            />
            <UnitPicker subject={subject} value={unit} onChange={setUnit} defaultLabel="Mixed — all units" />
          </div>

          <label className="mt-4 block text-sm font-semibold text-foreground">Number of questions</label>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {[5, 10, 15, 20].map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={[
                  'rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all',
                  count === n ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card text-muted-foreground hover:border-primary/40',
                ].join(' ')}
              >
                {n}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={start}
            disabled={busy}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 py-3.5 text-sm font-bold text-white shadow-brand transition-transform hover:scale-[1.02] disabled:opacity-70"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Start practice
              </>
            )}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
