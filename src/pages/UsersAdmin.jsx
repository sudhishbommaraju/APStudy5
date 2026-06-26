import React, { useEffect, useState } from 'react';
import { Users as UsersIcon, Mail, Shield, Clock, RefreshCw } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { base44 } from '@/api/base44Client';

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const rows = await base44.auth.listUsers();
      setUsers(Array.isArray(rows) ? rows : []);
    } catch {
      setUsers([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AppShell
      title="Users"
      subtitle="Everyone who has signed up for Proofly."
      actions={
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-secondary"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      }
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-gradient text-white shadow-brand">
          <UsersIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-display text-2xl font-extrabold text-foreground">{users.length}</p>
          <p className="text-sm text-muted-foreground">registered {users.length === 1 ? 'account' : 'accounts'}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-secondary/60" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="card-elevated flex flex-col items-center p-12 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary">
            <UsersIcon className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="mt-4 font-display text-lg font-bold text-foreground">No accounts yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            When someone creates an account from the sign-in screen, they'll show up here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          {users.map((u, i) => {
            const name = u.full_name || u.email || 'User';
            const initial = name.charAt(0).toUpperCase();
            return (
              <div
                key={u.id}
                className={`flex items-center gap-4 bg-card px-4 py-3.5 ${
                  i !== users.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-gradient text-sm font-bold text-white">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{name}</p>
                  <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" /> {u.email || '—'}
                  </p>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-foreground/70">
                    <Shield className="h-3 w-3" /> {u.role || 'user'}
                  </span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium capitalize text-primary">
                    {u.tier || 'free'}
                  </span>
                </div>
                <div className="hidden items-center gap-1 text-xs text-muted-foreground md:flex">
                  <Clock className="h-3 w-3" />
                  {u.created_date ? new Date(u.created_date).toLocaleDateString() : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
