import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const NAV_LINKS = ['Features', 'Notes', 'Practice', 'Pricing'];

export default function ProoflyNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 100,
      padding: '0 2rem',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: scrolled ? 'rgba(11,13,14,0.88)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
      transition: 'all 0.25s ease',
    }}>
      {/* Logo */}
      <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '7px',
          background: 'linear-gradient(135deg, #7BAE7F 0%, #5A8A5E 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#0B0D0E' }}>P</span>
        </div>
        <span style={{ fontSize: '1rem', fontWeight: 700, color: '#F5F5F2', letterSpacing: '-0.02em' }}>
          Proofly
        </span>
      </a>

      {/* Center links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="hidden md:flex">
        {NAV_LINKS.map(link => (
          <a key={link} href={`#${link.toLowerCase()}`} style={{
            padding: '0.375rem 0.875rem',
            fontSize: '0.875rem',
            color: '#8A8A8A',
            textDecoration: 'none',
            borderRadius: '8px',
            transition: 'color 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#F5F5F2'}
            onMouseLeave={e => e.currentTarget.style.color = '#8A8A8A'}
          >
            {link}
          </a>
        ))}
      </div>

      {/* Right CTAs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          onClick={() => base44.auth.redirectToLogin()}
          style={{
            padding: '0.4rem 1rem', fontSize: '0.875rem', fontWeight: 500,
            color: '#8A8A8A', background: 'transparent', border: 'none', cursor: 'pointer',
            borderRadius: '8px', transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#F5F5F2'}
          onMouseLeave={e => e.currentTarget.style.color = '#8A8A8A'}
        >
          Log in
        </button>
        <button
          onClick={() => base44.auth.redirectToLogin()}
          style={{
            padding: '0.4rem 1.1rem', fontSize: '0.875rem', fontWeight: 600,
            color: '#0B0D0E', background: '#7BAE7F', border: 'none', cursor: 'pointer',
            borderRadius: '8px', transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#8BC58F'}
          onMouseLeave={e => e.currentTarget.style.background = '#7BAE7F'}
        >
          Start Free
        </button>
      </div>
    </nav>
  );
}