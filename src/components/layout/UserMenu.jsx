import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { LogOut, Settings, Mail, Trophy, BookmarkPlus } from 'lucide-react';
import { toast } from 'sonner';
import Leaderboard from '@/components/gamification/Leaderboard';

export default function UserMenu({ user }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
      toast.success('Logged out successfully');
      navigate(createPageUrl('Home'));
    } catch (error) {
      toast.error('Failed to logout');
      console.error(error);
    }
  };

  if (!user) return null;

  const getInitials = () => {
    if (user.full_name) {
      return user.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email[0].toUpperCase();
  };

  const getAvatarColor = () => {
    const colors = ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
    const index = user.email.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white transition-all hover:scale-105"
        style={{ backgroundColor: getAvatarColor() }}
      >
        {getInitials()}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-lg shadow-2xl z-50 animate-in fade-in-0 zoom-in-95"
          style={{
            background: '#171717',
            border: '1px solid #2A2A2A'
          }}
        >
          {/* User Info */}
          <div className="p-4 border-b border-neutral-800">
            <div className="text-sm font-semibold text-white mb-1">
              {user.full_name || 'User'}
            </div>
            <div className="text-xs text-neutral-400 flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {user.email}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="px-4 py-3 border-b border-neutral-800">
            <Leaderboard currentUser={user} />
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => {
                navigate(createPageUrl('StudyPlans'));
                setOpen(false);
              }}
              className="w-full px-4 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-2 transition-colors"
            >
              <BookmarkPlus className="w-4 h-4" />
              Study Plans
            </button>
            <button
              onClick={() => {
                navigate(createPageUrl('Profile'));
                setOpen(false);
              }}
              className="w-full px-4 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-2 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Profile Settings
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-neutral-800 flex items-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}