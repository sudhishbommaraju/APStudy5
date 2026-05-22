import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ProoflyNavbar from '@/components/landing2/ProoflyNavbar';
import ProoflyHero from '@/components/landing2/ProoflyHero';
import ChaosToMastery from '@/components/landing2/ChaosToMastery';
import CoreSystems from '@/components/landing2/CoreSystems';
import NotesShowcase from '@/components/landing2/NotesShowcase';
import BuiltForPerformers from '@/components/landing2/BuiltForPerformers';
import SocialProof from '@/components/landing2/SocialProof';
import FinalCTA from '@/components/landing2/FinalCTA';
import ProoflyFooter from '@/components/landing2/ProoflyFooter';

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.isAuthenticated().then(authed => {
      if (authed) navigate('/Dashboard');
    });
  }, []);

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      background: '#0B0D0E',
      color: '#F5F5F2',
      minHeight: '100vh',
      overflowX: 'hidden',
    }}>
      <ProoflyNavbar />
      <ProoflyHero />
      <ChaosToMastery />
      <CoreSystems />
      <NotesShowcase />
      <BuiltForPerformers />
      <SocialProof />
      <FinalCTA />
      <ProoflyFooter />
    </div>
  );
}