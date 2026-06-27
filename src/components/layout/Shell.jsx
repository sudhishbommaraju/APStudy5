import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Dumbbell,
  Layers,
  NotebookPen,
  Folder,
  FolderPlus,
  LogOut,
  Menu,
  Sun,
  Moon,
  Play,
  Pause,
  Volume2,
  Music2,
  Music4,
  Brain,
  Radio,
  Wind,
  AudioLines,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/theme';
import { focusAudio, TRACKS } from '@/lib/focusAudio';
import { LogoMark } from '@/components/ui/Logo';

/* ---------------- responsive + data hooks ---------------- */
export function useShellClass() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  if (w < 880) return 'pf-app pf-app--narrow';
  if (w < 1180) return 'pf-app pf-app--mid';
  return 'pf-app';
}

export function useFolders() {
  const [folders, setFolders] = useState([]);
  useEffect(() => {
    let active = true;
    const load = () =>
      base44.entities.Folder.list('-created_date', 100)
        .then((r) => active && setFolders(Array.isArray(r) ? r : []))
        .catch(() => {});
    load();
    const h = () => load();
    window.addEventListener('folders-changed', h);
    return () => {
      active = false;
      window.removeEventListener('folders-changed', h);
    };
  }, []);
  return folders;
}

export async function createFolder() {
  const name = window.prompt('Folder name');
  if (!name || !name.trim()) return;
  try {
    await base44.entities.Folder.create({ name: name.trim() });
    window.dispatchEvent(new Event('folders-changed'));
  } catch {
    /* ignore */
  }
}

/* ---------------- music control center ---------------- */
const QUICK = ['classical', 'electronic', 'binaural', 'white'];
const QUICK_ICON = { classical: Music2, electronic: AudioLines, binaural: Radio, white: Wind };

function SpotifyGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#1DB954"
        d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.96-.6-.12-.421.18-.84.6-.96 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.481.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.16-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
      />
    </svg>
  );
}
const SERVICES = [
  {
    id: 'spotify',
    name: 'Spotify',
    url: 'https://open.spotify.com',
    style: { background: '#fff', border: '1px solid var(--pf-border)' },
    glyph: <SpotifyGlyph />,
  },
  {
    id: 'apple',
    name: 'Apple Music',
    url: 'https://music.apple.com',
    style: { background: 'linear-gradient(150deg, #FB5C74, #FA57C1)' },
    glyph: <Music4 />,
  },
  {
    id: 'brainfm',
    name: 'Brain.fm',
    url: 'https://brain.fm',
    style: { background: 'linear-gradient(150deg, #3B82F6, #1E3A8A)' },
    glyph: <Brain />,
  },
];

