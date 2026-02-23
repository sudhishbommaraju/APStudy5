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
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <nav
        className="pointer-events-auto transition-all duration-300"
        style={{
          maxWidth: '1100px',
          margin: '24px auto',
          padding: '16px 32px',
          minHeight: '64px',
          borderRadius: '18px',
          background: 'rgba(15, 17, 21, 0.55)',
          backdropFilter: 'blur(18px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div className="flex items-center justify-between">
          <Link 
            to={createPageUrl('Home')} 
            className="tracking-wide"
            style={{ 
              color: '#F3F4F6',
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '24px',
              fontWeight: '500'
            }}
          >
            PROOFLY
          </Link>

          <div className="flex items-center" style={{ gap: '32px' }}>
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
                className="transition-all duration-200"
                style={{
                  background: '#2F6DF6',
                  color: '#F3F4F6',
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '18px',
                  fontWeight: '500',
                  padding: '8px 24px',
                  borderRadius: '12px'
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
    </div>
  );
}