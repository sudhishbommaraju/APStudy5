import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { calculateLevel, getTier, getProgressInLevel } from './tierUtils';

const UserProfileContext = createContext();

export function UserProfileProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
    const interval = setInterval(loadProfile, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadProfile = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) return;

      let userData = user;
      
      if (userData.xp === undefined) {
        userData = {
          ...userData,
          xp: 0,
          level: 1,
          tier: 'Beginner'
        };
      }

      const level = calculateLevel(userData.xp || 0);
      const tier = getTier(level);

      setProfile({
        ...userData,
        level,
        tier
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const awardXP = async (amount) => {
    if (!profile) return null;

    const newXP = (profile.xp || 0) + amount;
    const newLevel = calculateLevel(newXP);
    const newTier = getTier(newLevel);
    const leveledUp = newLevel > profile.level;

    try {
      await base44.auth.updateMe({
        xp: newXP,
        level: newLevel,
        tier: newTier
      });

      setProfile(prev => ({
        ...prev,
        xp: newXP,
        level: newLevel,
        tier: newTier
      }));

      return { leveledUp, newLevel, newTier };
    } catch (error) {
      console.error('Failed to award XP:', error);
      return null;
    }
  };

  const getProgress = () => {
    if (!profile) return null;
    return getProgressInLevel(profile.xp || 0, profile.level || 1);
  };

  const value = {
    profile,
    loading,
    xp: profile?.xp || 0,
    level: profile?.level || 1,
    tier: profile?.tier || 'Beginner',
    awardXP,
    getProgress,
    refreshProfile: loadProfile
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within UserProfileProvider');
  }
  return context;
}