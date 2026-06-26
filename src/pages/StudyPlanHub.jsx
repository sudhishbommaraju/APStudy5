import React, { useMemo, useState } from 'react';
import { CalendarRange, Loader2, Sparkles, AlertCircle, RotateCw, CheckCircle2 } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { base44 } from '@/api/base44Client';
import { AP_SUBJECTS } from '@/components/studyhub/AP_SUBJECTS';
import MathRenderer from '@/components/ui/MathRenderer';
import { SubjectPicker } from '@/components/studyhub/SubjectPicker';

const SCHEMA = {
  type: 'object',
  properties: {
    overview: { type: 'string' },
    sessions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          focus: { type: 'string' },
          tasks: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
};

export default function StudyPlanHub() {
  const [subjectId, setSubjectId] = useState(AP_SUBJECTS[0].id);
  const [weeks, setWeeks] = useState(4);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState(null);
  const [done, setDone] = useState({});

  const subject = useMemo(() => AP_SUBJECTS.find((s) => s.id === subjectId) || AP_SUBJECTS[0], [subjectId]);

  async function generate() {
    setError('');
    setBusy(true);
    try {
      const prompt = [
        `Create a ${weeks}-week study plan for "${subject.subject}" to prepare for the AP exam.`,
        `The course units are: ${subject.units.map((u) => u.name).join('; ')}.`,
        `Return a short "overview" and a list of "sessions" (about ${weeks * 2} sessions).`,
        `Each session has a "title" (e.g. "Week 1 · Session 1"), a "focus" (the unit/topic), and 2-4 concrete "tasks".`,
        `Use LaTeX for any math.`,
      ].join('\n');
      const data = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: SCHEMA });
      const sessions = Array.isArray(data?.sessions) ? data.sessions : [];
      if (sessions.length === 0) throw new Error('No plan was generated. Add your API key, or try again.');
      setPlan({ overview: data.overview || '', sessions });
      setDone({});
      try {
        await base44.entities.StudyPlan.create({
          subject: subject.subject,
          subject_id: subject.id,
          weeks,
          overview: data.overview || '',
          sessions,
        });
      } catch {
        /* best effort */
      }
    } catch (e) {
      setError(e.message || 'Could not generate a plan.');
    } finally {
      setBusy(false);
    }
  }

  if (plan) {
    const total = plan.sessions.length;
    const completed = Object.values(done).filter(Boolean).length;
    return (
      <AppShell title="Study plan" subtitle={subject.subject}>
        <div className="mb-5 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            {completed}/{total} sessions done
          </div>
          <button
            onClick={() => setPlan(null)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-secondary"
          >
            <RotateCw className="h-4 w-4" /> New plan
          </button>
        </div>

        {plan.overview && (
          <div className="mb-5 card-elevated p-5 text-sm text-foreground/80">
            <MathRenderer text={plan.overview} />
          </div>
        )}

        <div className="space-y-3">
          {plan.sessions.map((s, i) => (
            <div key={i} className="card-elevated p-5">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))}
                  className={[
                    'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border transition-colors',
                    done[i] ? 'border-primary bg-primary text-white' : 'border-border',
                  ].join(' ')}
                >
                  {done[i] && <CheckCircle2 className="h-4 w-4" />}
                </button>
                <div className="flex-1">
                  <p className={`font-semibold ${done[i] ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {s.title}
                  </p>
                  {s.focus && (
                    <p className="text-sm text-primary">
                      <MathRenderer text={s.focus} />
                    </p>
                  )}
                  {Array.isArray(s.tasks) && (
                    <ul className="mt-2 ml-4 list-disc space-y-1 text-sm text-foreground/80">
                      {s.tasks.map((t, j) => (
                        <li key={j}>
                          <MathRenderer text={t} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Study plan" subtitle="A personalized roadmap to exam day.">
      <div className="mx-auto max-w-xl">
        <div className="card-elevated p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-gradient text-white shadow-brand">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg font-bold text-foreground">Build a study plan</p>
              <p className="text-sm text-muted-foreground">Tailored to your subject and timeline.</p>
            </div>
          </div>

          <SubjectPicker value={subjectId} onChange={setSubjectId} />

          <label className="mt-4 block text-sm font-semibold text-foreground">Weeks until exam</label>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {[2, 4, 6, 8].map((n) => (
              <button
                key={n}
                onClick={() => setWeeks(n)}
                className={[
                  'rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all',
                  weeks === n ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card text-muted-foreground hover:border-primary/40',
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
            onClick={generate}
            disabled={busy}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 py-3.5 text-sm font-bold text-white shadow-brand transition-transform hover:scale-[1.02] disabled:opacity-70"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generate plan
              </>
            )}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
