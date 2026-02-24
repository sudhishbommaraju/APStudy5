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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all ${
      scrolled ? 'bg-[#0C0C0C]/95 backdrop-blur-sm border-b border-[#2A2A2A]' : 'bg-[#0C0C0C]'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to={createPageUrl('Home')} className="text-2xl font-bold text-[#F5F5F5]">
            Proofly
          </Link>
          
          <div className="flex items-center gap-6">
            <Link to={createPageUrl('Home')} className="text-[#B5B5B5] hover:text-[#F5F5F5] transition-colors">
              Home
            </Link>
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="default" size="sm">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}