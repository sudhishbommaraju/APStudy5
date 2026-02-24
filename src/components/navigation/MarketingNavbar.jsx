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
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
        {/* Left: Large Proofly Title */}
        <div>
          <Link to={createPageUrl('Home')}>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              Proofly
            </h1>
          </Link>
          <p className="text-sm text-gray-400 mt-1">
            Adaptive AP & SAT Practice Engine
          </p>
        </div>

        {/* Right: Small Profile Icon */}
        <Link to={createPageUrl('Dashboard')}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </Link>
      </div>
    </div>
  );
}