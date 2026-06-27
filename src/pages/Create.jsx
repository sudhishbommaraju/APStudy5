import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Upload,
  Youtube,
  FileText,
  Sparkles,
  Wand2,
  Loader2,
  NotebookPen,
  Layers,
  Dumbbell,
  Download,
  Check,
  RotateCw,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { base44, fetchYoutubeTranscript } from '@/api/base44Client';
import { AP_SUBJECTS } from '@/components/studyhub/AP_SUBJECTS';
import NotesRenderer from '@/components/studyhub/NotesRenderer';
import MathRenderer from '@/components/ui/MathRenderer';
import { SubjectPicker, UnitPicker } from '@/components/studyhub/SubjectPicker';
import { markdownToLatex, downloadText } from '@/utils/texExport';

const SOURCE_TABS = [
  { key: 'topic', label: 'Topic', icon: Wand2 },
  { key: 'upload', label: 'Upload', icon: Upload },
  { key: 'youtube', label: 'YouTube', icon: Youtube },
  { key: 'text', label: 'Paste text', icon: FileText },
];

// Dashboard "create" cards link with ?source=… — map those to a tab.
const SOURCE_PARAM_TO_TAB = { topic: 'topic', file: 'upload', upload: 'upload', youtube: 'youtube', text: 'text' };

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    summary: { type: 'string' },
    notes: { type: 'string', description: 'Full study notes in Markdown with LaTeX math in $...$ and $$...$$' },
    flashcards: {
      type: 'array',
      items: {
        type: 'object',
        properties: { front: { type: 'string' }, back: { type: 'string' } },
      },
    },
    practice: {
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

// Replace {{IMAGE: prompt :: caption}} placeholders with generated images.
async function embedImages(md) {
  const re = /\{\{IMAGE:\s*([\s\S]*?)\s*::\s*([\s\S]*?)\}\}/g;
  const matches = [...md.matchAll(re)].slice(0, 2);
  let out = md;
  for (const m of matches) {
    const [full, imgPrompt, caption] = m;
    try {
      const { url } = await base44.integrations.Core.GenerateImage({ prompt: imgPrompt.trim() });
      out = url
        ? out.replace(full, `\n\n![${caption.trim().replace(/[[\]]/g, '')}](${url})\n\n`)
        : out.replace(full, '');
    } catch {
      out = out.replace(full, '');
    }
  }
  return out.replace(/\{\{IMAGE:[\s\S]*?\}\}/g, '');
}

function Toggle({ active, onClick, icon: Icon, label, desc }) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-start gap-3 rounded-xl border p-4 text-left transition-all',
        active ? 'border-primary bg-primary/5 shadow-soft' : 'border-border bg-card hover:border-primary/40',
      ].join(' ')}
    >
      <div
        className={[
          'mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg',
          active ? 'bg-brand-gradient text-white' : 'bg-secondary text-muted-foreground',
        ].join(' ')}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <div
        className={[
          'mt-1 grid h-5 w-5 place-items-center rounded-md border',
          active ? 'border-primary bg-primary text-white' : 'border-border',
        ].join(' ')}
      >
        {active && <Check className="h-3.5 w-3.5" />}
      </div>
    </button>
  );
}

