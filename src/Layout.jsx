import React from 'react';
import MarketingNavbar from '@/components/navigation/MarketingNavbar';
import DashboardNavbar from '@/components/layout/DashboardNavbar';

export default function Layout({ children, currentPageName }) {
  // Pages that don't need the layout wrapper at all
  const noLayoutPages = ['Onboarding', 'Dashboard', 'Upload', 'Youtube', 'CreateNotes', 'SATPractice', 'SATFullTest', 'ACTPractice', 'ACTFullTest', 'APUpload', 'APYoutube', 'APCreate', 'APPractice', 'APFullTest', 'APProgress'];
  
  // Marketing pages (use MarketingNavbar)
  const marketingPages = ['Home', 'Diagnostic', 'Results', 'Engine'];

  // Dashboard pages (use DashboardNavbar)
  const dashboardPages = ['Profile', 'EnginePracticeSession', 'EngineResults'];

  // No layout wrapper for dashboard pages
  if (noLayoutPages.includes(currentPageName)) {
    return children;
  }

  // Dashboard pages with navbar
  if (dashboardPages.includes(currentPageName)) {
    return (
      <div>
        <DashboardNavbar />
        {children}
      </div>
    );
  }

  // Marketing pages use navbar
  const isMarketingPage = marketingPages.includes(currentPageName);

  return (
    <div className="min-h-screen bg-[#0C0C0C]">
      {isMarketingPage && <MarketingNavbar />}
      <main>
        {children}
      </main>
    </div>
  );
}