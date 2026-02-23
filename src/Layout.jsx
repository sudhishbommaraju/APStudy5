import React from 'react';
import MarketingNavbar from '@/components/navigation/MarketingNavbar';

export default function Layout({ children, currentPageName }) {
  // Pages that don't need the layout wrapper at all
  const noLayoutPages = ['Onboarding', 'Dashboard', 'Upload', 'Youtube', 'CreateNotes'];
  
  // Marketing pages (use MarketingNavbar)
  const marketingPages = ['Home', 'Diagnostic', 'Results', 'Engine'];

  // No layout wrapper for dashboard pages
  if (noLayoutPages.includes(currentPageName)) {
    return children;
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