import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

// isOnboardingPage=true  → this IS the onboarding page: redirect away if already onboarded
// isOnboardingPage=false → normal protected page: redirect to onboarding if not yet onboarded
// requireAdmin=true      → page requires admin role: redirect to Dashboard if not admin
export default function ProtectedRoute({ children, isOnboardingPage = false, requireAdmin = false }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuthenticated = await base44.auth.isAuthenticated();

      if (!isAuthenticated) {
        base44.auth.redirectToLogin();
        return;
      }

      const user = await base44.auth.me();
      const onboardingComplete = user.onboarding_complete || false;

      // On the onboarding page: kick out users who already completed onboarding
      if (isOnboardingPage && onboardingComplete) {
        navigate(createPageUrl('Dashboard'));
        return;
      }

      // On a normal page: kick out users who haven't completed onboarding yet
      if (!isOnboardingPage && !onboardingComplete) {
        navigate(createPageUrl('Onboarding'));
        return;
      }

      // Admin-only pages
      if (requireAdmin && user.role !== 'admin') {
        navigate(createPageUrl('Dashboard'));
        return;
      }

      setAuthorized(true);
    } catch {
      base44.auth.redirectToLogin();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white mb-4">Loading...</div>
          <div className="inline-block animate-spin">
            <div className="h-8 w-8 border-4 border-white border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return authorized ? children : null;
}