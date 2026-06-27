import React from 'react';
import Shell from '@/components/layout/Shell';

/**
 * AppShell — the application chrome for signed-in pages. It now renders the same
 * Proofly kit shell as the dashboard (shared sidebar, top bar, music, theme
 * toggle), so every page is visually consistent. Same props as before
 * (title, subtitle, actions, children) — no page changes needed.
 */
export default function AppShell({ children, title, subtitle, actions }) {
  const lead = (
    <div className="greeting">
      {title && (
        <div
          style={{
            fontSize: '21px',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            lineHeight: 1.12,
            color: 'var(--pf-text-1)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </div>
      )}
      {subtitle && <div className="greeting__sub">{subtitle}</div>}
    </div>
  );

  return (
    <Shell lead={lead} actions={actions}>
      {children}
    </Shell>
  );
}
