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
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none" style={{ marginTop: '32px', marginBottom: '64px' }}>
      <nav
        className="pointer-events-auto transition-all duration-300"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '8px',
          borderRadius: '999px',
          background: 'rgba(20, 20, 20, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div className="flex items-center justify-between" style={{ padding: '16px 24px' }}>
          <Link 
            to={createPageUrl('Home')} 
            style={{ 
              color: '#F3F4F6',
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              fontWeight: '700',
              letterSpacing: '0.03em',
              marginRight: '64px'
            }}
          >
            Proofly
          </Link>

          <div className="flex items-center" style={{ gap: '8px' }}>
            <a 
              href="#about" 
              className="transition-all duration-200"
              style={{ 
                color: '#F3F4F6',
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                fontWeight: '400',
                letterSpacing: '0.03em',
                padding: '8px 18px',
                borderRadius: '999px',
                background: 'transparent'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.08)'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              About
            </a>
            <a 
              href="#features" 
              className="transition-all duration-200"
              style={{ 
                color: '#F3F4F6',
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                fontWeight: '400',
                letterSpacing: '0.03em',
                padding: '8px 18px',
                borderRadius: '999px',
                background: 'transparent'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.08)'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              Explore Features
            </a>
            <Link to={createPageUrl('Diagnostic')}>
              <Button 
                className="transition-all duration-200"
                style={{
                  background: '#2F6DF6',
                  color: '#F3F4F6',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: '500',
                  letterSpacing: '0.03em',
                  padding: '8px 20px',
                  borderRadius: '999px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#3C7CFF'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#2F6DF6'}
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}