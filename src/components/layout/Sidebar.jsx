import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  Layers,
  FileText,
  Folder,
  Plus,
  Settings,
  LogOut,
} from 'lucide-react';
import Ic from '@/components/ui/Ic';
import { LogoMark } from '@/components/ui/Logo';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';

const FOLDER_PALETTE = ['#5B9BF8', '#F2BE73', '#57D3A6', '#54C7D2', '#A78BFA', '#F472B6'];

const STUDY = [
  { id: 'practice', to: '/Practice', icon: Target, label: 'Practice' },
  { id: 'flashcards', to: '/Flashcards', icon: Layers, label: 'Flashcards' },
  { id: 'notes', to: '/Notes', icon: FileText, label: 'Notes' },
];

function useFolders() {
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

function NavLink({ to, icon: Icon, label, trailing, leading, active, onNavigate }) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={'pf-navitem' + (active ? ' pf-navitem--active' : '')}
    >
      {leading || <Ic icon={Icon} />}
      <span className="pf-navitem__label">{label}</span>
      {trailing != null && <span className="pf-navitem__trailing">{trailing}</span>}
    </Link>
  );
}

function FolderDot({ color }) {
  return (
    <span className="sidebar__folder-dot" style={{ color }}>
      <Ic icon={Folder} />
    </span>
  );
}

function UserCard() {
  const { user, logout } = useAuth();
  const name = user?.full_name || 'Student';
  const email = user?.email || '';
  const initials = name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div className="usercard">
      <span className="pf-avatar pf-avatar--md pf-avatar--accent">{initials}</span>
      <div className="usercard__meta">
        <div className="usercard__name">{name}</div>
        {email && <div className="usercard__email">{email}</div>}
      </div>
      <Link to="/Settings" className="pf-iconbtn pf-iconbtn--ghost pf-iconbtn--sm" aria-label="Settings" title="Settings">
        <Ic icon={Settings} />
      </Link>
      <button
        onClick={() => logout(true)}
        className="pf-iconbtn pf-iconbtn--ghost pf-iconbtn--sm"
        aria-label="Log out"
        title="Log out"
      >
        <Ic icon={LogOut} />
      </button>
    </div>
  );
}

export function SidebarContent({ onNavigate }) {
  const { pathname } = useLocation();
  const folders = useFolders();
  const is = (to) => pathname.toLowerCase() === to.toLowerCase();

  return (
    <>
      <Link to="/Dashboard" className="sidebar__brand" onClick={onNavigate}>
        <LogoMark size={26} className="shrink-0" />
        <span className="wm">Proofly</span>
      </Link>

      <div className="sidebar__nav">
        <NavLink to="/Dashboard" icon={LayoutDashboard} label="Dashboard" active={is('/Dashboard')} onNavigate={onNavigate} />
      </div>

      <div className="sidebar__group-label">Study</div>
      <div className="sidebar__nav">
        {STUDY.map((it) => (
          <NavLink
            key={it.id}
            to={it.to}
            icon={it.icon}
            label={it.label}
            active={is(it.to)}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      <div className="sidebar__group-label">Library</div>
      <div className="sidebar__nav">
        {folders.map((f, i) => (
          <NavLink
            key={f.id}
            to={`/Notes?folder=${encodeURIComponent(f.id)}`}
            label={f.name || 'Untitled folder'}
            leading={<FolderDot color={f.color || FOLDER_PALETTE[i % FOLDER_PALETTE.length]} />}
            trailing={f.count ?? f.note_count ?? undefined}
            onNavigate={onNavigate}
          />
        ))}
        <Link to="/Notes" onClick={onNavigate} className="pf-navitem sidebar__newfolder">
          <Ic icon={Plus} />
          <span className="pf-navitem__label">New folder</span>
        </Link>
      </div>

      <div className="sidebar__spacer" />
      <UserCard />
    </>
  );
}

export default function Sidebar({ onNavigate }) {
  return (
    <aside className="sidebar">
      <SidebarContent onNavigate={onNavigate} />
    </aside>
  );
}
