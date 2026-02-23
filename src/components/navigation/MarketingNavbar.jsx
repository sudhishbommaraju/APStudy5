import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

export default function MarketingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(15, 17, 21, 0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
        padding: scrolled ? '12px 0' : '20px 0'
      }}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link 
          to={createPageUrl('Home')} 
          className="font-bold tracking-wide"
          style={{ 
            color: '#F3F4F6',
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '24px'
          }}
        >
          PROOFLY
        </Link>

        <div className="flex items-center gap-8">
          <a 
            href="#about" 
            className="font-medium tracking-wide transition-colors relative group"
            style={{ color: '#9CA3AF', fontSize: '18px', fontFamily: 'Inter, sans-serif' }}
            onMouseEnter={(e) => e.target.style.color = '#F3F4F6'}
            onMouseLeave={(e) => e.target.style.color = '#9CA3AF'}
          >
            About
            <span 
              className="absolute bottom-0 left-0 h-0.5 w-0 transition-all group-hover:w-full"
              style={{ background: '#2F6DF6' }}
            />
          </a>
          <a 
            href="#features" 
            className="font-medium tracking-wide transition-colors relative group"
            style={{ color: '#9CA3AF', fontSize: '18px', fontFamily: 'Inter, sans-serif' }}
            onMouseEnter={(e) => e.target.style.color = '#F3F4F6'}
            onMouseLeave={(e) => e.target.style.color = '#9CA3AF'}
          >
            Explore Features
            <span 
              className="absolute bottom-0 left-0 h-0.5 w-0 transition-all group-hover:w-full"
              style={{ background: '#2F6DF6' }}
            />
          </a>
          <Link to={createPageUrl('Dashboard')}>
            <Button 
              className="font-semibold rounded-lg transition-all duration-200 hover:scale-103"
              style={{
                background: '#2F6DF6',
                color: '#F3F4F6',
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '22px',
                padding: '16px 32px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#3C7CFF'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#2F6DF6'}
            >
              Start Diagnostic
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}