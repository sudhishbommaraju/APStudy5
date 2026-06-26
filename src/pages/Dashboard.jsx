import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Upload,
  Youtube,
  Dumbbell,
  Sparkles,
  Flame,
  Zap,
  Coins,
  FolderPlus,
  Folder,
  ChevronRight,
  ArrowLeft,
  MoreVertical,
  Trash2,
  FolderInput,
  NotebookPen,
  Clock,
  Plus,
  X,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const CREATE_CARDS = [
  { title: 'Blank note', sub: 'Paste text & generate', icon: FileText, tint: 'bg-blue-500/15 text-blue-300', to: '/Create?tab=text' },
  { title: 'Upload document', sub: 'PDF, DOCX, or TXT', icon: Upload, tint: 'bg-indigo-500/15 text-indigo-300', to: '/Create?tab=upload' },
  { title: 'YouTube link', sub: 'Turn a video into notes', icon: Youtube, tint: 'bg-red-500/15 text-red-300', to: '/Create?tab=youtube' },
  { title: 'Practice quiz', sub: 'AP questions with AI', icon: Dumbbell, tint: 'bg-emerald-500/15 text-emerald-300', to: '/Practice' },
];

const FOLDER_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

function timeAgo(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

function noteIcon(source) {
  if (source === 'youtube') return { Icon: Youtube, tint: 'bg-red-500/15 text-red-300' };
  if (source === 'upload') return { Icon: Upload, tint: 'bg-indigo-500/15 text-indigo-300' };
  return { Icon: NotebookPen, tint: 'bg-blue-500/15 text-blue-300' };
}

function GamePill({ icon: Icon, value, label, color }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2">
      <Icon className={`h-4 w-4 ${color}`} />
      <span className="text-sm font-semibold text-foreground">{value}</span>
      <span className="hidden text-xs text-muted-foreground sm:inline">{label}</span>
    </div>
  );
}