export function MusicControl() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState(focusAudio.state());
  const ref = useRef(null);
  useEffect(() => focusAudio.subscribe(setState), []);
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const { current, playing, volume } = state;
  const track = current ? TRACKS.find((t) => t.id === current) : null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className={`musicpill${playing ? ' musicpill--playing' : ''}`} onClick={() => setOpen((o) => !o)}>
        {playing ? (
          <span className="musicpill__eq">
            <i /><i /><i />
          </span>
        ) : (
          <Music2 style={{ width: 16, height: 16, color: 'var(--pf-text-2)' }} />
        )}
        <span className="musicpill__label">{track && playing ? track.name : 'Focus'}</span>
        <span
          className="musicpill__btn"
          onClick={(e) => {
            e.stopPropagation();
            playing ? focusAudio.stop() : focusAudio.play(current || 'classical');
          }}
        >
          {playing ? <Pause /> : <Play />}
        </span>
      </button>

      {open && (
        <div className="cc">
          <div className="cc-panel">
            <div className="cc-now">
              <span className="cc-now__art">
                <Music2 />
              </span>
              <div className="cc-now__meta">
                <div className="cc-now__title">{track ? track.name : 'Nothing playing'}</div>
                <div className="cc-now__src">{track ? track.desc : 'Pick a focus sound'}</div>
              </div>
              <div className="cc-now__controls">
                <button
                  className="pf-iconbtn pf-iconbtn--md pf-iconbtn--ghost"
                  onClick={() => (playing ? focusAudio.stop() : focusAudio.play(current || 'classical'))}
                >
                  {playing ? <Pause /> : <Play />}
                </button>
              </div>
            </div>

            <div className="cc-vol">
              <Volume2 />
              <input
                className="pf-slider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => focusAudio.setVolume(parseFloat(e.target.value))}
              />
            </div>

            <div className="cc-section-label">Proofly focus sounds</div>
            <div className="cc-sounds">
              {QUICK.map((id) => {
                const t = TRACKS.find((x) => x.id === id);
                const Icon = QUICK_ICON[id] || Music2;
                const active = current === id && playing;
                return (
                  <button key={id} className={`cc-sound${active ? ' cc-sound--active' : ''}`} onClick={() => focusAudio.toggle(id)}>
                    <span className="cc-sound__ic">
                      <Icon />
                    </span>
                    <span className="cc-sound__name">{t?.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="cc-section-label">Connect a service</div>
            <div className="cc-connect">
              {SERVICES.map((s) => (
                <a key={s.id} className="cc-conn" href={s.url} target="_blank" rel="noreferrer">
                  <span className="cc-conn__logo" style={s.style}>
                    {s.glyph}
                  </span>
                  <span className="cc-conn__name">{s.name}</span>
                  <span className="cc-conn__btn">Connect</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button className="pf-iconbtn pf-iconbtn--md pf-iconbtn--secondary" title="Toggle theme" onClick={toggle}>
      {theme === 'dark' ? <Sun /> : <Moon />}
    </button>
  );
}

/* ---------------- sidebar ---------------- */
const NAV = [{ label: 'Dashboard', to: '/Dashboard', icon: LayoutDashboard }];
const STUDY = [
  { label: 'Practice', to: '/Practice', icon: Dumbbell },
  { label: 'Flashcards', to: '/Flashcards', icon: Layers },
  { label: 'Notes', to: '/Notes', icon: NotebookPen },
];

export function SidebarBody({ folders, user, onLogout, onNewFolder, onNavigate }) {
  const { pathname } = useLocation();
  const initial = (user?.full_name || user?.email || 'P')[0]?.toUpperCase();
  const isActive = (to) => pathname.toLowerCase() === to.toLowerCase();
  const item = (n) => (
    <Link
      key={n.to}
      to={n.to}
      onClick={onNavigate}
      className={`pf-navitem${isActive(n.to) ? ' pf-navitem--active' : ''}`}
    >
      <n.icon />
      <span className="pf-navitem__label">{n.label}</span>
    </Link>
  );
  return (
    <>
      <Link to="/Dashboard" className="sidebar__brand" onClick={onNavigate}>
        <LogoMark size={28} />
        <span className="wm">Proofly</span>
      </Link>

      <div className="sidebar__nav">{NAV.map(item)}</div>

      <div className="sidebar__group-label">Study</div>
      <div className="sidebar__nav">{STUDY.map(item)}</div>

      <div className="sidebar__group-label">Library</div>
      <div className="sidebar__nav">
        {folders.map((f) => (
          <Link key={f.id} to={`/Dashboard?folder=${f.id}`} onClick={onNavigate} className="pf-navitem">
            <span className="sidebar__folder-dot" style={{ color: 'var(--pf-accent)' }}>
              <Folder />
            </span>
            <span className="pf-navitem__label">{f.name || 'Untitled folder'}</span>
          </Link>
        ))}
        <button className="pf-navitem sidebar__newfolder" onClick={onNewFolder}>
          <FolderPlus />
          <span className="pf-navitem__label">New folder</span>
        </button>
      </div>

      <div className="sidebar__spacer" />

      <div className="usercard">
        <span className="pf-avatar pf-avatar--md pf-avatar--accent">{initial}</span>
        <div className="usercard__meta">
          <div className="usercard__name">{user?.full_name || 'Student'}</div>
          <div className="usercard__email">{user?.email || ''}</div>
        </div>
        <button className="pf-iconbtn pf-iconbtn--sm pf-iconbtn--ghost" title="Log out" onClick={onLogout}>
          <LogOut />
        </button>
      </div>
    </>
  );
}

/* ---------------- the shell ---------------- */
export default function Shell({ lead, actions, children }) {
  const shellClass = useShellClass();
  const { user, logout } = useAuth();
  const folders = useFolders();
  const [drawer, setDrawer] = useState(false);

  const sidebar = (
    <SidebarBody
      folders={folders}
      user={user}
      onLogout={() => logout()}
      onNewFolder={createFolder}
      onNavigate={() => setDrawer(false)}
    />
  );

  return (
    <div className={shellClass}>
      <aside className="sidebar">{sidebar}</aside>

      {drawer && (
        <>
          <div className="drawer-backdrop" onClick={() => setDrawer(false)} />
          <aside className="drawer" style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '22px 16px 16px' }}>
            {sidebar}
          </aside>
        </>
      )}

      <div className="shell-main">
        <header className="topbar">
          <div className="topbar__lead">
            <button className="pf-iconbtn pf-iconbtn--md pf-iconbtn--secondary topbar__menu" onClick={() => setDrawer(true)}>
              <Menu />
            </button>
            {lead}
          </div>
          <div className="topbar__controls">
            <ThemeToggle />
            <MusicControl />
            {actions}
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  );
}
