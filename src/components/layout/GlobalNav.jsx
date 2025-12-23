import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown, User, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function GlobalNav() {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const currentUser = await base44.auth.me();
          setUser(currentUser);
        }
      } catch (e) {
        // Not authenticated
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    base44.auth.logout(createPageUrl('Home'));
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl('Dashboard'));
  };

  const handleGetStarted = () => {
    base44.auth.redirectToLogin(createPageUrl('Dashboard'));
  };

  // Marketing pages nav items
  const marketingNavItems = [
    { name: 'Pricing', page: 'Pricing' },
  ];

  // App pages nav items
  const appNavItems = [
    { name: 'Dashboard', page: 'Dashboard' },
    { name: 'Practice', page: 'Practice' },
    { name: 'Exam', page: 'Exam' },
    { name: 'Tutor', page: 'Tutor' },
    { name: 'Notes', page: 'Notes' },
    { name: 'Flashcards', page: 'Flashcards' },
    { name: 'Progress', page: 'Progress' },
  ];

  const navItems = user ? appNavItems : marketingNavItems;

  return (
    <nav className="border-b border-slate-800/50 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-600">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Proofly</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {!isLoading && (
              <>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
                          <User className="w-4 h-4 text-violet-400" />
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-800">
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-medium text-slate-100">{user?.full_name || 'Student'}</p>
                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                      </div>
                      <DropdownMenuSeparator className="bg-slate-800" />
                      <DropdownMenuItem onClick={handleLogout} className="text-rose-400 hover:text-rose-300 hover:bg-slate-800">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <Button onClick={handleLogin} variant="ghost" size="sm" className="hidden sm:flex text-slate-300 hover:text-white hover:bg-slate-800/50">
                      Login
                    </Button>
                    <Button onClick={handleGetStarted} size="sm" className="bg-violet-600 hover:bg-violet-700">
                      Get started
                    </Button>
                  </>
                )}
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-800/50"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-300" />
              ) : (
                <Menu className="w-5 h-5 text-slate-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800/50">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
                >
                  {item.name}
                </Link>
              ))}
              {!user && (
                <Button onClick={handleLogin} variant="ghost" size="sm" className="w-full sm:hidden mt-2 text-slate-300 hover:text-white hover:bg-slate-800/50">
                  Login
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}