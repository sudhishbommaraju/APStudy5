import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import GlobalNav from '@/components/layout/GlobalNav';
import UpgradeModal from '@/components/monetization/UpgradeModal';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Pages that don't need the layout wrapper
  const noLayoutPages = ['Onboarding'];
  
  // Admin-only pages
  const adminOnlyPages = ['AdminUsers', 'SeedData', 'QuestionValidation'];

  // Protected pages
  const protectedPages = ['Dashboard', 'Practice', 'Exam', 'Tutor', 'Notes', 'Flashcards', 'Progress', 'Generate', 'AdminUsers', 'SeedData', 'MistakeReplay', 'Settings', 'StudyGroups', 'AIStudyPlanner', 'Analytics', 'Rewards', 'Courses', 'GroupDetail', 'CourseBuilder', 'TeacherMode', 'QuestionValidation', 'PracticeWorkspace'];

  useEffect(() => {
    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const currentUser = await base44.auth.me();
          setUser(currentUser);
        } else {
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  // Authentication guard
  useEffect(() => {
    if (!isLoading && !user && protectedPages.includes(currentPageName)) {
      base44.auth.redirectToLogin(window.location.href);
    }
  }, [isLoading, user, currentPageName]);
  
  // Admin access check
  if (user && adminOnlyPages.includes(currentPageName) && user.role !== 'admin') {
    window.location.href = createPageUrl('Dashboard');
    return null;
  }

  // Loading state for protected pages
  if (isLoading && protectedPages.includes(currentPageName)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-indigo-600 rounded-full" />
      </div>
    );
  }

  // No layout for specific pages
  if (noLayoutPages.includes(currentPageName)) {
    return children;
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #0f1728 50%, #0a0e1a 100%)' }}>
      <GlobalNav />
      <main className="max-w-7xl mx-auto px-6 py-8 pt-24">
        {children}
      </main>
      <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
    </div>
  );
}