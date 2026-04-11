import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import UserMenu from './UserMenu';

export default function DashboardNavbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          to={createPageUrl('Dashboard')}
          className="text-xl font-bold text-gray-900 hover:text-gray-600 transition-colors"
        >
          Proofly
        </Link>
        <UserMenu user={user} />
      </div>
    </nav>
  );
}