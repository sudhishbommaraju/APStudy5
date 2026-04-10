import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Sun, Moon } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Analytics', href: '#analytics' },
  { label: 'About', href: '#about' },
  { label: 'Pricing', href: '#pricing' },
];

export default function LandingNavbar({ theme, onToggle }) {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  const handleCTA = async () => {
    const authed = await base44.auth.isAuthenticated();
    if (authed) { navigate('/Dashboard'); } else { base44.auth.redirectToLogin('/Dashboard'); }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: scrolled ? `1px solid ${theme.border}` : '1px solid transparent',
      background: scrolled
        ? theme.isDark ? 'rgba(11,15,20,0.9)' : 'rgba(255,255,255,0.9)'
        : 'transparent',
      transition: 'all 200ms ease-in-out',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 64 }}>
        {/* Logo */}
        <a href="#" style={{ fontWeight: 700, fontSize: 20, color: theme.text, textDecoration: 'none', marginRight: 48, letterSpacing: '-0.02em' }}>
          Proofly
        </a>

        {/* Links */}
        <div style={{ display: 'flex', gap: 32, flex: 1 }} className="hidden-mobile">
          {NAV_LINKS.map(link => (
            <a key={link.label} href={link.href} style={{
              fontSize: 14, fontWeight: 500, color: theme.textMuted,
              textDecoration: 'none', transition: 'color 150ms',
            }}
              onMouseEnter={e => e.target.style.color = theme.text}
              onMouseLeave={e => e.target.style.color = theme.textMuted}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
          {/* Toggle */}
          <button
            onClick={onToggle}
            style={{
              width: 40, height: 40, borderRadius: 10,
              background: theme.bgSecondary,
              border: `1px solid ${theme.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 200ms',
            }}
          >
            {theme.isDark
              ? <Sun size={16} color={theme.textMuted} />
              : <Moon size={16} color={theme.textMuted} />
            }
          </button>

          {/* CTA */}
          <button
            onClick={handleCTA}
            style={{
              background: theme.accent, color: '#fff',
              border: 'none', borderRadius: 10,
              padding: '9px 18px', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', transition: 'all 200ms',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.target.style.transform = 'scale(1.03)'; e.target.style.opacity = '0.92'; }}
            onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.opacity = '1'; }}
          >
            Start Studying Free
          </button>
        </div>
      </div>
    </nav>
  );
}