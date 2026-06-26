import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  NotebookPen,
  Layers,
  Dumbbell,
  Upload,
  Sparkles,
  ChevronRight,
  ChevronDown,
  FileText,
  Clock,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { base44 } from '@/api/base44Client';
import { getSubjectById } from '@/components/studyhub/AP_SUBJECTS';

function timeAgo(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function StudySubject() {
  const { subjectId } = useParams();
  const subject = getSubjectById(subjectId);
  const [notes, setNotes] = useState([]);
  const [openUnit, setOpenUnit] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const rows = await base44.entities.StudyNote.filter({ subject_id: subjectId }, '-created_date');
        setNotes(Array.isArray(rows) ? rows : []);
      } catch {
        setNotes([]);
      }
    })();
  }, [subjectId]);

  if (!subject) {
    return (
      <AppShell title="Subject not found">
        <Link to="/welcome" className="text-primary hover:underline">
          ← Back to subjects
        </Link>
      </AppShell>
    );
  }

  const enc = (u) => encodeURIComponent(u);
  const actions = [
    { label: 'Generate notes', icon: NotebookPen, tint: 'bg-blue-500/15 text-blue-300', to: `/Create?subject=${subjectId}&tab=text` },
    { label: 'Upload material', icon: Upload, tint: 'bg-indigo-500/15 text-indigo-300', to: `/Create?subject=${subjectId}&tab=upload` },
    { label: 'Flashcards', icon: Layers, tint: 'bg-sky-500/15 text-sky-300', to: `/Create?subject=${subjectId}&tab=text` },
    { label: 'Take a quiz', icon: Dumbbell, tint: 'bg-emerald-500/15 text-emerald-300', to: `/Practice?subject=${subjectId}` },
  ];

  return (
    <AppShell title={subject.subject} subtitle={`${subject.units.length} units · ${notes.length} of your materials`}>
      <Link
        to="/welcome"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All subjects
      </Link>

      {/* Quick actions */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-foreground">Start studying</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.label}
                to={a.to}
                className="group card-elevated flex flex-col gap-3 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50"
              >
                <div className={`grid h-11 w-11 place-items-center rounded-xl ${a.tint}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-foreground group-hover:text-primary">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Units */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-foreground">Units &amp; topics</h2>
        <div className="space-y-2.5">
          {subject.units.map((u, i) => {
            const open = openUnit === i;
            return (
              <div key={u.name} className="card-elevated overflow-hidden">
                <button
                  onClick={() => setOpenUnit(open ? null : i)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-sm font-bold text-primary">
                    {i + 1}
                  </div>
                  <span className="flex-1 font-medium text-foreground">{u.name}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                  <div className="border-t border-border px-4 py-4">
                    {u.topics?.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-1.5">
                        {u.topics.map((t) => (
                          <span key={t} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/Create?subject=${subjectId}&unit=${enc(u.name)}&tab=text`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-gradient px-3 py-2 text-sm font-semibold text-white shadow-brand"
                      >
                        <Sparkles className="h-4 w-4" /> Generate notes
                      </Link>
                      <Link
                        to={`/Practice?subject=${subjectId}&unit=${enc(u.name)}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                      >
                        <Dumbbell className="h-4 w-4" /> Quiz this unit
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Materials */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-foreground">Your materials</h2>
        {notes.length === 0 ? (
          <div className="card-elevated flex flex-col items-center p-10 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-3 font-semibold text-foreground">Nothing here yet</p>
            <p className="text-sm text-muted-foreground">Generate your first {subject.subject} study set above.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notes.map((n) => (
              <Link
                key={n.id}
                to={`/Notes?id=${n.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500/15 text-blue-300">
                  <NotebookPen className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground group-hover:text-primary">
                    {n.title || 'Untitled note'}
                  </p>
                  <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    {n.unit || subject.subject} <span className="opacity-40">·</span>
                    <Clock className="h-3 w-3" /> {timeAgo(n.created_date)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
