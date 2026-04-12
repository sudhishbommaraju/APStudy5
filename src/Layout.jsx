import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import MarketingNavbar from '@/components/navigation/MarketingNavbar';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import CookieConsentBanner from '@/components/legal/CookieConsentBanner';
import LegalFooter from '@/components/legal/LegalFooter';

export default function Layout({ children, currentPageName }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    base44.auth.isAuthenticated().then(setIsLoggedIn);
    document.documentElement.classList.remove('dark');
  }, []);

  // SYSTEM RESET - Clear all cached state on mount
  React.useEffect(() => {
    console.log('[RESET] Clearing cached state...');
    localStorage.removeItem('dashboard_active_tab');
    localStorage.removeItem('proofly_theme');
    sessionStorage.clear();
    document.documentElement.classList.remove('dark');
    
    // ENV CHECK
    console.log('[ENV CHECK]', {
      BASE_URL: window.location.origin,
      APP_INITIALIZED: true
    });
  }, []);

  // Pages that don't need the layout wrapper at all
  const noLayoutPages = ['Onboarding', 'Dashboard', 'Upload', 'Youtube', 'CreateNotes', 'SATPractice', 'SATFullTest', 'ACTPractice', 'ACTFullTest', 'APUpload', 'APYoutube', 'APCreate', 'APPractice', 'APFullTest', 'APProgress'];
  // Pages with their own full legal layout (policy pages)
  const legalPages = ['TermsOfService', 'PrivacyPolicy'];
  
  // Marketing pages (use MarketingNavbar)
  const marketingPages = ['Home', 'Diagnostic', 'Results', 'Engine'];

  // Dashboard pages (use DashboardNavbar)
  const dashboardPages = ['Profile', 'EnginePracticeSession', 'EngineResults'];
  
  // Show footer only if not logged in OR on landing page
  const shouldShowFooter = !isLoggedIn || currentPageName === 'LandingPage';

  // No layout wrapper for dashboard pages
  if (noLayoutPages.includes(currentPageName)) {
    return (
      <>
        {children}
        <CookieConsentBanner />
      </>
    );
  }

  // Dashboard pages with navbar
  if (dashboardPages.includes(currentPageName)) {
    return (
      <div>
        <DashboardNavbar />
        {children}
        <CookieConsentBanner />
      </div>
    );
  }

  // Policy/legal pages — simple layout with footer
  if (legalPages.includes(currentPageName)) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0C0C0C]">
        {children}
        <LegalFooter />
        <CookieConsentBanner />
      </div>
    );
  }

  // Marketing pages use navbar
  const isMarketingPage = marketingPages.includes(currentPageName);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {isMarketingPage && <MarketingNavbar />}
      <main className="flex-1">
        {children}
      </main>
      {shouldShowFooter && <LegalFooter />}
      <CookieConsentBanner />
    </div>
  );
}