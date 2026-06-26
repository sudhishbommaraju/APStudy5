import React from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/lib/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = (user?.full_name || 'there').split(' ')[0];

  return (
    <AppShell title={`Welcome back, ${firstName}`} subtitle="Your home base.">
      <section className="card-elevated relative overflow-hidden p-10 text-center sm:p-16">
        <div className="proofly-aurora pointer-events-none absolute inset-0" />
        <div className="relative">
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Home
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Clean slate. We&apos;re rebuilding the dashboard from here.
          </p>
        </div>
      </section>
    </AppShell>
  );
}