export default function Create() {
  const [params] = useSearchParams();
  const [tab, setTab] = useState(
    params.get('tab') || SOURCE_PARAM_TO_TAB[params.get('source')] || 'topic'
  );
  const [subjectId, setSubjectId] = useState(params.get('subject') || AP_SUBJECTS[0].id);
  const [unit, setUnit] = useState(params.get('unit') || '');
  const [topic, setTopic] = useState('');
  const [text, setText] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [file, setFile] = useState(null);
  const [want, setWant] = useState({ notes: true, flashcards: true, practice: true, images: true });

  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [resultTab, setResultTab] = useState('notes');
  const [flipped, setFlipped] = useState({});
  const fileInputRef = useRef(null);

  const subject = useMemo(() => AP_SUBJECTS.find((s) => s.id === subjectId) || AP_SUBJECTS[0], [subjectId]);

  const toggleWant = (k) => setWant((w) => ({ ...w, [k]: !w[k] }));

  async function getSourceText() {
    if (tab === 'text') {
      if (!text.trim()) throw new Error('Please paste some text to generate from.');
      return text.trim();
    }
    if (tab === 'youtube') {
      if (!youtubeUrl.trim()) throw new Error('Please paste a YouTube link.');
      setStage('Fetching transcript…');
      const res = await fetchYoutubeTranscript(youtubeUrl.trim());
      if (!res || res.status !== 'success' || !res.transcript) {
        throw new Error(res?.error || 'Could not fetch the transcript for that video.');
      }
      return res.transcript;
    }
    // upload
    if (!file) throw new Error('Please choose a file to upload.');
    setStage('Uploading file…');
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setStage('Extracting text…');
    const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({ file_url });
    const out = extracted?.output || extracted?.text || '';
    if (!out || !String(out).trim()) throw new Error('No readable text found in that file.');
    return String(out);
  }

  async function handleGenerate() {
    setError('');
    setResult(null);
    setBusy(true);
    try {
      const fromTopic = tab === 'topic';
      const source = fromTopic ? '' : await getSourceText();
      const trimmed = source.slice(0, 12000);
      const wanted = Object.entries(want).filter(([, v]) => v).map(([k]) => k);
      if (wanted.length === 0) throw new Error('Pick at least one thing to generate.');

      setStage('Generating with AI…');
      const lines = [
        fromTopic
          ? `You are an expert AP teacher. Using your own expert knowledge (no source document is provided), create AP study materials for "${subject.subject}"${
              unit ? `, unit "${unit}"` : ''
            }${topic.trim() ? `, focused specifically on: "${topic.trim()}"` : ''}.`
          : `You are creating AP study materials for "${subject.subject}"${
              unit ? `, focused on "${unit}"` : ''
            }. From the SOURCE MATERIAL below, produce the requested study artifacts.`,
        ``,
        `Requested: ${wanted.join(', ')}.`,
        want.notes
          ? `- notes: comprehensive, well-structured Markdown study notes. Use ## headings (with a relevant emoji at the start of each heading), bullet points, **bold** key terms, and Markdown tables to compare/contrast concepts. Render ALL math/science notation in LaTeX with $...$ (inline) and $$...$$ (display).`
          : `- notes: return an empty string.`,
        want.notes && want.images
          ? `  In the notes, where a labeled diagram would genuinely aid understanding, insert AT MOST 2 image placeholders, each on its OWN line, in this EXACT format: {{IMAGE: <a SPECIFIC, detailed description of exactly what the diagram should show, including the key parts/labels to draw> :: <short caption>}}. Be concrete and subject-specific (e.g. "a labeled cross-section of a prokaryotic cell showing the cell wall, plasma membrane, cytoplasm, nucleoid, ribosomes, and flagellum"), NOT generic. Only for genuinely visual concepts (structures, cycles, processes) — never for plain text or equations.`
          : ``,
        want.flashcards
          ? `- flashcards: 10-15 high-yield Q/A flashcards. Use LaTeX for any math.`
          : `- flashcards: return an empty array.`,
        want.practice
          ? `- practice: 6-8 multiple-choice questions, each with exactly 4 options, the correct answer_index (0-3), and a clear explanation. Use LaTeX for any math.`
          : `- practice: return an empty array.`,
        ``,
        `Also include a short "title" and one-sentence "summary".`,
      ];
      if (!fromTopic) lines.push('', 'SOURCE MATERIAL:', trimmed);
      const prompt = lines.join('\n');

      const data = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: OUTPUT_SCHEMA,
      });

      let notesText = data?.notes || '';
      if (notesText) {
        if (want.images && /\{\{IMAGE:/.test(notesText)) {
          setStage('Drawing diagrams…');
          notesText = await embedImages(notesText);
        } else {
          notesText = notesText.replace(/\{\{IMAGE:[\s\S]*?\}\}/g, '');
        }
      }

      const normalized = {
        title: data?.title || `${subject.subject} — Study Set`,
        summary: data?.summary || '',
        notes: notesText,
        flashcards: Array.isArray(data?.flashcards) ? data.flashcards : [],
        practice: Array.isArray(data?.practice) ? data.practice : [],
        demo: typeof data === 'object' && JSON.stringify(data).includes('DEMO MODE'),
      };

      setStage('Saving…');
      await persist(normalized);

      setResult(normalized);
      setResultTab(want.notes ? 'notes' : want.flashcards ? 'flashcards' : 'practice');
    } catch (e) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setBusy(false);
      setStage('');
    }
  }

  async function persist(r) {
    try {
      if (r.notes) {
        await base44.entities.StudyNote.create({
          title: r.title,
          subject: subject.subject,
          subject_id: subject.id,
          unit,
          content: r.notes,
          format: 'markdown-latex',
          source: tab,
          folder_id: params.get('folder') || '',
        });
      }
      if (r.flashcards.length) {
        const deck = await base44.entities.FlashcardDeck.create({
          name: r.title,
          subject: subject.subject,
          subject_id: subject.id,
        });
        await base44.entities.Flashcard.bulkCreate(
          r.flashcards.map((c) => ({
            deck_id: deck.id,
            front: c.front,
            back: c.back,
            subject: subject.subject,
          }))
        );
      }
      if (r.practice.length) {
        await base44.entities.PracticeQuestion.bulkCreate(
          r.practice.map((q) => ({
            subject: subject.subject,
            subject_id: subject.id,
            unit,
            question: q.question,
            options: q.options,
            answer_index: q.answer_index,
            explanation: q.explanation,
          }))
        );
      }
    } catch {
      /* persistence is best-effort; results still show */
    }
  }

  function reset() {
    setResult(null);
    setError('');
  }

  // ---------- RESULTS VIEW ----------
  if (result) {
    return (
      <AppShell title={result.title} subtitle={subject.subject + (unit ? ` · ${unit}` : '')}>
        {result.demo && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Demo mode</p>
              <p>
                Add your <code className="font-mono">ANTHROPIC_API_KEY</code> to{' '}
                <code className="font-mono">.env</code> for real AI-generated study sets.
              </p>
            </div>
          </div>
        )}

        <div className="mb-5 flex flex-wrap items-center gap-2">
          {result.notes && (
            <TabBtn active={resultTab === 'notes'} onClick={() => setResultTab('notes')} icon={NotebookPen}>
              Notes
            </TabBtn>
          )}
          {result.flashcards.length > 0 && (
            <TabBtn active={resultTab === 'flashcards'} onClick={() => setResultTab('flashcards')} icon={Layers}>
              Flashcards ({result.flashcards.length})
            </TabBtn>
          )}
          {result.practice.length > 0 && (
            <TabBtn active={resultTab === 'practice'} onClick={() => setResultTab('practice')} icon={Dumbbell}>
              Practice ({result.practice.length})
            </TabBtn>
          )}
          <div className="ml-auto flex gap-2">
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-secondary"
            >
              <RotateCw className="h-4 w-4" /> New
            </button>
          </div>
        </div>

        {resultTab === 'notes' && result.notes && (
          <div className="card-elevated p-6 sm:p-8">
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={() =>
                  downloadText(
                    `${result.title.replace(/[^a-z0-9]+/gi, '_')}.tex`,
                    markdownToLatex(result.notes, { title: result.title, subject: subject.subject }),
                    'application/x-tex'
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-gradient px-3 py-2 text-sm font-semibold text-white shadow-brand"
              >
                <Download className="h-4 w-4" /> Download .tex
              </button>
              <button
                onClick={() => downloadText(`${result.title.replace(/[^a-z0-9]+/gi, '_')}.md`, result.notes, 'text/markdown')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-secondary"
              >
                <Download className="h-4 w-4" /> Markdown
              </button>
            </div>
            <NotesRenderer content={result.notes} />
          </div>
        )}

        {resultTab === 'flashcards' && (
          <div className="grid gap-3 sm:grid-cols-2">
            {result.flashcards.map((c, i) => (
              <button
                key={i}
                onClick={() => setFlipped((f) => ({ ...f, [i]: !f[i] }))}
                className="card-elevated min-h-[140px] p-5 text-left transition-transform hover:scale-[1.01]"
              >
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  {flipped[i] ? 'Answer' : 'Question'} · {i + 1}
                </p>
                <div className="text-foreground">
                  <MathRenderer text={flipped[i] ? c.back : c.front} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Tap to flip</p>
              </button>
            ))}
          </div>
        )}

        {resultTab === 'practice' && (
          <div className="space-y-4">
            {result.practice.map((q, i) => (
              <PracticeCard key={i} q={q} index={i} />
            ))}
          </div>
        )}
      </AppShell>
    );
  }

  // ---------- BUILDER VIEW ----------
  return (
    <AppShell title="Create a study set" subtitle="Pick a topic, upload, paste, or link — get notes, flashcards, and practice.">
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: source */}
        <div className="space-y-5 lg:col-span-3">
          <div className="card-elevated p-2">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {SOURCE_TABS.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={[
                      'flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all',
                      tab === t.key ? 'bg-brand-gradient text-white shadow-brand' : 'text-muted-foreground hover:bg-secondary',
                    ].join(' ')}
                  >
                    <Icon className="h-4 w-4" /> {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card-elevated p-5">
            {tab === 'topic' && (
              <div>
                <label className="text-sm font-semibold text-foreground">What should it cover?</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={6}
                  placeholder={`e.g. "Limits and continuity", "causes of the French Revolution", or leave blank for a full ${subject.subject} overview`}
                  className="mt-2 w-full resize-none rounded-xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Proofly writes the notes, flashcards, and practice from scratch with AI — no upload needed.
                </p>
              </div>
            )}

            {tab === 'upload' && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/30 px-6 py-12 text-center transition-colors hover:border-primary/50"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.txt,.md,.csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient text-white shadow-brand">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="mt-4 font-semibold text-foreground">
                  {file ? file.name : 'Drop a PDF, DOCX, or TXT'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {file ? 'Click to choose a different file' : 'or click to browse'}
                </p>
              </div>
            )}

            {tab === 'youtube' && (
              <div>
                <label className="text-sm font-semibold text-foreground">YouTube URL</label>
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-card px-3 focus-within:border-primary">
                  <Youtube className="h-5 w-5 text-red-500" />
                  <input
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=…"
                    className="w-full bg-transparent py-3 text-sm outline-none"
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  The video needs captions available. We pull the transcript automatically.
                </p>
              </div>
            )}

            {tab === 'text' && (
              <div>
                <label className="text-sm font-semibold text-foreground">Paste your material</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={10}
                  placeholder="Paste lecture notes, a textbook section, an article…"
                  className="mt-2 w-full resize-none rounded-xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: config */}
        <div className="space-y-5 lg:col-span-2">
          <div className="card-elevated space-y-4 p-5">
            <SubjectPicker
              value={subjectId}
              onChange={(id) => {
                setSubjectId(id);
                setUnit('');
              }}
            />
            <UnitPicker subject={subject} value={unit} onChange={setUnit} />
          </div>

          <div className="space-y-2.5">
            <Toggle active={want.notes} onClick={() => toggleWant('notes')} icon={NotebookPen} label="Notes" desc="Structured notes in LaTeX" />
            <Toggle active={want.images} onClick={() => toggleWant('images')} icon={ImageIcon} label="AI diagrams" desc="Illustrations inside your notes" />
            <Toggle active={want.flashcards} onClick={() => toggleWant('flashcards')} icon={Layers} label="Flashcards" desc="High-yield Q/A cards" />
            <Toggle active={want.practice} onClick={() => toggleWant('practice')} icon={Dumbbell} label="Practice" desc="MCQs with explanations" />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 py-3.5 text-sm font-bold text-white shadow-brand transition-transform hover:scale-[1.02] disabled:opacity-70"
          >
            {busy ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" /> {stage || 'Working…'}
              </>
            ) : (
              <>
                <Sparkles className="h-4.5 w-4.5" /> Generate study set
              </>
            )}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Powered by your own AI key · all math in LaTeX
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function TabBtn({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all',
        active ? 'bg-brand-gradient text-white shadow-brand' : 'border border-border bg-card text-muted-foreground hover:bg-secondary',
      ].join(' ')}
    >
      <Icon className="h-4 w-4" /> {children}
    </button>
  );
}

function PracticeCard({ q, index }) {
  const [picked, setPicked] = useState(null);
  const revealed = picked !== null;
  return (
    <div className="card-elevated p-5">
      <p className="mb-3 font-semibold text-foreground">
        <span className="mr-2 text-primary">Q{index + 1}.</span>
        <MathRenderer text={q.question} />
      </p>
      <div className="space-y-2">
        {(q.options || []).map((opt, i) => {
          const correct = i === q.answer_index;
          const chosen = picked === i;
          let cls = 'border-border bg-card hover:border-primary/40';
          if (revealed && correct) cls = 'border-emerald-400 bg-emerald-50';
          else if (revealed && chosen && !correct) cls = 'border-red-400 bg-red-50';
          return (
            <button
              key={i}
              disabled={revealed}
              onClick={() => setPicked(i)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${cls}`}
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-secondary text-xs font-bold text-foreground/70">
                {String.fromCharCode(65 + i)}
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
}
