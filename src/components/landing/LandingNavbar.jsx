import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function LandingNavbar({ isDark, onToggle }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navLinks = ['Features', 'How it Works', 'Analytics', 'About', 'Pricing'];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-200"
      style={{
        background: scrolled
          ? isDark ? 'rgba(11,15,20,0.85)' : 'rgba(255,255,255,0.85)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? `1px solid ${isDark ? '#1f2937' : '#e2e8f0'}` : '1px solid transparent',
      }}
    >
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <span className="font-bold text-lg" style={{ color: isDark ? '#e5e7eb' : '#0f172a' }}>
          Proofly
        </span>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: isDark ? '#9ca3af' : '#64748b' }}
              onMouseEnter={e => e.target.style.color = isDark ? '#e5e7eb' : '#0f172a'}
              onMouseLeave={e => e.target.style.color = isDark ? '#9ca3af' : '#64748b'}
            >
              {link}
            </a>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          {/* Theme toggle */}
          <button
            onClick={onToggle}
            className="relative w-12 h-6 rounded-full transition-all duration-300 flex items-center focus-visible:outline-none focus-visible:ring-2"
            style={{ background: isDark ? '#3b82f6' : '#cbd5e1' }}
            aria-label="Toggle theme"
          >
            <div
              className="absolute w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm"
              style={{
                background: '#fff',
                left: isDark ? '26px' : '2px',
              }}
            >
              {isDark
                ? <Moon className="w-3 h-3 text-blue-600" />
                : <Sun className="w-3 h-3 text-amber-500" />
              }
            </div>
          </button>

          <button
            onClick={() => base44.auth.redirectToLogin()}
            className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: isDark ? '#3b82f6' : '#2563eb',
              color: '#fff',
              boxShadow: isDark ? '0 0 20px rgba(59,130,246,0.35)' : '0 4px 14px rgba(37,99,235,0.25)',
            }}
          >
            Start Studying Free
          </button>
        </div>
      </div>
    </nav>
  );
}