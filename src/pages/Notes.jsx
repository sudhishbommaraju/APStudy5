import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { NotebookPen, Sparkles, Download, ArrowLeft, Clock, Trash2 } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { base44 } from '@/api/base44Client';
import NotesRenderer from '@/components/studyhub/NotesRenderer';
import { markdownToLatex, downloadText } from '@/utils/texExport';

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [params] = useSearchParams();

  async function load() {
    setLoading(true);
    try {
      const rows = await base44.entities.StudyNote.list('-created_date', 200);
      const list = Array.isArray(rows) ? rows : [];
      setNotes(list);
      const openId = params.get('id');
      if (openId) {
        const match = list.find((n) => n.id === openId);
        if (match) setActive(match);
      }
    } catch {
      setNotes([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function remove(id, e) {
    e.stopPropagation();
    e.preventDefault();
    try {
      await base44.entities.StudyNote.delete(id);
    } catch {
      /* ignore */
    }
    setNotes((n) => n.filter((x) => x.id !== id));
    if (active?.id === id) setActive(null);
  }

  if (active) {
    const filebase = (active.title || 'note').replace(/[^a-z0-9]+/gi, '_');
    return (
      <AppShell title={active.title || 'Note'} subtitle={active.subject || 'AP'}>
        <button
          onClick={() => setActive(null)}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All notes
        </button>
        <div className="card-elevated p-6 sm:p-8">
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() =>
                downloadText(
                  `${filebase}.tex`,
                  markdownToLatex(active.content || '', { title: active.title, subject: active.subject }),
                  'application/x-tex'
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-gradient px-3 py-2 text-sm font-semibold text-white shadow-brand"
            >
              <Download className="h-4 w-4" /> Download .tex
            </button>
            <button
              onClick={() => downloadText(`${filebase}.md`, active.content || '', 'text/markdown')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-secondary"
            >
              <Download className="h-4 w-4" /> Markdown
            </button>
          </div>
          <NotesRenderer content={active.content || ''} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Notes"
      subtitle="Your AI-generated study notes."
      actions={
        <Link
          to="/Create"
          className="hidden items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-brand sm:flex"
        >
          <Sparkles className="h-4 w-4" /> Create
        </Link>
      }
    >
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-secondary/60" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="card-elevated flex flex-col items-center p-12 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary">
            <NotebookPen className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="mt-4 font-display text-lg font-bold text-foreground">No notes yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Generate your first study notes from a PDF, YouTube video, or pasted text.
          </p>
          <Link
            to="/Create"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-brand"
          >
            <Sparkles className="h-4 w-4" /> Create a study set
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((n) => (
            <button
              key={n.id}
              onClick={() => setActive(n)}
              className="group card-elevated flex flex-col p-5 text-left transition-transform hover:scale-[1.01]"
            >
              <div className="flex items-start justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
                  <NotebookPen className="h-5 w-5" />
                </div>
                <span
                  onClick={(e) => remove(n.id, e)}
                  className="rounded-lg p-1.5 text-muted-foreground/50 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 line-clamp-2 font-semibold text-foreground group-hover:text-primary">
                {n.title || 'Untitled note'}
              </p>
              <p className="line-clamp-1 text-xs text-muted-foreground">{n.subject || 'AP'}</p>
              <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {n.created_date ? new Date(n.created_date).toLocaleDateString() : ''}
              </div>
            </button>
          ))}
        </div>
      )}
    </AppShell>
  );
}
