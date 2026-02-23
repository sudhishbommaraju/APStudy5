import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

export default function ProtectedRoute({ children, requireOnboarding = false }) {
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
        navigate(createPageUrl('Home'));
        return;
      }

      const user = await base44.auth.me();
      const onboardingComplete = user.onboarding_complete || false;

      if (requireOnboarding && onboardingComplete) {
        navigate(createPageUrl('Dashboard'));
        return;
      }

      if (!requireOnboarding && !onboardingComplete) {
        navigate(createPageUrl('Onboarding'));
        return;
      }

      setAuthorized(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate(createPageUrl('Home'));
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