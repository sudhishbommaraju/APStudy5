import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { NotebookPen, Layers, Dumbbell, Target, BarChart3, Sparkles } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts';
import AppShell from '@/components/layout/AppShell';
import { base44 } from '@/api/base44Client';

function StatCard({ icon: Icon, label, value, tint }) {
  return (
    <div className="card-elevated p-5">
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${tint}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

const BARS = ['#7c3aed', '#9333ea', '#a855f7', '#c026d3', '#d946ef', '#8b5cf6'];

export default function AnalyticsHub() {
  const [stats, setStats] = useState({ notes: 0, cards: 0, attempts: 0, accuracy: 0 });
  const [bySubject, setBySubject] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [notes, cards, attempts] = await Promise.all([
          base44.entities.StudyNote.list('-created_date', 500).catch(() => []),
          base44.entities.Flashcard.list('-created_date', 1000).catch(() => []),
          base44.entities.Attempt.list('-created_date', 1000).catch(() => []),
        ]);
        const att = Array.isArray(attempts) ? attempts : [];
        const correct = att.filter((a) => a.correct).length;
        const accuracy = att.length ? Math.round((correct / att.length) * 100) : 0;

        const counts = {};
        att.forEach((a) => {
          const k = (a.subject || 'Other').replace('AP ', '');
          counts[k] = (counts[k] || 0) + 1;
        });
        const chart = Object.entries(counts)
          .map(([subject, value]) => ({ subject, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6);

        setStats({
          notes: (notes || []).length,
          cards: (cards || []).length,
          attempts: att.length,
          accuracy,
        });
        setBySubject(chart);
      } catch {
        /* ignore */
      }
      setLoading(false);
    })();
  }, []);

  return (
    <AppShell title="Analytics" subtitle="Track your progress across every AP.">
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={NotebookPen} label="Notes created" value={stats.notes} tint="bg-violet-500/15 text-violet-300" />
        <StatCard icon={Layers} label="Flashcards" value={stats.cards} tint="bg-sky-500/15 text-sky-300" />
        <StatCard icon={Dumbbell} label="Questions practiced" value={stats.attempts} tint="bg-emerald-500/15 text-emerald-300" />
        <StatCard icon={Target} label="Accuracy" value={`${stats.accuracy}%`} tint="bg-orange-500/15 text-orange-300" />
      </section>

      <section className="mt-6 card-elevated p-6">
        <h3 className="mb-4 font-display text-lg font-bold text-foreground">Questions by subject</h3>
        {loading ? (
          <div className="h-64 animate-pulse rounded-xl bg-secondary/60" />
        ) : bySubject.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-secondary/30 p-10 text-center">
            <BarChart3 className="h-8 w-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm font-medium text-foreground">No practice data yet</p>
            <p className="text-sm text-muted-foreground">Answer some practice questions to see your breakdown.</p>
            <Link
              to="/Practice"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-brand"
            >
              <Sparkles className="h-4 w-4" /> Start practicing
            </Link>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySubject} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <XAxis dataKey="subject" tick={{ fontSize: 12, fill: '#94a3b8' }} interval={0} angle={-12} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid hsl(217 24% 21%)', background: 'hsl(217 35% 12%)', color: '#fff', fontSize: 13 }}
                  cursor={{ fill: 'rgba(139,92,246,0.10)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {bySubject.map((_, i) => (
                    <Cell key={i} fill={BARS[i % BARS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </AppShell>
  );
}
