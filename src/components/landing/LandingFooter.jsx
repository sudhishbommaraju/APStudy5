import React from 'react';

export default function LandingFooter({ theme }) {
  return (
    <footer style={{ borderTop: `1px solid ${theme.border}`, padding: '40px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 16, color: theme.text }}>Proofly</span>
          <p style={{ fontSize: 13, color: theme.textMuted, margin: '4px 0 0' }}>
            AI-powered study platform for AP, SAT, and ACT.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 24 }}>
          {['Features', 'How it Works', 'About', 'Pricing'].map(link => (
            <a key={link} href={`#${link.toLowerCase().replace(/ /g, '-')}`} style={{ fontSize: 13, color: theme.textMuted, textDecoration: 'none', transition: 'color 150ms' }}
              onMouseEnter={e => e.target.style.color = theme.text}
              onMouseLeave={e => e.target.style.color = theme.textMuted}
            >
              {link}
            </a>
          ))}
          <a href="/privacy" style={{ fontSize: 13, color: theme.textMuted, textDecoration: 'none' }}>Privacy</a>
          <a href="/terms" style={{ fontSize: 13, color: theme.textMuted, textDecoration: 'none' }}>Terms</a>
        </div>

        <p style={{ fontSize: 13, color: theme.textMuted }}>
          © {new Date().getFullYear()} Proofly. All rights reserved.
        </p>
      </div>
    </footer>
  );
}