import React, { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Loader2,
  Sparkles,
  Check,
  RotateCw,
  AlertCircle,
  Trophy,
  Target,
  Youtube,
  Upload,
  Type,
  FileText,
  X,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { base44, fetchYoutubeTranscript } from '@/api/base44Client';
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

const SOURCES = [
  { id: 'topic', label: 'By topic', icon: Target },
  { id: 'youtube', label: 'YouTube', icon: Youtube },
  { id: 'file', label: 'Upload', icon: Upload },
  { id: 'text', label: 'Paste text', icon: Type },
];

export default function Practice() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState('topic');
  const [subjectId, setSubjectId] = useState(params.get('subject') || AP_SUBJECTS[0].id);
  const [unit, setUnit] = useState(params.get('unit') || '');
  const [count, setCount] = useState(5);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [file, setFile] = useState(null);
  const [pasteText, setPasteText] = useState('');
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState('');
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState(null);
  const [answers, setAnswers] = useState({});
  const [sourceLabel, setSourceLabel] = useState('');
  const fileInput = useRef(null);

  const subject = useMemo(() => AP_SUBJECTS.find((s) => s.id === subjectId) || AP_SUBJECTS[0], [subjectId]);

  // Pull raw study material from whichever source the user picked.
  async function gatherSource() {
    if (mode === 'youtube') {
      if (!youtubeUrl.trim()) throw new Error('Paste a YouTube link first.');
      setStage('Fetching transcript…');
      const res = await fetchYoutubeTranscript(youtubeUrl.trim());
      if (!res || res.status !== 'success' || !res.transcript) {
        throw new Error(res?.error || 'Could not fetch the transcript for that video.');
      }
      return { content: res.transcript, label: 'YouTube video' };
    }
    if (mode === 'file') {
      if (!file) throw new Error('Choose a file to upload first.');
      setStage('Uploading file…');
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setStage('Extracting text…');
      const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({ file_url });
      const out = extracted?.output || extracted?.text || '';
      if (!out || !String(out).trim()) throw new Error('No readable text found in that file.');
      return { content: String(out), label: file.name };
    }
    if (mode === 'text') {
      if (!pasteText.trim()) throw new Error('Paste some notes or text first.');
      return { content: pasteText.trim(), label: 'Your notes' };
    }
    return { content: '', label: subject.subject };
  }

  async function start() {
    setError('');
    setBusy(true);
    setAnswers({});
    try {
      const { content, label } = await gatherSource();
      setStage('Writing questions…');
      const lines = [
        content
          ? `Generate ${count} AP-style multiple-choice questions based strictly on the study material below.`
          : `Generate ${count} AP-style multiple-choice questions for "${subject.subject}"${
              unit ? `, focused on "${unit}"` : ''
            }.`,
        `Each question must have exactly 4 options, a correct answer_index (0-3), and a concise explanation.`,
        `Wrap EVERY formula, symbol, or expression in $...$ (inline) or $$...$$ (display) — including inside each answer option. Do NOT use \\( \\) or \\[ \\] delimiters. Vary difficulty like a real AP exam.`,
      ];
      if (content) lines.push(`\nSTUDY MATERIAL:\n${content.slice(0, 6000)}`);
      const data = await base44.integrations.Core.InvokeLLM({
        prompt: lines.join('\n'),
        response_json_schema: SCHEMA,
      });
      const qs = Array.isArray(data?.questions) ? data.questions : [];
      if (qs.length === 0) throw new Error('No questions were generated. Try again, or check your API key.');
      setSourceLabel(label);
      setQuestions(qs);
    } catch (e) {
      setError(e.message || 'Could not generate questions.');
    } finally {
      setBusy(false);
      setStage('');
    }
  }

  async function answer(qi, oi) {
    if (answers[qi] !== undefined) return;
    setAnswers((a) => ({ ...a, [qi]: oi }));
    const correct = oi === questions[qi].answer_index;
    try {
      await base44.entities.Attempt.create({
        subject: mode === 'topic' ? subject.subject : sourceLabel,
        subject_id: mode === 'topic' ? subject.id : mode,
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

  /* ---------------- Quiz view ---------------- */
  if (questions) {
    const done = answeredCount === questions.length;
    return (
      <AppShell title="Practice" subtitle={sourceLabel + (unit ? ` · ${unit}` : '')}>
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
                    if (revealed && correct) cls = 'border-emerald-400/60 bg-emerald-500/10';
                    else if (revealed && chosen && !correct) cls = 'border-red-400/60 bg-red-500/10';
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
                        {revealed && correct && <Check className="ml-auto h-4 w-4 shrink-0 text-emerald-400" />}
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

  /* ---------------- Setup view ---------------- */
  return (
    <AppShell title="Practice" subtitle="Multiple-choice questions from any source, with instant feedback.">
      <div className="mx-auto max-w-2xl">
        <div className="card-elevated p-6">
          {/* Source selector */}
          <p className="text-sm font-semibold text-foreground">Where should the questions come from?</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SOURCES.map((s) => {
              const active = mode === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setMode(s.id);
                    setError('');
                  }}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 text-sm font-semibold transition-all ${
                    active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  <s.icon className="h-5 w-5" />
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Source-specific input */}
          <div className="mt-5 space-y-4">
            {mode === 'topic' && (
              <>
                <SubjectPicker
                  value={subjectId}
                  onChange={(id) => {
                    setSubjectId(id);
                    setUnit('');
                  }}
                />
                <UnitPicker subject={subject} value={unit} onChange={setUnit} defaultLabel="Mixed — all units" />
              </>
            )}

            {mode === 'youtube' && (
              <div>
                <label className="block text-sm font-semibold text-foreground">YouTube link</label>
                <input
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=…"
                  className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  We pull the transcript and write questions from the lecture.
                </p>
              </div>
            )}

            {mode === 'file' && (
              <div>
                <label className="block text-sm font-semibold text-foreground">Upload a file</label>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                {file ? (
                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="flex-1 truncate text-sm text-foreground">{file.name}</span>
                    <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInput.current?.click()}
                    className="mt-2 flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card px-4 py-8 text-sm text-muted-foreground transition-colors hover:border-primary/50"
                  >
                    <Upload className="h-6 w-6" />
                    Click to upload a PDF, doc, or slides
                  </button>
                )}
              </div>
            )}

            {mode === 'text' && (
              <div>
                <label className="block text-sm font-semibold text-foreground">Paste your notes</label>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={6}
                  placeholder="Paste notes, an article, or anything you want to be quizzed on…"
                  className="mt-2 w-full resize-y rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
            )}
          </div>

          {/* Question count */}
          <label className="mt-5 block text-sm font-semibold text-foreground">Number of questions</label>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {[5, 10, 15, 20].map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={[
                  'rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all',
                  count === n
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40',
                ].join(' ')}
              >
                {n}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
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
                <Loader2 className="h-4 w-4 animate-spin" /> {stage || 'Generating…'}
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