function NoteRow({ note, folders, onMove, onDelete }) {
  const [menu, setMenu] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setMenu(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const { Icon, tint } = noteIcon(note.source);
  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40">
      <Link to={`/Notes?id=${note.id}`} className="flex min-w-0 flex-1 items-center gap-4">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tint}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground group-hover:text-primary">
            {note.title || 'Untitled note'}
          </p>
          <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            {note.subject || 'AP'} <span className="opacity-40">·</span>
            <Clock className="h-3 w-3" /> {timeAgo(note.created_date)}
          </p>
        </div>
      </Link>
      <div ref={ref} className="relative">
        <button
          onClick={() => setMenu((m) => !m)}
          className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:bg-secondary hover:text-foreground group-hover:opacity-100"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        {menu && (
          <div className="absolute right-0 z-30 mt-1 w-52 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-2xl shadow-black/60">
            <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
              Move to folder
            </p>
            <div className="max-h-44 overflow-y-auto">
              <button
                onClick={() => { onMove(note, ''); setMenu(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-secondary"
              >
                <FolderInput className="h-4 w-4 text-muted-foreground" /> No folder
              </button>
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => { onMove(note, f.id); setMenu(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-secondary"
                >
                  <Folder className="h-4 w-4" style={{ color: f.color }} /> {f.name}
                </button>
              ))}
            </div>
            <div className="my-1 h-px bg-border" />
            <button
              onClick={() => { onDelete(note); setMenu(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function NewFolderModal({ open, onClose, onCreate }) {
  const [name, setName] = useState('');
  useEffect(() => {
    if (open) setName('');
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="card-elevated relative w-full max-w-sm p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-bold text-foreground">New folder</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) onCreate(name.trim());
          }}
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. AP Physics 1"
            className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-brand disabled:opacity-50"
          >
            <FolderPlus className="h-4 w-4" /> Create folder
          </button>
        </form>
      </div>
    </div>
  );
}

function safeCount(p) {
  return p.then((r) => (Array.isArray(r) ? r.length : 0)).catch(() => 0);
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const activeFolderId = params.get('folder') || null;

  const [folders, setFolders] = useState([]);
  const [notes, setNotes] = useState([]);
  const [cards, setCards] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(params.get('newFolder') === '1');

  async function load() {
    setLoading(true);
    const [f, n, c, a] = await Promise.all([
      base44.entities.Folder.list('-created_date', 100).catch(() => []),
      base44.entities.StudyNote.list('-created_date', 200).catch(() => []),
      safeCount(base44.entities.Flashcard.list('-created_date', 1000)),
      safeCount(base44.entities.Attempt.list('-created_date', 1000)),
    ]);
    setFolders(Array.isArray(f) ? f : []);
    setNotes(Array.isArray(n) ? n : []);
    setCards(c);
    setAttempts(a);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (params.get('newFolder') === '1') {
      setModalOpen(true);
      params.delete('newFolder');
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createFolder(name) {
    const color = FOLDER_COLORS[folders.length % FOLDER_COLORS.length];
    try {
      await base44.entities.Folder.create({ name, color });
      window.dispatchEvent(new Event('folders-changed'));
    } catch {
      /* ignore */
    }
    setModalOpen(false);
    load();
  }

  async function deleteFolder(id) {
    try {
      await base44.entities.Folder.delete(id);
      window.dispatchEvent(new Event('folders-changed'));
    } catch {
      /* ignore */
    }
    if (activeFolderId === id) setParams({}, { replace: true });
    load();
  }

  async function moveNote(note, folderId) {
    setNotes((arr) => arr.map((x) => (x.id === note.id ? { ...x, folder_id: folderId } : x)));
    try {
      await base44.entities.StudyNote.update(note.id, { folder_id: folderId });
    } catch {
      /* ignore */
    }
  }

  async function deleteNote(note) {
    setNotes((arr) => arr.filter((x) => x.id !== note.id));
    try {
      await base44.entities.StudyNote.delete(note.id);
    } catch {
      /* ignore */
    }
  }

  const activeFolder = folders.find((f) => f.id === activeFolderId) || null;
  const visibleNotes = useMemo(
    () => (activeFolderId ? notes.filter((n) => n.folder_id === activeFolderId) : notes),
    [notes, activeFolderId]
  );
  const folderCount = (id) => notes.filter((n) => n.folder_id === id).length;

  const points = notes.length * 10 + attempts * 5 + cards * 2;
  const level = Math.floor(points / 100) + 1;
  const streak = user?.current_streak || 0;
  const firstName = (user?.full_name || 'there').split(' ')[0];

  return (
    <AppShell
      title={activeFolder ? activeFolder.name : `Welcome back, ${firstName}`}
      subtitle={activeFolder ? `${visibleNotes.length} item${visibleNotes.length === 1 ? '' : 's'} in this folder` : 'Create, organize, and study — all in one place.'}
      actions={
        <div className="hidden items-center gap-2 md:flex">
          <GamePill icon={Flame} value={streak} label="streak" color="text-orange-400" />
          <GamePill icon={Zap} value={`Lv ${level}`} label="" color="text-blue-400" />
          <GamePill icon={Coins} value={points} label="XP" color="text-amber-400" />
        </div>
      }
    >
      {activeFolder ? (
        /* ---------------- FOLDER VIEW ---------------- */
        <div>
          <button
            onClick={() => setParams({}, { replace: true })}
            className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> All folders
          </button>
          <div className="mb-5 flex flex-wrap gap-3">
            <Link
              to="/Create?tab=upload"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-brand"
            >
              <Plus className="h-4 w-4" /> Add to this folder
            </Link>
            <button
              onClick={() => deleteFolder(activeFolder.id)}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" /> Delete folder
            </button>
          </div>
          {visibleNotes.length === 0 ? (
            <EmptyNotes inFolder />
          ) : (
            <div className="space-y-2.5">
              {visibleNotes.map((n) => (
                <NoteRow key={n.id} note={n} folders={folders} onMove={moveNote} onDelete={deleteNote} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ---------------- MAIN DASHBOARD ---------------- */
        <>
          {/* Create cards */}
          <section>
            <h2 className="mb-3 font-display text-xl font-bold text-foreground">Create something new</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {CREATE_CARDS.map((c) => {
                const Icon = c.icon;
                return (
                  <Link
                    key={c.title}
                    to={c.to}
                    className="group card-elevated flex items-center gap-3.5 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50"
                  >
                    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${c.tint}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{c.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.sub}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Folders */}
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-foreground">Your folders</h2>
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground/80 hover:border-primary/50 hover:text-foreground"
              >
                <FolderPlus className="h-4 w-4" /> New folder
              </button>
            </div>
            {folders.length === 0 ? (
              <button
                onClick={() => setModalOpen(true)}
                className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-5 text-left transition-colors hover:border-primary/50"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
                  <FolderPlus className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Create your first folder</p>
                  <p className="text-xs text-muted-foreground">Group notes by class or subject, NotebookLM-style.</p>
                </div>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {folders.map((f) => (
                  <Link
                    key={f.id}
                    to={`/Dashboard?folder=${f.id}`}
                    className="group card-elevated flex flex-col gap-3 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50"
                  >
                    <div
                      className="grid h-11 w-11 place-items-center rounded-xl"
                      style={{ backgroundColor: `${f.color}26`, color: f.color }}
                    >
                      <Folder className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="truncate font-medium text-foreground group-hover:text-primary">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{folderCount(f.id)} items</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Recent notes */}
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-foreground">Recent</h2>
              <Link to="/Notes" className="text-sm font-semibold text-primary hover:underline">
                View all
              </Link>
            </div>
            {loading ? (
              <div className="space-y-2.5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-2xl bg-secondary/60" />
                ))}
              </div>
            ) : notes.length === 0 ? (
              <EmptyNotes />
            ) : (
              <div className="space-y-2.5">
                {notes.slice(0, 8).map((n) => (
                  <NoteRow key={n.id} note={n} folders={folders} onMove={moveNote} onDelete={deleteNote} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <NewFolderModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={createFolder} />
    </AppShell>
  );
}

function EmptyNotes({ inFolder }) {
  return (
    <div className="card-elevated flex flex-col items-center p-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary">
        <NotebookPen className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="mt-4 font-display text-lg font-bold text-foreground">
        {inFolder ? 'This folder is empty' : 'No study sets yet'}
      </p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Create one from a file, YouTube video, or pasted text — then move it here.
      </p>
      <Link
        to="/Create"
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-brand"
      >
        <Sparkles className="h-4 w-4" /> Create now
      </Link>
    </div>
  );
}
