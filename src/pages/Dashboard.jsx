import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  NotebookPen,
  Plus,
  ArrowRight,
  Activity,
  Clock,
  Flame,
  Target,
  Youtube,
  Upload,
  MoreHorizontal,
  Trash2,
  ExternalLink,
  Sparkles,
  Dumbbell,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import Shell from '@/components/layout/Shell';

/* ---------------- helpers ---------------- */
const WEIGHT = { note: 12, attempt: 2, card: 1 };
const DAY = 24 * 60 * 60 * 1000;
const dayKey = (d) => new Date(d).toISOString().slice(0, 10);
const fmtTime = (min) => {
  if (!min) return '0m';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h}h ${m}m` : `${m}m`;
};
function relTime(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const day = Math.floor(diff / DAY);
  if (day <= 0) return 'Today';
  if (day === 1) return 'Yesterday';
  if (day < 7) return `${day}d ago`;
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/* ---------------- progress chart ---------------- */
function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
function ProgressChart({ data }) {
  const W = 680;
  const H = 150;
  const pad = 8;
  const max = Math.max(10, ...data.map((d) => d.minutes));
  const stepX = (W - pad * 2) / Math.max(1, data.length - 1);
  const pts = data.map((d, i) => [pad + i * stepX, H - pad - (d.minutes / max) * (H - pad * 2)]);
  const line = smoothPath(pts);
  const area = `${line} L ${pts[pts.length - 1][0].toFixed(1)} ${H} L ${pts[0][0].toFixed(1)} ${H} Z`;
  const peak = data.reduce((m, d, i) => (d.minutes > data[m].minutes ? i : m), 0);
  return (
    <>
      <svg className="progress__chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ color: 'var(--pf-accent)' }}>
        <defs>
          <linearGradient id="pf-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#pf-area)" />
        <path d={line} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 4 : 2.5} fill="currentColor" />
        ))}
      </svg>
      <div className="progress__axis">
        {data.map((d, i) => (
          <span key={i} className={i === peak && d.minutes > 0 ? 'is-peak' : ''}>
            {d.day[0]}
          </span>
        ))}
      </div>
    </>
  );
}

/* ---------------- create + recent ---------------- */
const CREATE = [
  { key: 'notes', title: 'Generate notes', sub: 'Paste, upload, or a link', icon: NotebookPen, featured: true, to: '/Create' },
  { key: 'youtube', title: 'YouTube video', sub: 'Turn a lecture into notes', icon: Youtube, tint: 'neutral', to: '/Create?source=youtube' },
  { key: 'upload', title: 'Upload a file', sub: 'PDF, DOC, or slides', icon: Upload, tint: 'neutral', to: '/Create?source=file' },
  { key: 'practice', title: 'Practice', sub: 'AP-style questions', icon: Dumbbell, tint: 'green', to: '/Practice' },
];

function RecentRow({ note, onDelete }) {
  const [menu, setMenu] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setMenu(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const open = () => navigate(`/Notes?id=${note.id}`);
  return (
    <div className="recent-row" onClick={open}>
      <span className="recent-row__icon" style={{ color: 'var(--pf-accent)' }}>
        <NotebookPen />
      </span>
      <div className="recent-row__body">
        <div className="recent-row__title">{note.title || 'Untitled note'}</div>
        <div className="recent-row__sub">{note.subject || 'Study note'}</div>
      </div>
      <span className="recent-row__when">{relTime(note.created_date)}</span>
      <div className="recent-row__menu" ref={ref} onClick={(e) => e.stopPropagation()}>
        <button className="pf-iconbtn pf-iconbtn--sm pf-iconbtn--ghost" onClick={() => setMenu((m) => !m)}>
          <MoreHorizontal />
        </button>
        {menu && (
          <div className="rowmenu">
            <button className="rowmenu__item" onClick={open}>
              <ExternalLink /> Open
            </button>
            <div className="rowmenu__sep" />
            <button
              className="rowmenu__item rowmenu__item--danger"
              onClick={() => {
                setMenu(false);
                onDelete(note);
              }}
            >
              <Trash2 /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- page ---------------- */
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ notes: [], attempts: [], cards: [], loading: true });
  const firstName = (user?.full_name || 'there').split(' ')[0];

  useEffect(() => {
    Promise.all([
      base44.entities.StudyNote.list('-created_date', 500).catch(() => []),
      base44.entities.Attempt.list('-created_date', 2000).catch(() => []),
      base44.entities.Flashcard.list('-created_date', 2000).catch(() => []),
    ]).then(([notes, attempts, cards]) =>
      setData({
        notes: Array.isArray(notes) ? notes : [],
        attempts: Array.isArray(attempts) ? attempts : [],
        cards: Array.isArray(cards) ? cards : [],
        loading: false,
      })
    );
  }, []);

  const stats = useMemo(() => {
    const { notes, attempts, cards } = data;
    const events = [
      ...notes.map((n) => ({ when: n.created_date, w: WEIGHT.note })),
      ...attempts.map((a) => ({ when: a.created_date, w: WEIGHT.attempt })),
      ...cards.map((c) => ({ when: c.created_date, w: WEIGHT.card })),
    ].filter((e) => e.when);
    const minutes = events.reduce((s, e) => s + e.w, 0);
    const sessions = notes.length + Math.ceil(attempts.length / 5);
    const correct = attempts.filter((a) => a.correct).length;
    const accuracy = attempts.length ? Math.round((correct / attempts.length) * 100) : 0;
    const days = new Set(events.map((e) => dayKey(e.when)));
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const k = dayKey(Date.now() - i * DAY);
      if (days.has(k)) streak++;
      else if (i === 0) continue;
      else break;
    }
    const chart = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(Date.now() - i * DAY);
      const k = dayKey(dt);
      const mins = events.filter((e) => dayKey(e.when) === k).reduce((s, e) => s + e.w, 0);
      chart.push({ day: dt.toLocaleDateString(undefined, { weekday: 'short' }), minutes: mins });
    }
    const weekMinutes = chart.reduce((s, d) => s + d.minutes, 0);
    return { minutes, sessions, accuracy, streak, chart, weekMinutes, hasData: events.length > 0 };
  }, [data]);

  const deleteNote = async (note) => {
    if (!window.confirm(`Delete "${note.title || 'this note'}"? This cannot be undone.`)) return;
    try {
      await base44.entities.StudyNote.delete(note.id);
      setData((d) => ({ ...d, notes: d.notes.filter((n) => n.id !== note.id) }));
    } catch {
      /* ignore */
    }
  };

  const lastNote = data.notes[0];
  const todays = data.notes.filter((n) => relTime(n.created_date) === 'Today');
  const earlier = data.notes.filter((n) => relTime(n.created_date) !== 'Today');

  const STAT_CARDS = [
    { icon: Activity, tint: 'blue', label: 'Study sessions', value: String(stats.sessions) },
    { icon: Clock, tint: 'teal', label: 'Time studied', value: fmtTime(stats.minutes) },
    { icon: Flame, tint: 'amber', label: 'Day streak', value: String(stats.streak), unit: stats.streak === 1 ? 'day' : 'days' },
    { icon: Target, tint: 'green', label: 'Accuracy', value: `${stats.accuracy}%` },
  ];

  const lead = (
    <div className="greeting">
      <div className="greeting__hello">Welcome back, {firstName}</div>
      <div className="greeting__sub">
        {stats.streak > 0 ? (
          <>
            You're on a <b>{stats.streak}-day streak</b> — keep it going.
          </>
        ) : (
          "Here's how your studying is going."
        )}
      </div>
    </div>
  );
  const actions = (
    <button className="pf-btn pf-btn--md pf-btn--primary" onClick={() => navigate('/Create')}>
      <Plus /> New
    </button>
  );

  return (
    <Shell lead={lead} actions={actions}>
      {/* Create */}
          <section className="section">
            <div className="section__head">
              <div>
                <div className="section__eyebrow">Start something</div>
                <div className="section__title">Create a study set</div>
              </div>
            </div>
            <div className="create-grid">
              {CREATE.map((c) => (
                <Link key={c.key} to={c.to} className={`pf-source${c.featured ? ' pf-source--featured' : ''}`}>
                  <span className={`pf-source__icon pf-source__icon--${c.featured ? 'accent' : c.tint}`}>
                    <c.icon />
                  </span>
                  <div className="pf-source__body">
                    <div className="pf-source__title">{c.title}</div>
                    <div className="pf-source__subtitle">{c.sub}</div>
                  </div>
                  <span className="pf-source__chevron">
                    <ArrowRight />
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Stats */}
          <section className="section">
            <div className="stats-grid">
              {STAT_CARDS.map((s) => (
                <div key={s.label} className="pf-stat">
                  <div className="pf-stat__top">
                    <span className={`pf-stat__icon pf-stat__icon--${s.tint}`}>
                      <s.icon />
                    </span>
                  </div>
                  <div className="pf-stat__foot">
                    <div className="pf-stat__value">
                      {s.value}
                      {s.unit ? <span className="pf-stat__unit">{s.unit}</span> : null}
                    </div>
                    <div className="pf-stat__label">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Progress + Continue */}
          <section className="section">
            <div className="progress-row">
              <div className="panel">
                <div className="progress__head">
                  <div>
                    <div className="section__title">Your progress</div>
                    <div className="progress__label">Study time · last 7 days</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="progress__total">{fmtTime(stats.weekMinutes)}</div>
                    <div className="progress__label">this week</div>
                  </div>
                </div>
                <ProgressChart data={stats.chart} />
              </div>

              {lastNote ? (
                <button className="continue" onClick={() => navigate(`/Notes?id=${lastNote.id}`)}>
                  <div>
                    <div className="continue__top">
                      <span className="pf-badge pf-badge--accent pf-badge--dot">Pick up where you left off</span>
                    </div>
                    <div className="continue__title">{lastNote.title || 'Untitled note'}</div>
                    <div className="continue__meta">
                      {lastNote.subject || 'Study note'} · {relTime(lastNote.created_date)}
                    </div>
                  </div>
                  <div className="continue__foot">
                    <span className="continue__cta">
                      Resume <ArrowRight />
                    </span>
                  </div>
                </button>
              ) : (
                <div className="continue" style={{ cursor: 'default', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                  <div>
                    <Sparkles style={{ width: 22, height: 22, color: 'var(--pf-accent)' }} />
                    <div className="continue__title" style={{ marginTop: 10 }}>Nothing in progress</div>
                    <div className="continue__meta">Your latest set will show up here.</div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Recent */}
          {data.notes.length > 0 && (
            <section className="section">
              <div className="section__head">
                <div className="section__title">Recent</div>
              </div>
              {todays.length > 0 && (
                <div className="recent-group">
                  <div className="recent-group__label">Today</div>
                  <div className="recent-list">
                    {todays.map((n) => (
                      <RecentRow key={n.id} note={n} onDelete={deleteNote} />
                    ))}
                  </div>
                </div>
              )}
              {earlier.length > 0 && (
                <div className="recent-group">
                  <div className="recent-group__label">Earlier</div>
                  <div className="recent-list">
                    {earlier.map((n) => (
                      <RecentRow key={n.id} note={n} onDelete={deleteNote} />
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
    </Shell>
  );
}
