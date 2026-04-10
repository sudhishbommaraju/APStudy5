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

export default function LandingPage() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('proofly_theme');
    return stored ? stored === 'dark' : false; // default light
  });

  useEffect(() => {
    localStorage.setItem('proofly_theme', isDark ? 'dark' : 'light');
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <div
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        transition: 'background-color 200ms ease-in-out, color 200ms ease-in-out',
        minHeight: '100vh',
        background: isDark ? '#0b0f14' : '#ffffff',
      }}
    >
      <LandingNavbar isDark={isDark} onToggle={toggleTheme} />
      <HeroSection isDark={isDark} />
      <TrustSection isDark={isDark} />
      <StatsCharts isDark={isDark} />
      <FeaturesGrid isDark={isDark} />
      <HowItWorks isDark={isDark} />
      <AnalyticsPreview isDark={isDark} />
      <AboutSection isDark={isDark} />
      <Testimonials isDark={isDark} />
      <LandingCTA isDark={isDark} />
    </div>
  );
}