import React from 'react';

const LINKS = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Roadmap', href: '/Roadmap' },
];

export default function ProoflyFooter() {
  return (
    <footer style={{
      padding: '2rem',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      background: '#0B0D0E',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          width: '22px', height: '22px', borderRadius: '5px',
          background: 'linear-gradient(135deg, #7BAE7F 0%, #5A8A5E 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#0B0D0E' }}>P</span>
        </div>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#555', letterSpacing: '-0.01em' }}>Proofly</span>
        <span style={{ fontSize: '0.78rem', color: '#333', marginLeft: '0.5rem' }}>© 2025</span>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem' }}>
        {LINKS.map(link => (
          <a key={link.label} href={link.href} style={{
            fontSize: '0.8rem', color: '#444', textDecoration: 'none', transition: 'color 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#888'}
            onMouseLeave={e => e.currentTarget.style.color = '#444'}
          >
            {link.label}
          </a>
        ))}
      </div>
    </footer>
  );
}