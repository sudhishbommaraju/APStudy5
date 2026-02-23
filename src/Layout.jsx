import React from 'react';
import MarketingNavbar from '@/components/navigation/MarketingNavbar';

export default function Layout({ children, currentPageName }) {
  // Pages that don't need the layout wrapper
  const noLayoutPages = ['Onboarding'];
  
  // Marketing pages (use MarketingNavbar)
  const marketingPages = ['Home', 'Diagnostic', 'Results', 'Engine'];

  // No layout for specific pages
  if (noLayoutPages.includes(currentPageName)) {
    return children;
  }

  // All pages now use marketing navbar
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