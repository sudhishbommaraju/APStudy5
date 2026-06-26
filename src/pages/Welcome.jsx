import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Clock } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { AP_SUBJECTS, getSubjectCategories, getSubjectsByCategory } from '@/components/studyhub/AP_SUBJECTS';

const CATEGORY_GRADIENT = {
  'Math & CS': 'from-blue-500 to-indigo-500',
  Science: 'from-emerald-500 to-teal-500',
  'History & Social Studies': 'from-amber-500 to-orange-500',
  'English & Arts': 'from-rose-500 to-pink-500',
  'World Languages': 'from-sky-500 to-cyan-500',
};

function SubjectCard({ s }) {
  return (
    <Link
      to={`/study/${s.id}`}
      className="group card-elevated flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50"
    >
      <div
        className={`h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br ${
          CATEGORY_GRADIENT[s.category] || 'from-blue-500 to-indigo-500'
        }`}
      />
      <span className="flex-1 text-sm font-semibold leading-tight text-foreground group-hover:text-primary">
        {s.subject.replace('AP ', '')}
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

export default function Welcome() {
  const { user } = useAuth();
  const [recentIds, setRecentIds] = useState([]);
  const firstName = (user?.full_name || 'there').split(' ')[0];

  useEffect(() => {
    (async () => {
      try {
        const notes = await base44.entities.StudyNote.list('-created_date', 100);
        const ids = [];
        (Array.isArray(notes) ? notes : []).forEach((n) => {
          if (n.subject_id && !ids.includes(n.subject_id)) ids.push(n.subject_id);
        });
        setRecentIds(ids.slice(0, 4));
      } catch {
        setRecentIds([]);
      }
    })();
  }, []);

  const categories = useMemo(() => getSubjectCategories(), []);
  const recentSubjects = recentIds.map((id) => AP_SUBJECTS.find((s) => s.id === id)).filter(Boolean);

  return (
    <AppShell title=" " subtitle=" ">
      <div className="mx-auto max-w-5xl">
        <section className="card-elevated relative mb-8 overflow-hidden p-8 sm:p-10">
          <div className="proofly-aurora pointer-events-none absolute inset-0" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Welcome back
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Hey {firstName} — what do you want to study?
            </h1>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              Pick a subject to jump into your notes, flashcards, quizzes, and study kits.
            </p>
          </div>
        </section>

        {recentSubjects.length > 0 && (
          <section className="mb-8">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-lg font-bold text-foreground">Jump back in</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {recentSubjects.map((s) => (
                <SubjectCard key={s.id} s={s} />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-4 text-lg font-bold text-foreground">All AP subjects</h2>
          <div className="space-y-6">
            {categories.map((cat) => (
              <div key={cat}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {cat}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {getSubjectsByCategory(cat).map((s) => (
                    <SubjectCard key={s.id} s={s} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
