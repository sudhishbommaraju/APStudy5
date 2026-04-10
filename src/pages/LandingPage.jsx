import React, { useState, useEffect } from 'react';
import LandingNavbar from '@/components/landing/LandingNavbar';
import HeroSection from '@/components/landing/HeroSection';
import TrustSection from '@/components/landing/TrustSection';
import StatsCharts from '@/components/landing/StatsCharts';
import FeaturesGrid from '@/components/landing/FeaturesGrid';
import HowItWorks from '@/components/landing/HowItWorks';
import AnalyticsPreview from '@/components/landing/AnalyticsPreview';
import AboutSection from '@/components/landing/AboutSection';
import Testimonials from '@/components/landing/Testimonials';
import LandingCTA from '@/components/landing/LandingCTA';
import LandingFooter from '@/components/landing/LandingFooter';

export default function LandingPage() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('proofly_theme');
    return stored === 'dark';
  });

  useEffect(() => {
    localStorage.setItem('proofly_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const theme = {
    isDark,
    bg: isDark ? '#0b0f14' : '#ffffff',
    bgSecondary: isDark ? '#111827' : '#f8fafc',
    bgCard: isDark ? '#111827' : '#ffffff',
    text: isDark ? '#e5e7eb' : '#0f172a',
    textMuted: isDark ? '#9ca3af' : '#64748b',
    accent: isDark ? '#3b82f6' : '#2563eb',
    border: isDark ? '#1f2937' : '#e2e8f0',
    shadow: isDark ? '0 0 0 1px #1f2937, 0 4px 24px rgba(59,130,246,0.08)' : '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
  };

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      background: theme.bg,
      color: theme.text,
      transition: 'background-color 200ms ease-in-out, color 200ms ease-in-out',
      minHeight: '100vh',
    }}>
      <LandingNavbar theme={theme} onToggle={() => setIsDark(p => !p)} />
      <HeroSection theme={theme} />
      <TrustSection theme={theme} />
      <StatsCharts theme={theme} />
      <FeaturesGrid theme={theme} />
      <HowItWorks theme={theme} />
      <AnalyticsPreview theme={theme} />
      <AboutSection theme={theme} />
      <Testimonials theme={theme} />
      <LandingCTA theme={theme} />
      <LandingFooter theme={theme} />
    </div>
  );
}