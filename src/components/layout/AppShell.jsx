import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Dumbbell,
  Layers,
  NotebookPen,
  Timer,
  BarChart3,
  CalendarRange,
  Settings,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  Users,
  Folder,
  FolderPlus,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';

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

const NAV = [{ label: 'Dashboard', to: '/Dashboard', icon: LayoutDashboard }];

function NavItems({ pathname, onNavigate }) {
  return (
    <nav className="flex flex-col gap-1 px-3 pt-2">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = pathname.toLowerCase() === item.to.toLowerCase();
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={[
              'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
              active
                ? 'bg-brand-gradient text-white shadow-brand'
                : 'text-foreground/70 hover:bg-secondary hover:text-foreground',
            ].join(' ')}
          >
            <Icon
              className={[
                'h-[18px] w-[18px] transition-transform group-hover:scale-110',
                active ? 'text-white' : 'text-muted-foreground',
              ].join(' ')}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link to="/Dashboard" className="flex items-center gap-2.5 px-5 py-5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-lg font-extrabold text-white shadow-brand">
        P
      </div>
      <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
        Proofly
      </span>
    </Link>
  );
}

function UserCard() {
  const { user, logout } = useAuth();
  const name = user?.full_name || 'Student';
  const email = user?.email || '';
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="mx-3 mb-3 mt-2 rounded-2xl border border-border bg-secondary/50 p-3">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient text-sm font-bold text-white">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Link
          to="/Settings"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1.5 text-xs font-medium text-foreground/70 hover:text-foreground"
        >
          <Settings className="h-3.5 w-3.5" /> Settings
        </Link>
        <button
          onClick={() => logout(true)}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-3.5 w-3.5" /> Log out
        </button>
      </div>
    </div>
  );
}

/**
 * AppShell — the Turbo.ai-style application chrome (violet sidebar + content).
 * Wrap any signed-in page in this for a consistent, premium look.
 */
export default function AppShell({ children, title, subtitle, actions }) {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-border bg-sidebar lg:flex">
        <Brand />
        <div className="flex-1 overflow-y-auto pb-4">
          <NavItems pathname={pathname} />
        </div>
        <UserCard />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[264px] flex-col border-r border-border bg-sidebar">
            <div className="flex items-center justify-between pr-3">
              <Brand />
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pb-4">
              <NavItems pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </div>
            <UserCard />
          </aside>
        </div>
      )}

      {/* Content */}
      <div className="lg:pl-[264px]">
        <div className="proofly-aurora min-h-screen">
          {/* Topbar */}
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/70 bg-background/80 px-5 py-3.5 backdrop-blur-xl sm:px-8">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 hover:bg-secondary lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            {pathname.toLowerCase() !== '/dashboard' && (
              <Link
                to="/Dashboard"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            )}
            <div className="min-w-0 flex-1">
              {title && (
                <h1 className="truncate font-display text-lg font-bold text-foreground sm:text-xl">
                  {title}
                </h1>
              )}
              {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {actions}
          </header>

          <main className="mx-auto max-w-6xl px-5 py-6 sm:px-8 sm:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
