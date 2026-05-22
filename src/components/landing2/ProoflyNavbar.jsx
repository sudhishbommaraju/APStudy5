import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Menu } from 'lucide-react';

const NAV_LINKS = ['Features', 'Notes', 'Practice', 'Pricing'];

// ── Logo mark ─────────────────────────────────────────────────────────────────
function ProoflyLogo() {
  return (
    <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
      {/* Icon mark */}
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '9px',
        background: 'linear-gradient(145deg, #5A8A5E 0%, #3D6641 100%)',
        border: '1px solid rgba(255,255,255,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        flexShrink: 0,
      }}>
        {/* Inner highlight */}
        <div style={{
          position: 'absolute',
          top: '2px', left: '4px', right: '4px',
          height: '1px',
          background: 'rgba(255,255,255,0.18)',
          borderRadius: '1px',
        }} />
        {/* P letterform */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 3h5a3 3 0 0 1 0 6H4V3z" fill="#F5F5F2" fillOpacity="0.95" />
          <path d="M4 9v4" stroke="#F5F5F2" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.95" />
        </svg>
      </div>
      {/* Wordmark */}
      <span style={{
        fontSize: '17px',
        fontWeight: 700,
        color: '#F5F5F2',
        letterSpacing: '-0.03em',
        fontFamily: "'Inter', -apple-system, sans-serif",
        lineHeight: 1,
      }}>
        Proofly
      </span>
    </a>
  );
}

// ── Nav link ──────────────────────────────────────────────────────────────────
function NavLink({ label }) {
  const [hover, setHover] = useState(false);
  return (
    <a
      href={`#${label.toLowerCase()}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '8px 13px',
        borderRadius: '999px',
        fontSize: '14px',
        fontWeight: 500,
        color: hover ? '#F5F5F2' : 'rgba(245,245,242,0.6)',
        background: hover ? 'rgba(255,255,255,0.07)' : 'transparent',
        textDecoration: 'none',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
        letterSpacing: '-0.01em',
      }}
    >
      {label}
    </a>
  );
}

// ── Mobile menu ───────────────────────────────────────────────────────────────
function MobileMenu({ open, onClose }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      left: '16px',
      right: '16px',
      borderRadius: '16px',
      background: 'rgba(18,20,22,0.96)',
      backdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.09)',
      boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
      zIndex: 98,
      overflow: 'hidden',
      padding: '0.5rem',
    }}>
      {NAV_LINKS.map(link => (
        <a key={link} href={`#${link.toLowerCase()}`} onClick={onClose} style={{
          display: 'block',
          padding: '0.875rem 1.25rem',
          fontSize: '0.9375rem',
          fontWeight: 500,
          color: 'rgba(245,245,242,0.7)',
          textDecoration: 'none',
          borderRadius: '10px',
          transition: 'background 0.12s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#F5F5F2'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(245,245,242,0.7)'; }}
        >
          {link}
        </a>
      ))}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0.25rem 0.75rem' }} />
      <div style={{ padding: '0.5rem 0.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <button onClick={() => base44.auth.redirectToLogin()} style={{
          padding: '0.75rem 1.25rem', fontSize: '0.9375rem', fontWeight: 500,
          color: 'rgba(245,245,242,0.6)', background: 'transparent',
          border: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: '10px',
        }}>
          Log in
        </button>
        <button onClick={() => base44.auth.redirectToLogin()} style={{
          padding: '0.75rem 1.25rem', fontSize: '0.9375rem', fontWeight: 700,
          color: '#0B0D0E', background: '#7BAE7F',
          border: 'none', cursor: 'pointer', borderRadius: '10px',
        }}>
          Start Free →
        </button>
      </div>
    </div>
  );
}

// ── Main navbar ───────────────────────────────────────────────────────────────
export default function ProoflyNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginHover, setLoginHover] = useState(false);
  const [ctaHover, setCtaHover] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <>
      {/* Outer positioning wrapper */}
      <div style={{
        position: 'fixed',
        top: '16px',
        left: 0,
        right: 0,
        zIndex: 99,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 16px',
        pointerEvents: 'none',
      }}>
        {/* The pill */}
        <nav style={{
          pointerEvents: 'all',
          width: '100%',
          maxWidth: '1100px',
          height: '56px',
          borderRadius: '999px',
          background: scrolled
            ? 'rgba(11,13,14,0.82)'
            : 'rgba(12,14,15,0.55)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: scrolled
            ? '1px solid rgba(255,255,255,0.1)'
            : '1px solid rgba(255,255,255,0.08)',
          boxShadow: scrolled
            ? '0 8px 32px rgba(0,0,0,0.4), 0 20px 60px rgba(0,0,0,0.25)'
            : '0 20px 60px rgba(0,0,0,0.2)',
          transition: 'all 0.25s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.25rem',
        }}>
          {/* Left — Logo */}
          <ProoflyLogo />

          {/* Center — Nav links (desktop) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }} className="hidden md:flex">
            {NAV_LINKS.map(link => <NavLink key={link} label={link} />)}
          </div>

          {/* Right — CTAs (desktop) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }} className="hidden md:flex">
            <button
              onClick={() => base44.auth.redirectToLogin()}
              onMouseEnter={() => setLoginHover(true)}
              onMouseLeave={() => setLoginHover(false)}
              style={{
                padding: '8px 14px',
                fontSize: '14px',
                fontWeight: 500,
                color: loginHover ? '#F5F5F2' : 'rgba(245,245,242,0.55)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '999px',
                transition: 'color 0.15s',
                letterSpacing: '-0.01em',
              }}
            >
              Log in
            </button>
            <button
              onClick={() => base44.auth.redirectToLogin()}
              onMouseEnter={() => setCtaHover(true)}
              onMouseLeave={() => setCtaHover(false)}
              style={{
                padding: '9px 18px',
                fontSize: '14px',
                fontWeight: 700,
                color: '#0B0D0E',
                background: ctaHover ? '#8BC58F' : '#7BAE7F',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '999px',
                transition: 'all 0.15s',
                letterSpacing: '-0.01em',
                boxShadow: ctaHover ? '0 4px 16px rgba(123,174,127,0.35)' : '0 2px 8px rgba(123,174,127,0.2)',
              }}
            >
              Start Free
            </button>
          </div>

          {/* Mobile — hamburger */}
          <button
            onClick={() => setMobileOpen(p => !p)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '999px',
              background: mobileOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(245,245,242,0.7)',
              transition: 'all 0.15s',
            }}
            className="flex md:hidden"
          >
            {mobileOpen ? <X style={{ width: '18px', height: '18px' }} /> : <Menu style={{ width: '18px', height: '18px' }} />}
          </button>
        </nav>
      </div>

      {/* Mobile menu */}
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}